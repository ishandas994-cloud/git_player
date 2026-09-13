package handler

import (
	"net/http"
	"time"

	"github-player-rating/internal/httpx"
)

// Handler is the Vercel Go entrypoint for GET /api/health.
func Handler(w http.ResponseWriter, r *http.Request) {
	if httpx.HandlePreflight(w, r) {
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}