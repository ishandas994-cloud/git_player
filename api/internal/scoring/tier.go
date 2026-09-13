package scoring

// Tier returns the developer-level label for a given OVR (0-100).
func Tier(ovr int) string {
	switch {
	case ovr >= 90:
		return "Legendary Developer"
	case ovr >= 80:
		return "Elite Developer"
	case ovr >= 70:
		return "Advanced Developer"
	case ovr >= 60:
		return "Solid Developer"
	case ovr >= 50:
		return "Developing Developer"
	case ovr >= 40:
		return "Beginner Developer"
	default:
		return "Rookie Developer"
	}
}