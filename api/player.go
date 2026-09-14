package handler

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github-player-rating/api/internal/cache"
	gh "github-player-rating/api/internal/github"
	"github-player-rating/api/internal/httpx"
	"github-player-rating/api/internal/scoring"
)

// Handler is the Vercel Go entrypoint for GET /api/player?username=...
func Handler(w http.ResponseWriter, r *http.Request) {
	if httpx.HandlePreflight(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		httpx.Error(w, http.StatusMethodNotAllowed, "method_not_allowed", "use GET")
		return
	}

	username := strings.TrimSpace(r.URL.Query().Get("username"))
	if username == "" {
		httpx.Error(w, http.StatusBadRequest, "missing_username", "provide ?username=<github-username>")
		return
	}
	if !httpx.UsernameRe.MatchString(username) {
		httpx.Error(w, http.StatusBadRequest, "invalid_username", "that doesn't look like a valid GitHub username")
		return
	}

	if cached, ok := cache.Shared.Get(cache.PlayerKey(username)); ok {
		httpx.JSON(w, http.StatusOK, cached)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	client := gh.NewClient()
	snap, err := client.FetchSnapshot(ctx, username)
	if err != nil {
		httpx.WriteGitHubError(w, err, username)
		return
	}

	result := scoring.BuildPlayerResult(snap)
	cache.Shared.Set(cache.PlayerKey(username), result)

	httpx.JSON(w, http.StatusOK, result)
}
