package scoring

import (
	"sort"
	"time"

	gh "github-player-rating/api/internal/github"
)

// Metrics holds every derived number the scoring engine and the UI's "detailed analytics"
// page need. Fields are exported so handlers can serialize this directly if useful.
type Metrics struct {
	// Profile
	AccountAgeDays       int
	Followers            int
	Following            int
	PublicRepos          int
	PublicGists          int
	ProfileCompleteness  float64 // 0-1: bio, company, blog, avatar, location present

	// Repositories
	TotalRepos           int
	OriginalRepos        int // non-fork
	ActiveRepos          int // pushed within last 6 months
	ArchivedRepos        int
	TotalStars           int
	TotalForks           int
	TotalWatchers         int
	ReposWithReadme      int
	ReposWithTopics      int
	ReposWithRelease     int
	ReposWithIssuesOn    int
	ReposEnrichedCount   int // how many repos actually got README/release checked (sample size)
	LanguageBreakdown    map[string]int // language -> repo count
	LanguagePercent      map[string]float64
	PrimaryLanguage      string
	LanguageCount        int

	// Activity (from public events, last ~90 days, and contribution calendar if available)
	RecentCommits        int
	RecentPushes         int
	RecentPRsOpened       int
	RecentPRsMerged       int
	RecentIssuesOpened   int
	RecentIssuesClosed   int
	RecentReviews        int
	ActiveDaysLast90     int
	ContributionsLastYear int // from GraphQL calendar; 0 if unauthenticated
	CurrentStreak        int
	LongestStreak        int
	HasCalendarData      bool

	// Collaboration
	ReposContributedTo   int // distinct repos NOT owned by the user, seen in events
	ExternalContributions int
}

var activityEventTypes = map[string]bool{
	"PushEvent":             true,
	"PullRequestEvent":      true,
	"IssuesEvent":           true,
	"PullRequestReviewEvent": true,
	"CreateEvent":           true,
	"ForkEvent":             true,
}

// ComputeMetrics turns a raw Snapshot into the derived Metrics used for scoring.
func ComputeMetrics(snap gh.Snapshot) Metrics {
	m := Metrics{}
	now := time.Now().UTC()

	// --- Profile ---
	m.AccountAgeDays = int(now.Sub(snap.Profile.CreatedAt).Hours() / 24)
	m.Followers = snap.Profile.Followers
	m.Following = snap.Profile.Following
	m.PublicRepos = snap.Profile.PublicRepos
	m.PublicGists = snap.Profile.PublicGists
	m.ProfileCompleteness = profileCompleteness(snap.Profile)

	// --- Repositories ---
	m.LanguageBreakdown = map[string]int{}
	sixMonthsAgo := now.AddDate(0, -6, 0)
	var enriched int

	for _, r := range snap.Repos {
		m.TotalRepos++
		if r.Fork {
			continue // original-vs-fork distinction; forks still count toward totals below
		}
		m.OriginalRepos++
		if r.Archived {
			m.ArchivedRepos++
		}
		if r.PushedAt.After(sixMonthsAgo) {
			m.ActiveRepos++
		}
		m.TotalStars += r.StargazersCount
		m.TotalForks += r.ForksCount
		m.TotalWatchers += r.WatchersCount
		if len(r.Topics) > 0 {
			m.ReposWithTopics++
		}
		if r.HasIssues {
			m.ReposWithIssuesOn++
		}
		if r.Language != "" {
			m.LanguageBreakdown[r.Language]++
		}
		if r.HasReadmeCache != nil {
			enriched++
			if *r.HasReadmeCache {
				m.ReposWithReadme++
			}
			if r.HasReleaseCache != nil && *r.HasReleaseCache {
				m.ReposWithRelease++
			}
		}
	}
	m.ReposEnrichedCount = enriched
	m.LanguageCount = len(m.LanguageBreakdown)
	m.LanguagePercent, m.PrimaryLanguage = languagePercentages(m.LanguageBreakdown)

	// --- Activity from public events (GitHub only exposes ~90 days of public events) ---
	activeDaySet := map[string]bool{}
	ownedRepoNames := map[string]bool{}
	for _, r := range snap.Repos {
		ownedRepoNames[r.FullName] = true
	}
	externalRepoSet := map[string]bool{}

	for _, e := range snap.Events {
		day := e.CreatedAt.Format("2006-01-02")
		if activityEventTypes[e.Type] {
			activeDaySet[day] = true
		}
		switch e.Type {
		case "PushEvent":
			m.RecentPushes++
			m.RecentCommits += len(e.Payload.Commits)
		case "PullRequestEvent":
			m.RecentPRsOpened++
			if e.Payload.Action == "closed" {
				m.RecentPRsMerged++ // approximation: merged PRs surface as "closed" action events
			}
		case "IssuesEvent":
			if e.Payload.Action == "opened" {
				m.RecentIssuesOpened++
			} else if e.Payload.Action == "closed" {
				m.RecentIssuesClosed++
			}
		case "PullRequestReviewEvent":
			m.RecentReviews++
		}
		if !ownedRepoNames[e.Repo.Name] {
			externalRepoSet[e.Repo.Name] = true
		}
	}
	m.ActiveDaysLast90 = len(activeDaySet)
	m.ReposContributedTo = len(externalRepoSet)
	m.ExternalContributions = m.ReposContributedTo

	// --- Contribution calendar (GraphQL, requires auth token; graceful fallback otherwise) ---
	cal := snap.Contributions.ContributionCalendar
	if cal.TotalContributions > 0 || len(cal.Weeks) > 0 {
		m.HasCalendarData = true
		m.ContributionsLastYear = cal.TotalContributions
		m.CurrentStreak, m.LongestStreak = computeStreaks(cal)
	} else {
		// Fallback estimate from the 90-day event window, clearly an approximation.
		m.ContributionsLastYear = m.RecentCommits + m.RecentPRsOpened + m.RecentIssuesOpened
		m.CurrentStreak = estimateRecentStreak(activeDaySet)
		m.LongestStreak = m.CurrentStreak
	}

	return m
}

