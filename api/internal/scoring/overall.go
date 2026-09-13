package scoring

// BreakdownItem is one line of the "why you got this score" panel, e.g. "Activity 22/25".
type BreakdownItem struct {
	Category    string  `json:"category"`
	Score       float64 `json:"score"`       // points earned, out of Max
	Max         float64 `json:"max"`         // category weight * 100
	RawPercent  float64 `json:"rawPercent"`  // the 0-100 category score before weighting
}

// OverallResult bundles the final OVR and its full breakdown.
type OverallResult struct {
	OVR       int             `json:"ovr"`
	Breakdown []BreakdownItem `json:"breakdown"`
}

// ComputeOverall combines category scores with DefaultWeights into a final 0-100 OVR
// plus a transparent breakdown (category -> points earned out of that category's max).
func ComputeOverall(c CategoryScores, w CategoryWeights) OverallResult {
	items := []BreakdownItem{
		{"Activity", round1(c.Activity * w.Activity), round1(w.Activity * 100), round1(c.Activity)},
		{"Projects", round1(c.Projects * w.Projects), round1(w.Projects * 100), round1(c.Projects)},
		{"Open Source", round1(c.OpenSource * w.OpenSource), round1(w.OpenSource * 100), round1(c.OpenSource)},
		{"Popularity", round1(c.Popularity * w.Popularity), round1(w.Popularity * 100), round1(c.Popularity)},
		{"Consistency", round1(c.Consistency * w.Consistency), round1(w.Consistency * 100), round1(c.Consistency)},
		{"Technical Diversity", round1(c.Technical * w.Technical), round1(w.Technical * 100), round1(c.Technical)},
	}

	total := 0.0
	for _, it := range items {
		total += it.Score
	}

	return OverallResult{
		OVR:       int(clamp(total, 0, 100) + 0.5),
		Breakdown: items,
	}
}