import { Snapshot } from "../github/types";
import * as normalize from "./normalize";

export interface Metrics {
  accountAgeDays: number;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  profileCompleteness: number;
  totalRepos: number;
  originalRepos: number;
  activeRepos: number;
  archivedRepos: number;
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  reposWithReadme: number;
  reposWithTopics: number;
  reposWithRelease: number;
  reposWithIssuesOn: number;
  reposEnrichedCount: number;
  languageBreakdown: Record<string, number>;
  languagePercent: Record<string, number>;
  primaryLanguage: string;
  languageCount: number;
  recentCommits: number;
  recentPushes: number;
  recentPRsOpened: number;
  recentPRsMerged: number;
  recentIssuesOpened: number;
  recentIssuesClosed: number;
  recentReviews: number;
  activeDaysLast90: number;
  contributionsLastYear: number;
  currentStreak: number;
  longestStreak: number;
  hasCalendarData: boolean;
  reposContributedTo: number;
  externalContributions: number;
}

const activityEventTypes: Record<string, boolean> = {
  PushEvent: true,
  PullRequestEvent: true,
  IssuesEvent: true,
  PullRequestReviewEvent: true,
  CreateEvent: true,
  ForkEvent: true,
};

export function computeMetrics(snap: Snapshot): Metrics {
  const m: Metrics = {
    accountAgeDays: 0,
    followers: 0,
    following: 0,
    publicRepos: 0,
    publicGists: 0,
    profileCompleteness: 0,
    totalRepos: 0,
    originalRepos: 0,
    activeRepos: 0,
    archivedRepos: 0,
    totalStars: 0,
    totalForks: 0,
    totalWatchers: 0,
    reposWithReadme: 0,
    reposWithTopics: 0,
    reposWithRelease: 0,
    reposWithIssuesOn: 0,
    reposEnrichedCount: 0,
    languageBreakdown: {},
    languagePercent: {},
    primaryLanguage: "",
    languageCount: 0,
    recentCommits: 0,
    recentPushes: 0,
    recentPRsOpened: 0,
    recentPRsMerged: 0,
    recentIssuesOpened: 0,
    recentIssuesClosed: 0,
    recentReviews: 0,
    activeDaysLast90: 0,
    contributionsLastYear: 0,
    currentStreak: 0,
    longestStreak: 0,
    hasCalendarData: false,
    reposContributedTo: 0,
    externalContributions: 0,
  };

  const now = new Date();

  m.accountAgeDays = Math.floor((now.getTime() - new Date(snap.profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
  m.followers = snap.profile.followers;
  m.following = snap.profile.following;
  m.publicRepos = snap.profile.public_repos;
  m.publicGists = snap.profile.public_gists;
  m.profileCompleteness = profileCompleteness(snap.profile);

  m.languageBreakdown = {};
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
  let enriched = 0;

  for (const r of snap.repos) {
    m.totalRepos++;
    if (r.fork) continue;
    m.originalRepos++;
    if (r.archived) m.archivedRepos++;
    if (new Date(r.pushed_at).getTime() > sixMonthsAgo.getTime()) {
      m.activeRepos++;
    }
    m.totalStars += r.stargazers_count;
    m.totalForks += r.forks_count;
    m.totalWatchers += r.watchers_count;
    if (r.topics.length > 0) m.reposWithTopics++;
    if (r.has_issues) m.reposWithIssuesOn++;
    if (r.language) {
      m.languageBreakdown[r.language] = (m.languageBreakdown[r.language] || 0) + 1;
    }
    if (r.has_readme_cache !== null && r.has_readme_cache !== undefined) {
      enriched++;
      if (r.has_readme_cache) m.reposWithReadme++;
      if (r.has_release_cache !== null && r.has_release_cache) m.reposWithRelease++;
    }
  }
  m.reposEnrichedCount = enriched;
  m.languageCount = Object.keys(m.languageBreakdown).length;
  const langResult = languagePercentages(m.languageBreakdown);
  m.languagePercent = langResult.pct;
  m.primaryLanguage = langResult.primary;

  const activeDaySet: Record<string, boolean> = {};
  const ownedRepoNames: Record<string, boolean> = {};
  for (const r of snap.repos) {
    ownedRepoNames[r.full_name] = true;
  }
  const externalRepoSet: Record<string, boolean> = {};

  for (const e of snap.events) {
    const day = e.created_at.slice(0, 10);
    if (activityEventTypes[e.type]) {
      activeDaySet[day] = true;
    }
    switch (e.type) {
      case "PushEvent":
        m.recentPushes++;
        m.recentCommits += e.payload.commits.length;
        break;
      case "PullRequestEvent":
        m.recentPRsOpened++;
        if (e.payload.action === "closed") {
          m.recentPRsMerged++;
        }
        break;
      case "IssuesEvent":
        if (e.payload.action === "opened") {
          m.recentIssuesOpened++;
        } else if (e.payload.action === "closed") {
          m.recentIssuesClosed++;
        }
        break;
      case "PullRequestReviewEvent":
        m.recentReviews++;
        break;
    }
    if (!ownedRepoNames[e.repo.name]) {
      externalRepoSet[e.repo.name] = true;
    }
  }
  m.activeDaysLast90 = Object.keys(activeDaySet).length;
  m.reposContributedTo = Object.keys(externalRepoSet).length;
  m.externalContributions = m.reposContributedTo;

  const cal = snap.contributions.contribution_calendar;
  if (cal.total_contributions > 0 || cal.weeks.length > 0) {
    m.hasCalendarData = true;
    m.contributionsLastYear = cal.total_contributions;
    const streakResult = computeStreaks(cal);
    m.currentStreak = streakResult.current;
    m.longestStreak = streakResult.longest;
  } else {
    m.contributionsLastYear = m.recentCommits + m.recentPRsOpened + m.recentIssuesOpened;
    m.currentStreak = estimateRecentStreak(activeDaySet);
    m.longestStreak = m.currentStreak;
  }

  return m;
}

function profileCompleteness(p: {
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  avatar_url: string;
  name: string | null;
}): number {
  const fields = [
    p.bio !== "",
    p.company !== "",
    p.blog !== "",
    p.location !== "",
    p.avatar_url !== "" && !isDefaultAvatar(p.avatar_url),
    p.name !== "",
  ];
  let count = 0;
  for (const f of fields) {
    if (f) count++;
  }
  return count / fields.length;
}

function isDefaultAvatar(url: string): boolean {
  return false;
}

function languagePercentages(breakdown: Record<string, number>): { pct: Record<string, number>; primary: string } {
  let total = 0;
  for (const c of Object.values(breakdown)) {
    total += c;
  }
  const pct: Record<string, number> = {};
  let primary = "";
  let best = -1;
  for (const [lang, count] of Object.entries(breakdown)) {
    if (total > 0) {
      pct[lang] = normalize.round1((count / total) * 100);
    }
    if (count > best) {
      best = count;
      primary = lang;
    }
  }
  return { pct, primary };
}

function computeStreaks(cal: { total_contributions: number; weeks: { contribution_days: { contribution_count: number; date: string }[] }[] }): { current: number; longest: number } {
  const days: { date: string; count: number }[] = [];
  for (const w of cal.weeks) {
    for (const d of w.contribution_days) {
      days.push({ date: d.date, count: d.contribution_count });
    }
  }
  days.sort((a, b) => (a.date < b.date ? -1 : 1));

  let run = 0;
  let best = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  const longest = best;

  let cur = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      cur++;
    } else {
      break;
    }
  }
  return { current: cur, longest };
}

function estimateRecentStreak(activeDays: Record<string, boolean>): number {
  let streak = 0;
  const day = new Date();
  for (;;) {
    const key = day.toISOString().slice(0, 10);
    if (activeDays[key]) {
      streak++;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}