func profileCompleteness(p gh.Profile) float64 {
	fields := []bool{
		p.Bio != "",
		p.Company != "",
		p.Blog != "",
		p.Location != "",
		p.AvatarURL != "" && !isDefaultAvatar(p.AvatarURL),
		p.Name != "",
	}
	count := 0
	for _, f := range fields {
		if f {
			count++
		}
	}
	return float64(count) / float64(len(fields))
}

func isDefaultAvatar(url string) bool {
	return false // GitHub always serves a generated identicon URL in this field; treat presence as complete.
}

func languagePercentages(breakdown map[string]int) (map[string]float64, string) {
	total := 0
	for _, c := range breakdown {
		total += c
	}
	pct := map[string]float64{}
	primary := ""
	best := -1
	for lang, count := range breakdown {
		if total > 0 {
			pct[lang] = round1(float64(count) / float64(total) * 100)
		}
		if count > best {
			best = count
			primary = lang
		}
	}
	return pct, primary
}

// computeStreaks derives current/longest streak from the GraphQL contribution calendar,
// which gives us a full year of daily granularity (unlike the 90-day events feed).
func computeStreaks(cal gh.ContributionCalendar) (current, longest int) {
	var days []struct {
		date  string
		count int
	}
	for _, w := range cal.Weeks {
		for _, d := range w.ContributionDays {
			days = append(days, struct {
				date  string
				count int
			}{d.Date, d.ContributionCount})
		}
	}
	sort.Slice(days, func(i, j int) bool { return days[i].date < days[j].date })

	run := 0
	best := 0
	for _, d := range days {
		if d.count > 0 {
			run++
			if run > best {
				best = run
			}
		} else {
			run = 0
		}
	}
	longest = best

	// current streak: walk backwards from the most recent day
	cur := 0
	for i := len(days) - 1; i >= 0; i-- {
		if days[i].count > 0 {
			cur++
		} else {
			break
		}
	}
	current = cur
	return current, longest
}

// estimateRecentStreak is a rough fallback when we have no calendar data (unauthenticated mode):
// counts the trailing run of active days within the 90-day event window.
func estimateRecentStreak(activeDays map[string]bool) int {
	streak := 0
	day := time.Now().UTC()
	for {
		key := day.Format("2006-01-02")
		if activeDays[key] {
			streak++
			day = day.AddDate(0, 0, -1)
		} else {
			break
		}
	}
	return streak
}
