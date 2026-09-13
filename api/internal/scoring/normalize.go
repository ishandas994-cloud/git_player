package scoring

import "math"

// clamp keeps a value within [min, max].
func clamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

// logScale maps a raw count to 0-100 using a log curve, so that e.g. going from
// 10,000 to 20,000 stars barely moves the needle compared to going from 0 to 50.
// `saturationPoint` is the raw value that should map to ~100.
func logScale(raw float64, saturationPoint float64) float64 {
	if raw <= 0 {
		return 0
	}
	if saturationPoint <= 1 {
		saturationPoint = 2
	}
	score := math.Log1p(raw) / math.Log1p(saturationPoint) * 100
	return clamp(score, 0, 100)
}

// linearScale maps a raw value to 0-100 linearly, capped at max.
func linearScale(raw, max float64) float64 {
	if max <= 0 {
		return 0
	}
	return clamp(raw/max*100, 0, 100)
}

// ratioScale converts a 0-1 ratio (e.g. "fraction of repos with a README") into a 0-100 score.
func ratioScale(numerator, denominator float64) float64 {
	if denominator <= 0 {
		return 0
	}
	return clamp(numerator/denominator*100, 0, 100)
}

// average returns the mean of the given scores, ignoring nothing (all inputs count).
func average(scores ...float64) float64 {
	if len(scores) == 0 {
		return 0
	}
	sum := 0.0
	for _, s := range scores {
		sum += s
	}
	return sum / float64(len(scores))
}

// weightedAverage combines values with matching weights (weights need not sum to 1; it normalizes).
func weightedAverage(values []float64, weights []float64) float64 {
	if len(values) != len(weights) || len(values) == 0 {
		return 0
	}
	var sum, wsum float64
	for i, v := range values {
		sum += v * weights[i]
		wsum += weights[i]
	}
	if wsum == 0 {
		return 0
	}
	return sum / wsum
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}