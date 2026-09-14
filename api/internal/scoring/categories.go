package scoring

// CategoryScores holds each weighted category on a 0-100 scale before weighting is applied.
type CategoryScores struct {
	Activity    float64
	Projects    float64
	OpenSource  float64
	Popularity  float64
	Consistency float64
	Technical   float64
}

// ComputeCategoryScores derives the six category scores from Metrics.
// Every sub-signal is normalized (log or ratio scale) before combining, per the spec's
// requirement that large accounts not dwarf smaller, high-quality ones.
func ComputeCategoryScores(m Metrics) CategoryScores {
	return CategoryScores{
		Activity:    activityScore(m),
		Projects:    projectsScore(m),
		OpenSource:  openSourceScore(m),
		Popularity:  popularityScore(m),
		Consistency: consistencyScore(m),
		Technical:   technicalScore(m),
	}
}

// Activity — 25%: commit frequency, active days, recent activity, contribution consistency
func activityScore(m Metrics) float64 {
	commitFreq := logScale(float64(m.RecentCommits), 150)   // ~150 commits/90d is a very active dev
	activeDays := linearScale(float64(m.ActiveDaysLast90), 60) // active >60 of last 90 days = max
	recentContribs := logScale(float64(m.ContributionsLastYear), 1200)
	pushActivity := logScale(float64(m.RecentPushes), 80)

	return average(commitFreq, activeDays, recentContribs, pushActivity)
}

// Projects — 20%: meaningful project count, complexity, diversity, documentation
func projectsScore(m Metrics) float64 {
	// "Meaningful" projects: original, non-archived, with some size (avoids empty scaffolds).
	countScore := logScale(float64(m.OriginalRepos), 40)
	activeRatio := ratioScale(float64(m.ActiveRepos), float64(max1(m.OriginalRepos)))
	docScore := ratioScale(float64(m.ReposWithReadme), float64(max1(m.ReposEnrichedCount)))
	topicsScore := ratioScale(float64(m.ReposWithTopics), float64(max1(m.OriginalRepos)))
	releaseScore := ratioScale(float64(m.ReposWithRelease), float64(max1(m.ReposEnrichedCount)))

	return weightedAverage(
		[]float64{countScore, activeRatio, docScore, topicsScore, releaseScore},
		[]float64{0.35, 0.20, 0.20, 0.10, 0.15},
	)
}

// Open Source — 15%: PRs, issues, reviews, external contributions, forks/contributions
func openSourceScore(m Metrics) float64 {
	prScore := logScale(float64(m.RecentPRsOpened), 20)
	reviewScore := logScale(float64(m.RecentReviews), 15)
	issueScore := logScale(float64(m.RecentIssuesOpened+m.RecentIssuesClosed), 20)
	externalScore := logScale(float64(m.ExternalContributions), 10)

	return weightedAverage(
		[]float64{prScore, reviewScore, issueScore, externalScore},
		[]float64{0.35, 0.25, 0.15, 0.25},
	)
}

// Popularity — 15%: stars, followers, forks, repository engagement
func popularityScore(m Metrics) float64 {
	starScore := logScale(float64(m.TotalStars), 500)
	followerScore := logScale(float64(m.Followers), 300)
	forkScore := logScale(float64(m.TotalForks), 100)
	watcherScore := logScale(float64(m.TotalWatchers), 100)

	return weightedAverage(
		[]float64{starScore, followerScore, forkScore, watcherScore},
		[]float64{0.40, 0.30, 0.20, 0.10},
	)
}

// Consistency — 15%: contribution streak, active months, recent activity, long-term development
func consistencyScore(m Metrics) float64 {
	streakScore := logScale(float64(m.LongestStreak), 120)
	currentStreakScore := logScale(float64(m.CurrentStreak), 30)
	longevityScore := logScale(float64(m.AccountAgeDays), 365*4) // 4 years -> near max, capped modestly
	activeDaysScore := linearScale(float64(m.ActiveDaysLast90), 45)

	return weightedAverage(
		[]float64{streakScore, currentStreakScore, longevityScore, activeDaysScore},
		[]float64{0.35, 0.25, 0.15, 0.25},
	)
}

// Technical Diversity — 10%: languages, frameworks/topics as proxy, technology diversity
func technicalScore(m Metrics) float64 {
	langScore := linearScale(float64(m.LanguageCount), 8) // 8+ languages = max diversity
	// Balance bonus: reward a spread rather than 95% one language + a token second one.
	balanceScore := languageBalanceScore(m.LanguagePercent)
	topicsAsFrameworkProxy := ratioScale(float64(m.ReposWithTopics), float64(max1(m.OriginalRepos)))

	return weightedAverage(
		[]float64{langScore, balanceScore, topicsAsFrameworkProxy},
		[]float64{0.50, 0.30, 0.20},
	)
}

func languageBalanceScore(pct map[string]float64) float64 {
	if len(pct) <= 1 {
		return 0
	}
	// Simple heuristic: 100 minus how dominant the top language is, scaled.
	top := 0.0
	for _, p := range pct {
		if p > top {
			top = p
		}
	}
	// top=100 -> 0 balance; top=40 -> 100 balance (fully spread across many languages)
	score := (100 - top) / 60 * 100
	return clamp(score, 0, 100)
}

func max1(v int) int {
	if v < 1 {
		return 1
	}
	return v
}
