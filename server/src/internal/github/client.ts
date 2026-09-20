import type { ContributionsCollection, Profile, Repo, GitHubEvent } from './types.js'
import { emptyContributions } from './types.js'

const REST_BASE_URL = 'https://api.github.com'
const GRAPHQL_URL = 'https://api.github.com/graphql'
const DEFAULT_TIMEOUT_MS = 30000

export class NotFoundError extends Error {
  constructor() {
    super('github user not found')
    this.name = 'NotFoundError'
  }
}

export class RateLimitedError extends Error {
  resetAt: Date
  constructor(resetAt: Date) {
    super(`github api rate limit exceeded, resets at ${resetAt.toISOString()}`)
    this.name = 'RateLimitedError'
    this.resetAt = resetAt
  }
}

export class GitHubApiError extends Error {
  status: number
  constructor(status: number, body: string) {
    super(`github api error ${status}: ${body}`)
    this.name = 'GitHubApiError'
    this.status = status
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    return await promise
  } finally {
    clearTimeout(timeout)
  }
}

export class GitHubClient {
  private token: string

  constructor(token = process.env.GITHUB_TOKEN ?? '') {
    this.token = token
  }

  private authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'github-player-rating',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...extra,
    }
  }

  private async getJSON<T>(path: string): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(`${REST_BASE_URL}${path}`, {
        headers: this.authHeaders(),
        signal: controller.signal,
      })
    } catch (err) {
      throw new GitHubApiError(0, `request failed: ${(err as Error).message}`)
    } finally {
      clearTimeout(timeout)
    }

    if (res.status === 404) throw new NotFoundError()

    if (res.status === 403 || res.status === 429) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      const resetUnix = Number(res.headers.get('x-ratelimit-reset') ?? '0');
      if (remaining === '0') {
        throw new RateLimitedError(new Date(resetUnix * 1000));
      }
      const body = await res.text();
      if (body.toLowerCase().includes('rate limit') || body.toLowerCase().includes('abuse detection')) {
        throw new RateLimitedError(new Date(resetUnix * 1000));
      }
      throw new GitHubApiError(res.status, body);
    }

    if (!res.ok) {
      const body = await res.text()
      throw new GitHubApiError(res.status, body)
    }

    return res.json() as Promise<T>
  }

  async getProfile(username: string): Promise<Profile> {
    return this.getJSON<Profile>(`/users/${encodeURIComponent(username)}`)
  }

  /** Fetches up to 300 repos (3 pages x 100), sorted by most recently pushed. */
  async getRepos(username: string): Promise<Repo[]> {
    const all: Repo[] = []
    for (let page = 1; page <= 3; page++) {
      const batch = await this.getJSON<Repo[]>(
        `/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=pushed&type=owner`,
      )
      all.push(...batch)
      if (batch.length < 100) break
    }
    return all
  }

  /** Fetches up to 300 recent public events (GitHub only exposes ~90 days of history). */
  async getPublicEvents(username: string): Promise<GitHubEvent[]> {
    const all: GitHubEvent[] = []
    for (let page = 1; page <= 3; page++) {
      let batch: GitHubEvent[]
      try {
        batch = await this.getJSON<GitHubEvent[]>(
          `/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
        )
      } catch (err) {
        // Events endpoint 404s for some accounts (e.g. orgs); treat as empty rather than fatal.
        if (err instanceof NotFoundError) return all
        throw err
      }
      all.push(...batch)
      if (batch.length < 100) break
    }
    return all
  }

  private static readonly CONTRIBUTIONS_QUERY = `
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

  /**
   * Fetches the last-12-months contribution calendar via GraphQL.
   * Requires an authenticated token (GraphQL has no unauthenticated access) —
   * returns an empty collection if no token is configured, so callers can fall back gracefully.
   */
  async getContributions(username: string): Promise<ContributionsCollection> {
    if (!this.token) return emptyContributions

    let res: Response
    try {
      res = await withTimeout(
        fetch(GRAPHQL_URL, {
          method: 'POST',
          headers: this.authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            query: GitHubClient.CONTRIBUTIONS_QUERY,
            variables: { login: username },
          }),
        }),
        DEFAULT_TIMEOUT_MS,
      )
    } catch (err) {
      throw new GitHubApiError(0, `graphql request failed: ${(err as Error).message}`)
    }

    if (!res.ok) {
      const body = await res.text()
      throw new GitHubApiError(res.status, `graphql error: ${body}`)
    }

    const parsed = (await res.json()) as {
      data?: { user?: { contributionsCollection: any } }
      errors?: { message: string }[]
    }
    if (parsed.errors && parsed.errors.length > 0) {
      throw new GitHubApiError(res.status, `graphql error: ${parsed.errors[0].message}`)
    }

    const raw = parsed.data?.user?.contributionsCollection
    if (!raw) return emptyContributions

    return {
      total_commit_contributions: raw.totalCommitContributions ?? 0,
      total_issue_contributions: raw.totalIssueContributions ?? 0,
      total_pull_request_contributions: raw.totalPullRequestContributions ?? 0,
      total_pull_request_review_contributions: raw.totalPullRequestReviewContributions ?? 0,
      total_repositories_with_contributed_commits: raw.totalRepositoriesWithContributedCommits ?? 0,
      contribution_calendar: {
        total_contributions: raw.contributionCalendar?.totalContributions ?? 0,
        weeks: (raw.contributionCalendar?.weeks ?? []).map((w: any) => ({
          contribution_days: (w.contributionDays ?? []).map((d: any) => ({
            contribution_count: d.contributionCount ?? 0,
            date: d.date,
          })),
        })),
      },
    } as ContributionsCollection
  }

  /** Checks whether a repo has a README. */
  async hasReadme(owner: string, repo: string): Promise<boolean> {
    try {
      const res = await fetch(`${REST_BASE_URL}/repos/${owner}/${repo}/readme`, {
        headers: this.authHeaders(),
      })
      return res.ok
    } catch {
      return false
    }
  }

  /** Checks whether a repo has at least one release. */
  async hasLatestRelease(owner: string, repo: string): Promise<boolean> {
    try {
      const res = await fetch(`${REST_BASE_URL}/repos/${owner}/${repo}/releases/latest`, {
        headers: this.authHeaders(),
      })
      return res.ok
    } catch {
      return false
    }
  }
}