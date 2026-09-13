package github

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"
)

const (
	restBaseURL    = "https://api.github.com"
	graphQLURL     = "https://api.github.com/graphql"
	defaultTimeout = 8 * time.Second
)

// ErrNotFound is returned when the requested GitHub username does not exist.
var ErrNotFound = errors.New("github user not found")

// ErrRateLimited is returned when GitHub's API rate limit has been exhausted.
type ErrRateLimited struct {
	ResetAt time.Time
}

func (e *ErrRateLimited) Error() string {
	return fmt.Sprintf("github api rate limit exceeded, resets at %s", e.ResetAt.Format(time.RFC3339))
}

// Client wraps GitHub REST + GraphQL access.
type Client struct {
	http  *http.Client
	token string
}

// NewClient builds a Client. Token is read from the GITHUB_TOKEN env var; if empty,
// requests are made unauthenticated (60 req/hr instead of 5000 req/hr).
func NewClient() *Client {
	return &Client{
		http:  &http.Client{Timeout: defaultTimeout},
		token: os.Getenv("GITHUB_TOKEN"),
	}
}

func (c *Client) authHeader(req *http.Request) {
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "github-player-rating")
}

// doREST performs a GET request against the GitHub REST API and decodes JSON into out.
func (c *Client) doREST(ctx context.Context, path string, out interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, restBaseURL+path, nil)
	if err != nil {
		return err
	}
	c.authHeader(req)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("github request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return ErrNotFound
	}
	if resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests {
		if remaining := resp.Header.Get("X-RateLimit-Remaining"); remaining == "0" {
			resetUnix, _ := strconv.ParseInt(resp.Header.Get("X-RateLimit-Reset"), 10, 64)
			return &ErrRateLimited{ResetAt: time.Unix(resetUnix, 0)}
		}
	}
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("github api error %d: %s", resp.StatusCode, string(body))
	}

	return json.NewDecoder(resp.Body).Decode(out)
}

// GetProfile fetches GET /users/{username}
func (c *Client) GetProfile(ctx context.Context, username string) (Profile, error) {
	var p Profile
	err := c.doREST(ctx, "/users/"+username, &p)
	return p, err
}

// GetRepos fetches all pages of GET /users/{username}/repos (sorted by pushed, capped at 300).
func (c *Client) GetRepos(ctx context.Context, username string) ([]Repo, error) {
	var all []Repo
	for page := 1; page <= 3; page++ { // 3 pages * 100 = 300 repos cap, generous for a portfolio-scale tool
		var batch []Repo
		path := fmt.Sprintf("/users/%s/repos?per_page=100&page=%d&sort=pushed&type=owner", username, page)
		if err := c.doREST(ctx, path, &batch); err != nil {
			return nil, err
		}
		all = append(all, batch...)
		if len(batch) < 100 {
			break
		}
	}
	return all, nil
}

// GetPublicEvents fetches GET /users/{username}/events/public (up to 300 most recent public events).
func (c *Client) GetPublicEvents(ctx context.Context, username string) ([]Event, error) {
	var all []Event
	for page := 1; page <= 3; page++ {
		var batch []Event
		path := fmt.Sprintf("/users/%s/events/public?per_page=100&page=%d", username, page)
		if err := c.doREST(ctx, path, &batch); err != nil {
			// Events endpoint 404s for some accounts (e.g. orgs); treat as empty rather than fatal.
			if errors.Is(err, ErrNotFound) {
				return all, nil
			}
			return nil, err
		}
		all = append(all, batch...)
		if len(batch) < 100 {
			break
		}
	}
	return all, nil
}

const contributionsQuery = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}`

// GetContributions fetches the last-12-months contribution calendar via GraphQL.
// Requires an authenticated token (GraphQL API has no unauthenticated access).
func (c *Client) GetContributions(ctx context.Context, username string) (ContributionsCollection, error) {
	var empty ContributionsCollection
	if c.token == "" {
		// Without a token we simply can't call GraphQL; caller falls back to REST-derived estimates.
		return empty, nil
	}

	body, _ := json.Marshal(map[string]interface{}{
		"query":     contributionsQuery,
		"variables": map[string]string{"login": username},
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, graphQLURL, bytes.NewReader(body))
	if err != nil {
		return empty, err
	}
	c.authHeader(req)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return empty, fmt.Errorf("github graphql request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return empty, fmt.Errorf("github graphql error %d: %s", resp.StatusCode, string(respBody))
	}

	var parsed graphQLResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return empty, err
	}
	if len(parsed.Errors) > 0 {
		return empty, fmt.Errorf("github graphql error: %s", parsed.Errors[0].Message)
	}
	return parsed.Data.User.ContributionsCollection, nil
}

// GetReadme checks whether a repo has a README via a lightweight HEAD-style GET on the contents API.
func (c *Client) GetReadme(ctx context.Context, owner, repo string) bool {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, restBaseURL+"/repos/"+owner+"/"+repo+"/readme", nil)
	if err != nil {
		return false
	}
	c.authHeader(req)
	resp, err := c.http.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// GetLatestRelease checks whether a repo has at least one release.
func (c *Client) GetLatestRelease(ctx context.Context, owner, repo string) bool {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, restBaseURL+"/repos/"+owner+"/"+repo+"/releases/latest", nil)
	if err != nil {
		return false
	}
	c.authHeader(req)
	resp, err := c.http.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}