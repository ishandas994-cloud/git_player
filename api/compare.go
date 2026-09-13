package handler

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github-player-rating/internal/cache"
	gh "github-player-rating/internal/github"
	"github-player-rating/internal/httpx"
	"github-player-rating/internal/scoring"
)

// CompareResult is the JSON payload for GET /api/compare.
type CompareResult struct {
	PlayerA scoring.PlayerResult `json:"playerA"`
	PlayerB scoring.PlayerResult `json:"playerB"`
	Winner  string               `json:"winner"` // "A", "B", or "draw"
	ScoreA  int                  `json:"scoreA"` // attribute categories won
	ScoreB  int                  `json:"scoreB"`
	Summary string               `json:"summary"`
}

// Handler is the Vercel Go entrypoint for GET /api/compare?a=...&b=...
func Handler(w http.ResponseWriter, r *http.Request) {
	if httpx.HandlePreflight(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		httpx.Error(w, http.StatusMethodNotAllowed, "method_not_allowed", "use GET")
		return
	}

	userA := strings.TrimSpace(r.URL.Query().Get("a"))
	userB := strings.TrimSpace(r.URL.Query().Get("b"))
	if userA == "" || userB == "" {
		httpx.Error(w, http.StatusBadRequest, "missing_usernames", "provide ?a=<username>&b=<username>")
		return
	}
	if !httpx.UsernameRe.MatchString(userA) || !httpx.UsernameRe.MatchString(userB) {
		httpx.Error(w, http.StatusBadRequest, "invalid_username", "one of the usernames doesn't look valid")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	client := gh.NewClient()

	var (
		wg         sync.WaitGroup
		resA, resB scoring.PlayerResult
		errA, errB error
	)

	fetchOne := func(username string, out *scoring.PlayerResult, outErr *error) {
		defer wg.Done()
		if cached, ok := cache.Shared.Get(cache.PlayerKey(username)); ok {
			*out = cached.(scoring.PlayerResult)
			return
		}
		snap, err := client.FetchSnapshot(ctx, username)
		if err != nil {
			*outErr = err
			return
		}
		result := scoring.BuildPlayerResult(snap)
		cache.Shared.Set(cache.PlayerKey(username), result)
		*out = result
	}

	wg.Add(2)
	go fetchOne(userA, &resA, &errA)
	go fetchOne(userB, &resB, &errB)
	wg.Wait()

	if errA != nil {
		httpx.WriteGitHubError(w, errA, userA)
		return
	}
	if errB != nil {
		httpx.WriteGitHubError(w, errB, userB)
		return
	}

	result := buildComparison(resA, resB)
	httpx.JSON(w, http.StatusOK, result)
}

func buildComparison(a, b scoring.PlayerResult) CompareResult {
	aWins, bWins := 0, 0
	pairs := [][2]int{
		{a.Attributes.PAC, b.Attributes.PAC},
		{a.Attributes.SHO, b.Attributes.SHO},
		{a.Attributes.PAS, b.Attributes.PAS},
		{a.Attributes.DRI, b.Attributes.DRI},
		{a.Attributes.DEF, b.Attributes.DEF},
		{a.Attributes.PHY, b.Attributes.PHY},
	}
	for _, p := range pairs {
		switch {
		case p[0] > p[1]:
			aWins++
		case p[1] > p[0]:
			bWins++
		}
	}

	winner := "draw"
	if aWins > bWins {
		winner = "A"
	} else if bWins > aWins {
		winner = "B"
	}

	return CompareResult{
		PlayerA: a,
		PlayerB: b,
		Winner:  winner,
		ScoreA:  aWins,
		ScoreB:  bWins,
		Summary: buildSummary(a.DisplayName, b.DisplayName, aWins, bWins, winner),
	}
}

func buildSummary(nameA, nameB string, aWins, bWins int, winner string) string {
	a, b := strconv.Itoa(aWins), strconv.Itoa(bWins)
	switch winner {
	case "draw":
		return nameA + " and " + nameB + " tie " + a + "–" + b
	case "A":
		return nameA + " wins " + a + "–" + b
	default:
		return nameB + " wins " + b + "–" + a
	}
}