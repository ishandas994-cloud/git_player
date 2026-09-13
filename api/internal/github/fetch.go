package github

import (
	"context"
	"sort"
	"sync"
	"time"
)

// readmeCheckCap limits how many repos get an extra README/release lookup,
// since that's 2 extra API calls per repo. We only enrich the most-starred repos —
// they dominate the "documentation quality" signal anyway.
const readmeCheckCap = 12

// FetchSnapshot gathers profile, repos, public events and contribution stats concurrently
// (mirrors the spec's "Promise.all where appropriate" performance requirement).
func (c *Client) FetchSnapshot(ctx context.Context, username string) (Snapshot, error) {
	var (
		snap    Snapshot
		wg      sync.WaitGroup
		mu      sync.Mutex
		firstErr error
	)

	setErr := func(err error) {
		if err == nil {
			return
		}
		mu.Lock()
		if firstErr == nil {
			firstErr = err
		}
		mu.Unlock()
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		p, err := c.GetProfile(ctx, username)
		if err != nil {
			setErr(err)
			return
		}
		mu.Lock()
		snap.Profile = p
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		repos, err := c.GetRepos(ctx, username)
		if err != nil {
			// Profile fetch already validates the username exists; a repos error here
			// shouldn't be fatal to the whole request, so we swallow it as "no repos".
			return
		}
		mu.Lock()
		snap.Repos = repos
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		events, err := c.GetPublicEvents(ctx, username)
		if err != nil {
			return
		}
		mu.Lock()
		snap.Events = events
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		contrib, err := c.GetContributions(ctx, username)
		if err != nil {
			return
		}
		mu.Lock()
		snap.Contributions = contrib
		mu.Unlock()
	}()

	wg.Wait()

	if firstErr != nil {
		return Snapshot{}, firstErr
	}

	// Enrich the top-starred repos with README/release presence.
	c.enrichTopRepos(ctx, username, snap.Repos)

	snap.FetchedAt = time.Now().UTC()
	return snap, nil
}

func (c *Client) enrichTopRepos(ctx context.Context, username string, repos []Repo) {
	if len(repos) == 0 {
		return
	}

	sorted := make([]int, len(repos))
	for i := range sorted {
		sorted[i] = i
	}
	sort.Slice(sorted, func(i, j int) bool {
		return repos[sorted[i]].StargazersCount > repos[sorted[j]].StargazersCount
	})

	cap := readmeCheckCap
	if cap > len(sorted) {
		cap = len(sorted)
	}

	var wg sync.WaitGroup
	for _, idx := range sorted[:cap] {
		idx := idx
		wg.Add(1)
		go func() {
			defer wg.Done()
			hasReadme := c.GetReadme(ctx, username, repos[idx].Name)
			hasRelease := c.GetLatestRelease(ctx, username, repos[idx].Name)
			repos[idx].HasReadmeCache = &hasReadme
			repos[idx].HasReleaseCache = &hasRelease
		}()
	}
	wg.Wait()
}