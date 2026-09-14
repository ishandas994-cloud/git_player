package scoring

// Attributes holds the six FIFA/EA-FC-style stats, each 0-100.
type Attributes struct {
	PAC int `json:"pac"` // Development Speed
	SHO int `json:"sho"` // Project Execution
	PAS int `json:"pas"` // Collaboration
	DRI int `json:"dri"` // Technical Versatility
	DEF int `json:"def"` // Code Discipline
	PHY int `json:"phy"` // Developer Consistency
}

func applyMix(c CategoryScores, mix attributeMix) int {
	val := c.Activity*mix.Activity +
		c.Projects*mix.Projects +
		c.OpenSource*mix.OpenSource +
		c.Popularity*mix.Popularity +
		c.Consistency*mix.Consistency +
		c.Technical*mix.Technical
	return int(clamp(val, 0, 100) + 0.5) // round to nearest int
}

// ComputeAttributes maps category scores onto the six named attributes using the
// mixes defined in weights.go.
func ComputeAttributes(c CategoryScores) Attributes {
	return Attributes{
		PAC: applyMix(c, pacMix),
		SHO: applyMix(c, shoMix),
		PAS: applyMix(c, pasMix),
		DRI: applyMix(c, driMix),
		DEF: applyMix(c, defMix),
		PHY: applyMix(c, phyMix),
	}
}
