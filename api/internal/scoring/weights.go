package scoring

// CategoryWeights controls how the six scored categories combine into the 0-100 OVR.
// They are intentionally centralized here (rather than hardcoded inline) so they can be
// tuned without touching calculation logic. They must sum to 1.0.
type CategoryWeights struct {
	Activity   float64
	Projects   float64
	OpenSource float64
	Popularity float64
	Consistency float64
	Technical  float64
}

// DefaultWeights mirrors the weighting scheme from the product spec:
// Activity 25%, Projects 20%, Open Source 15%, Popularity 15%, Consistency 15%, Technical 10%.
var DefaultWeights = CategoryWeights{
	Activity:    0.25,
	Projects:    0.20,
	OpenSource:  0.15,
	Popularity:  0.15,
	Consistency: 0.15,
	Technical:   0.10,
}

// AttributeWeights controls how much each category contributes to each of the six
// football-style attributes (PAC/SHO/PAS/DRI/DEF/PHY). Each row sums to 1.0.
// Categories: Activity, Projects, OpenSource, Popularity, Consistency, Technical
type attributeMix struct {
	Activity, Projects, OpenSource, Popularity, Consistency, Technical float64
}

var (
	// PAC — Development Speed: commit frequency, recent activity, push frequency
	pacMix = attributeMix{Activity: 0.70, Consistency: 0.20, Projects: 0.10}
	// SHO — Project Execution: completed projects, quality, releases, repo activity
	shoMix = attributeMix{Projects: 0.65, Activity: 0.20, Popularity: 0.15}
	// PAS — Collaboration: PRs, reviews, issues, contributions to other repos
	pasMix = attributeMix{OpenSource: 0.85, Popularity: 0.15}
	// DRI — Technical Versatility: languages, frameworks, project types
	driMix = attributeMix{Technical: 0.80, Projects: 0.20}
	// DEF — Code Discipline: consistency, documentation, README, structure, issue mgmt
	defMix = attributeMix{Projects: 0.45, Consistency: 0.35, OpenSource: 0.20}
	// PHY — Developer Consistency: active days, long-term activity, streaks, recent activity
	phyMix = attributeMix{Consistency: 0.70, Activity: 0.30}
)
