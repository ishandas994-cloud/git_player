package scoring

import (
	"strings"

	gh "github-player-rating/internal/github"
)

// TechProfile scores (0-1 share of original repos) how strongly a user's repos lean
// toward each development area, based on repo language + topics/description keywords.
type TechProfile struct {
	Frontend float64
	Backend  float64
	AI       float64
	DevOps   float64
	Mobile   float64
}

var frontendLangs = set("JavaScript", "TypeScript", "HTML", "CSS", "Vue", "Svelte")
var backendLangs = set("Java", "Go", "C#", "PHP", "Ruby", "Rust", "Scala", "Elixir", "C", "C++")
var aiLangs = set("Python", "Jupyter Notebook", "R", "Julia")
var devopsLangs = set("Shell", "Dockerfile", "HCL", "Makefile", "PowerShell")
var mobileLangs = set("Swift", "Kotlin", "Dart", "Objective-C")

var aiKeywords = []string{"machine-learning", "deep-learning", "tensorflow", "pytorch", "data-science", "neural-network", "nlp", "computer-vision", "llm", "ai", "ml"}
var devopsKeywords = []string{"docker", "kubernetes", "terraform", "ansible", "ci-cd", "devops", "infrastructure", "ansible", "helm", "ec2", "aws", "gcp", "azure"}
var mobileKeywords = []string{"android", "ios", "flutter", "react-native", "mobile-app", "swiftui"}
var frontendKeywords = []string{"react", "vue", "nextjs", "frontend", "ui", "tailwindcss", "website", "landing-page", "webapp"}
var backendKeywords = []string{"api", "backend", "microservice", "database", "server", "rest-api", "graphql", "grpc"}

func set(items ...string) map[string]bool {
	m := make(map[string]bool, len(items))
	for _, it := range items {
		m[it] = true
	}
	return m
}

func hasAny(haystack string, keywords []string) bool {
	h := strings.ToLower(haystack)
	for _, k := range keywords {
		if strings.Contains(h, k) {
			return true
		}
	}
	return false
}

// DetectTechProfile inspects repo languages, topics and descriptions to estimate
// which development areas the user is strongest in.
func DetectTechProfile(repos []gh.Repo) TechProfile {
	var tp TechProfile
	total := 0.0

	for _, r := range repos {
		if r.Fork {
			continue
		}
		total++
		combined := strings.ToLower(r.Description + " " + strings.Join(r.Topics, " "))

		switch {
		case frontendLangs[r.Language]:
			tp.Frontend++
		case backendLangs[r.Language]:
			tp.Backend++
		case aiLangs[r.Language]:
			tp.AI++
		case devopsLangs[r.Language]:
			tp.DevOps++
		case mobileLangs[r.Language]:
			tp.Mobile++
		}

		if hasAny(combined, aiKeywords) {
			tp.AI += 0.5
		}
		if hasAny(combined, devopsKeywords) {
			tp.DevOps += 0.5
		}
		if hasAny(combined, mobileKeywords) {
			tp.Mobile += 0.5
		}
		if hasAny(combined, frontendKeywords) {
			tp.Frontend += 0.3
		}
		if hasAny(combined, backendKeywords) {
			tp.Backend += 0.3
		}
	}

	if total == 0 {
		return tp
	}
	tp.Frontend /= total
	tp.Backend /= total
	tp.AI /= total
	tp.DevOps /= total
	tp.Mobile /= total
	return tp
}

// Position is the assigned football position plus a short human-readable justification.
type Position struct {
	Code   string `json:"code"`
	Name   string `json:"name"`
	Reason string `json:"reason"`
}

var positionNames = map[string]string{
	"GK":  "Goalkeeper",
	"CB":  "Centre Back",
	"LB":  "Left Back",
	"RB":  "Right Back",
	"CDM": "Defensive Midfielder",
	"CM":  "Central Midfielder",
	"CAM": "Attacking Midfielder",
	"LW":  "Left Winger",
	"RW":  "Right Winger",
	"ST":  "Striker",
}

// AssignPosition runs the algorithmic decision tree from the spec:
// tech-stack lean determines the base position family, category scores break ties
// and decide flanks (LW vs RW) / fullback vs pivot.
// positionCandidate pairs a tech area with its detected strength.
type positionCandidate struct {
	area  string
	score float64
}

func AssignPosition(tp TechProfile, c CategoryScores) Position {
	// Strongest signal wins; ties broken by category-score context.
	candidates := []positionCandidate{
		{"frontend", tp.Frontend},
		{"backend", tp.Backend},
		{"ai", tp.AI},
		{"devops", tp.DevOps},
		{"mobile", tp.Mobile},
	}

	best := candidates[0]
	allZero := true
	for _, cand := range candidates {
		if cand.score > best.score {
			best = cand
		}
		if cand.score > 0 {
			allZero = false
		}
	}

	// No repositories or no detectable tech signal yet — don't guess a specialization.
	if allZero {
		return build("CM", "Not enough repository data yet to detect a specialization.")
	}

	// Highly versatile: no single area dominates (all signals close together) -> CM.
	if isVersatile(candidates) {
		return build("CM", "Balanced activity across frontend, backend and tooling — a true all-rounder.")
	}

	switch {
	case best.area == "ai":
		return build("CAM", "Strong AI/ML and data-science focus in your repositories.")
	case best.area == "devops":
		return build("GK", "Repositories lean heavily on DevOps, infrastructure and reliability tooling.")
	case best.area == "backend":
		if c.Consistency >= 60 {
			return build("CB", "Consistent, structured backend and systems work.")
		}
		return build("CDM", "Backend, APIs and database-focused development.")
	case best.area == "frontend":
		if c.Activity >= 60 {
			// alternate flank based on a stable, deterministic signal (language count parity)
			if int(tp.Frontend*1000)%2 == 0 {
				return build("RW", "Fast-moving frontend/UI development with frequent shipping.")
			}
			return build("LW", "Fast-moving frontend/UI development with frequent shipping.")
		}
		return build("CAM", "Frontend-leaning with creative, feature-driven projects.")
	case best.area == "mobile":
		return build("RB", "Mobile app development focus with cross-platform delivery.")
	default:
		if c.Projects >= 70 && c.Activity >= 65 {
			return build("ST", "High project output and consistent execution.")
		}
		return build("CM", "Balanced developer performing steadily across categories.")
	}
}

func isVersatile(candidates []positionCandidate) bool {
	max, min := 0.0, 1.0
	nonZero := 0
	for _, c := range candidates {
		if c.score > max {
			max = c.score
		}
		if c.score < min {
			min = c.score
		}
		if c.score > 0.05 {
			nonZero++
		}
	}
	// At least 3 areas active and the top area doesn't dominate (<15 percentage points over the rest).
	return nonZero >= 3 && (max-min) < 0.15 && max > 0
}

func build(code, reason string) Position {
	return Position{Code: code, Name: positionNames[code], Reason: reason}
}