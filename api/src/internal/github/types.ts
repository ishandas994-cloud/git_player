export interface Profile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface RepoLicense {
  key: string;
  name: string;
}

export interface Repo {
  name: string;
  full_name: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  size: number;
  language: string | null;
  topics: string[];
  has_issues: boolean;
  open_issues_count: number;
  license: RepoLicense | null;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  has_readme_cache: boolean | null;
  has_release_cache: boolean | null;
}

export interface EventRepo {
  name: string;
}

export interface EventPayloadCommits {
  sha: string;
  message: string;
}

export interface EventPayload {
  commits: EventPayloadCommits[];
  action: string;
}

export interface GitHubEvent {
  type: string;
  created_at: string;
  repo: EventRepo;
  payload: EventPayload;
}

export interface ContributionCalendar {
  total_contributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionDay {
  contribution_count: number;
  date: string;
}

export interface ContributionWeek {
  contribution_days: ContributionDay[];
}

export interface ContributionsCollection {
  total_commit_contributions: number;
  total_issue_contributions: number;
  total_pull_request_contributions: number;
  total_pull_request_review_contributions: number;
  total_repositories_with_contributed_commits: number;
  contribution_calendar: ContributionCalendar;
}

export interface Snapshot {
  profile: Profile;
  repos: Repo[];
  events: GitHubEvent[];
  contributions: ContributionsCollection;
  fetched_at: string;
}

export const emptyContributions: ContributionsCollection = {
  total_commit_contributions: 0,
  total_issue_contributions: 0,
  total_pull_request_contributions: 0,
  total_pull_request_review_contributions: 0,
  total_repositories_with_contributed_commits: 0,
  contribution_calendar: {
    total_contributions: 0,
    weeks: [],
  },
};