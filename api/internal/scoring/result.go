package scoring

import (
	"sort"
	"time"

	gh "github-player-rating/api/internal/github"
)

func daysSince(t time.Time) int {
	return int(time.Since(t).Hours() / 24)
}

// RepoSummary is the trimmed repo view sent to the frontend for "Repository Performance".
type RepoSummary struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Stars       int      `json:"stars"`
	Forks       int      `json:"forks"`
	Language    string   `json:"language"`
	Topics      []string `json:"topics"`
	URL         string   `json:"url"`
	UpdatedAt   string   `json:"updatedAt"`
}

// LanguageSlice is one entry in the language pie/bar chart.
type LanguageSlice struct {
	Language string  `json:"language"`
	Percent  float64 `json:"percent"`
	Repos    int     `json:"repos"`
}

// PlayerResult is the full JSON payload returned by GET /api/player.
type PlayerResult struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	AvatarURL   string `json:"avatarUrl"`
	Bio         string `json:"bio"`
	Location    string `json:"location"`
	ProfileURL  string `json:"profileUrl"`

	OVR        int             `json:"ovr"`
	Tier       string          `json:"tier"`
	Position   Position        `json:"position"`
	Attributes Attributes      `json:"attributes"`
	Breakdown  []BreakdownItem `json:"breakdown"`
	Insights   Insights        `json:"insights"`

	Overview struct {
		Repositories int `json:"repositories"`
		Stars        int `json:"stars"`
		Followers    int `json:"followers"`
		Following    int `json:"following"`
		Forks        int `json:"forks"`
		RecentCommits int `json:"recentCommits"`
		PullRequests int `json:"pullRequests"`
		Issues       int `json:"issues"`
	} `json:"overview"`

	Activity struct {
		ActiveDaysLast90      int  `json:"activeDaysLast90"`
		CurrentStreak         int  `json:"currentStreak"`
		LongestStreak         int  `json:"longestStreak"`
		ContributionsLastYear int  `json:"contributionsLastYear"`
		IsEstimate            bool `json:"isEstimate"` // true when we lack GraphQL/auth data
	} `json:"activity"`

	Languages  []LanguageSlice `json:"languages"`
	TopRepos   []RepoSummary   `json:"topRepos"`

	Disclaimer string `json:"disclaimer"`
}

const disclaimerText = "GitHub Player Rating is an independent scoring system based on publicly available GitHub data. It is not affiliated with GitHub."

// BuildPlayerResult runs the full scoring pipeline over a fetched snapshot.
func BuildPlayerResult(snap gh.Snapshot) PlayerResult {
	metrics := ComputeMetrics(snap)
	categories := ComputeCategoryScores(metrics)
	attributes := ComputeAttributes(categories)
	overall := ComputeOverall(categories, DefaultWeights)
	techProfile := DetectTechProfile(snap.Repos)
	position := AssignPosition(techProfile, categories)
	insights := GenerateInsights(metrics, categories)

	res := PlayerResult{
		Username:    snap.Profile.Login,
		DisplayName: displayName(snap.Profile),
		AvatarURL:   snap.Profile.AvatarURL,
		Bio:         snap.Profile.Bio,
		Location:    snap.Profile.Location,
		ProfileURL:  snap.Profile.HTMLURL,

		OVR:        overall.OVR,
		Tier:       Tier(overall.OVR),
		Position:   position,
		Attributes: attributes,
		Breakdown:  overall.Breakdown,
		Insights:   insights,

		Disclaimer: disclaimerText,
	}

	res.Overview.Repositories = metrics.PublicRepos
	res.Overview.Stars = metrics.TotalStars
	res.Overview.Followers = metrics.Followers
	res.Overview.Following = metrics.Following
	res.Overview.Forks = metrics.TotalForks
	res.Overview.RecentCommits = metrics.RecentCommits
	res.Overview.PullRequests = metrics.RecentPRsOpened
	res.Overview.Issues = metrics.RecentIssuesOpened + metrics.RecentIssuesClosed

	res.Activity.ActiveDaysLast90 = metrics.ActiveDaysLast90
	res.Activity.CurrentStreak = metrics.CurrentStreak
	res.Activity.LongestStreak = metrics.LongestStreak
	res.Activity.ContributionsLastYear = metrics.ContributionsLastYear
	res.Activity.IsEstimate = !metrics.HasCalendarData

	res.Languages = buildLanguageSlices(metrics)
	res.TopRepos = topRepos(snap.Repos, 6)

	return res
}

func displayName(p gh.Profile) string {
	if p.Name != "" {
		return p.Name
	}
	return p.Login
}

func buildLanguageSlices(m Metrics) []LanguageSlice {
	slices := make([]LanguageSlice, 0, len(m.LanguageBreakdown))
	for lang, count := range m.LanguageBreakdown {
		slices = append(slices, LanguageSlice{
			Language: lang,
			Percent:  m.LanguagePercent[lang],
			Repos:    count,
		})
	}
	sort.Slice(slices, func(i, j int) bool { return slices[i].Percent > slices[j].Percent })
	if len(slices) > 8 {
		slices = slices[:8]
	}
	return slices
}

// topRepos ranks repos by a blended engagement score (stars, forks, recency) and
// returns the top n as trimmed summaries.
func topRepos(repos []gh.Repo, n int) []RepoSummary {
	type scored struct {
		repo  gh.Repo
		score float64
	}
	var candidates []scored
	for _, r := range repos {
		if r.Fork {
			continue
		}
		s := logScale(float64(r.StargazersCount), 200)*0.5 +
			logScale(float64(r.ForksCount), 50)*0.25 +
			logScale(float64(r.Size), 5000)*0.15 +
			recencyScore(r)*0.10
		candidates = append(candidates, scored{r, s})
	}
	sort.Slice(candidates, func(i, j int) bool { return candidates[i].score > candidates[j].score })

	if n > len(candidates) {
		n = len(candidates)
	}
	out := make([]RepoSummary, 0, n)
	for _, c := range candidates[:n] {
		out = append(out, RepoSummary{
			Name:        c.repo.Name,
			Description: c.repo.Description,
			Stars:       c.repo.StargazersCount,
			Forks:       c.repo.ForksCount,
			Language:    c.repo.Language,
			Topics:      c.repo.Topics,
			URL:         "https://github.com/" + c.repo.FullName,
			UpdatedAt:   c.repo.PushedAt.Format("2006-01-02"),
		})
	}
	return out
}

func recencyScore(r gh.Repo) float64 {
	// Buckets by how recently the repo was pushed to: 30/90/180/365 days.
	days := daysSince(r.PushedAt)
	switch {
	case days <= 30:
		return 100
	case days <= 90:
		return 75
	case days <= 180:
		return 50
	case days <= 365:
		return 25
	default:
		return 5
	}
}
