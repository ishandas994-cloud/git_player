import { GitHubClient } from "./client.js";
import { Snapshot } from "./types.js";

const readmeCheckCap = 4;

export async function fetchSnapshot(client: GitHubClient, username: string): Promise<Snapshot> {
  let profile: import("./types").Profile;
  let repos: import("./types").Repo[] = [];
  let events: import("./types").GitHubEvent[] = [];
  let contributions: import("./types").ContributionsCollection;

  console.log(`[fetchSnapshot] Fetching profile for ${username}`);
  profile = await client.getProfile(username);
  console.log(`[fetchSnapshot] Profile fetched for ${username}`);

  try {
    console.log(`[fetchSnapshot] Fetching repos for ${username}`);
    repos = await client.getRepos(username);
    console.log(`[fetchSnapshot] Repos fetched for ${username}: ${repos.length} repos`);
  } catch (e) {
    console.error(`[fetchSnapshot] Repos error for ${username}:`, e);
    // repos error is not fatal
  }

  try {
    console.log(`[fetchSnapshot] Fetching events for ${username}`);
    events = await client.getPublicEvents(username);
    console.log(`[fetchSnapshot] Events fetched for ${username}: ${events.length} events`);
  } catch (e) {
    console.error(`[fetchSnapshot] Events error for ${username}:`, e);
    // events error is not fatal
  }

  try {
    console.log(`[fetchSnapshot] Fetching contributions for ${username}`);
    contributions = await client.getContributions(username);
    console.log(`[fetchSnapshot] Contributions fetched for ${username}`);
  } catch (e) {
    console.error(`[fetchSnapshot] Contributions error for ${username}:`, e);
    contributions = {
      total_commit_contributions: 0,
      total_issue_contributions: 0,
      total_pull_request_contributions: 0,
      total_pull_request_review_contributions: 0,
      total_repositories_with_contributed_commits: 0,
      contribution_calendar: { total_contributions: 0, weeks: [] },
    };
  }

  console.log(`[fetchSnapshot] Enriching top repos for ${username}`);
  await enrichTopRepos(client, username, repos);
  console.log(`[fetchSnapshot] Done for ${username}`);

  return {
    profile,
    repos,
    events,
    contributions,
    fetched_at: new Date().toISOString(),
  };
}

async function enrichTopRepos(client: GitHubClient, username: string, repos: import("./types").Repo[]): Promise<void> {
  if (repos.length === 0) return;

  const indexed = repos.map((r, i) => ({ r, i })).sort((a, b) => b.r.stargazers_count - a.r.stargazers_count);
  const cap = Math.min(readmeCheckCap, indexed.length);

  await Promise.all(
    indexed.slice(0, cap).map(async ({ r }) => {
      try {
        r.has_readme_cache = await client.hasReadme(username, r.name);
        r.has_release_cache = await client.hasLatestRelease(username, r.name);
      } catch {
        r.has_readme_cache = false;
        r.has_release_cache = false;
      }
    }),
  );
}