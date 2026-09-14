package scoring

import "fmt"

// Insights holds the generated strengths/weaknesses lists.
type Insights struct {
	Strengths []string `json:"strengths"`
	Weaknesses []string `json:"weaknesses"`
}

// GenerateInsights inspects category scores + underlying metrics and writes specific,
// number-backed observations rather than generic filler text.
func GenerateInsights(m Metrics, c CategoryScores) Insights {
	var strengths, weaknesses []string

	type check struct {
		score    float64
		strength string
		weakness string
	}

	checks := []check{
		{
			score:    c.Technical,
			strength: fmt.Sprintf("Strong technical diversity — active in %d languages", m.LanguageCount),
			weakness: "Technical range is narrow — try a project in a new language or stack",
		},
		{
			score:    c.Consistency,
			strength: fmt.Sprintf("Strong contribution consistency — longest streak of %d days", m.LongestStreak),
			weakness: "Contribution activity is sporadic — aim for smaller, regular commits over long gaps",
		},
		{
			score:    c.Projects,
			strength: fmt.Sprintf("Solid project portfolio — %d active original repositories", m.ActiveRepos),
			weakness: "Repository documentation is thin — add READMEs and topics to your projects",
		},
		{
			score:    c.Activity,
			strength: fmt.Sprintf("High recent activity — %d commits and %d active days in the last 90 days", m.RecentCommits, m.ActiveDaysLast90),
			weakness: "Recent activity is low — regular commits in the last 90 days would boost this score",
		},
		{
			score:    c.OpenSource,
			strength: fmt.Sprintf("Good open-source engagement — %d pull requests opened recently", m.RecentPRsOpened),
			weakness: "Increase open-source contributions — opening pull requests and reviewing others' code helps most",
		},
		{
			score:    c.Popularity,
			strength: fmt.Sprintf("Repositories are getting noticed — %d total stars across your projects", m.TotalStars),
			weakness: "Repository visibility is low — clear READMEs and topics make projects easier to discover",
		},
	}

	for _, chk := range checks {
		switch {
		case chk.score >= 65:
			strengths = append(strengths, chk.strength)
		case chk.score < 40:
			weaknesses = append(weaknesses, chk.weakness)
		}
	}

	if len(strengths) == 0 {
		strengths = append(strengths, "Consistent presence on GitHub with room to grow across every category")
	}
	if len(weaknesses) == 0 {
		weaknesses = append(weaknesses, "Maintain current momentum — no significant weak spots detected")
	}

	return Insights{Strengths: strengths, Weaknesses: weaknesses}
}
