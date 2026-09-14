import { GitHubClient } from "./client";
import { Snapshot } from "./types";

const readmeCheckCap = 4;

export async function fetchSnapshot(client: GitHubClient, username: string): Promise<Snapshot> {
  let profile: import("./types").Profile;
  let repos: import("./types").Repo[] = [];
  let events: import("./types").GitHubEvent[] = [];
  let contributions: import("./types").ContributionsCollection;

  profile = await client.getProfile(username);

  try {
    repos = await client.getRepos(username);
  } catch {
    // repos error is not fatal
  }

  try {
    events = await client.getPublicEvents(username);
  } catch {
    // events error is not fatal
  }

  try {
    contributions = await client.getContributions(username);
  } catch {
    contributions = {
      total_commit_contributions: 0,
      total_issue_contributions: 0,
      total_pull_request_contributions: 0,
      total_pull_request_review_contributions: 0,
      total_repositories_with_contributed_commits: 0,
      contribution_calendar: { total_contributions: 0, weeks: [] },
    };
  }

  await enrichTopRepos(client, username, repos);

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