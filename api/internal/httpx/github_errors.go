package httpx

import (
	"errors"
	"net/http"
	"regexp"

	gh "github-player-rating/internal/github"
)

// UsernameRe validates GitHub usernames: alphanumeric + single hyphens, 1-39 chars,
// can't start/end with a hyphen or contain consecutive hyphens.
var UsernameRe = regexp.MustCompile(`^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?![-.])){0,38}$`)

// WriteGitHubError translates a github package error into the right HTTP status + body.
// Centralized here (rather than duplicated per handler file) since Vercel builds each
// /api/*.go file as an independent, isolated function — they can't share sibling helpers.
func WriteGitHubError(w http.ResponseWriter, err error, username string) {
	var rateLimit *gh.ErrRateLimited
	switch {
	case errors.Is(err, gh.ErrNotFound):
		Error(w, http.StatusNotFound, "user_not_found", "no GitHub user found for \""+username+"\"")
	case errors.As(err, &rateLimit):
		Error(w, http.StatusTooManyRequests, "rate_limited", "GitHub API rate limit reached, please try again shortly")
	default:
		Error(w, http.StatusBadGateway, "github_api_error", "couldn't reach GitHub right now, please try again")
	}
}