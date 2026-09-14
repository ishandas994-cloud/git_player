import * as normalize from "./normalize";
import { Metrics } from "./metrics";

export interface CategoryScores {
  Activity: number;
  Projects: number;
  OpenSource: number;
  Popularity: number;
  Consistency: number;
  Technical: number;
}

export function computeCategoryScores(m: Metrics): CategoryScores {
  return {
    Activity: activityScore(m),
    Projects: projectsScore(m),
    OpenSource: openSourceScore(m),
    Popularity: popularityScore(m),
    Consistency: consistencyScore(m),
    Technical: technicalScore(m),
  };
}

function activityScore(m: Metrics): number {
  const commitFreq = normalize.logScale(m.recentCommits, 150);
  const activeDays = normalize.linearScale(m.activeDaysLast90, 60);
  const recentContribs = normalize.logScale(m.contributionsLastYear, 1200);
  const pushActivity = normalize.logScale(m.recentPushes, 80);
  return normalize.average(commitFreq, activeDays, recentContribs, pushActivity);
}

function projectsScore(m: Metrics): number {
  const countScore = normalize.logScale(m.originalRepos, 40);
  const activeRatio = normalize.ratioScale(m.activeRepos, Math.max(1, m.originalRepos));
  const docScore = normalize.ratioScale(m.reposWithReadme, Math.max(1, m.reposEnrichedCount));
  const topicsScore = normalize.ratioScale(m.reposWithTopics, Math.max(1, m.originalRepos));
  const releaseScore = normalize.ratioScale(m.reposWithRelease, Math.max(1, m.reposEnrichedCount));
  return normalize.weightedAverage(
    [countScore, activeRatio, docScore, topicsScore, releaseScore],
    [0.35, 0.20, 0.20, 0.10, 0.15],
  );
}

function openSourceScore(m: Metrics): number {
  const prScore = normalize.logScale(m.recentPRsOpened, 20);
  const reviewScore = normalize.logScale(m.recentReviews, 15);
  const issueScore = normalize.logScale(m.recentIssuesOpened + m.recentIssuesClosed, 20);
  const externalScore = normalize.logScale(m.externalContributions, 10);
  return normalize.weightedAverage(
    [prScore, reviewScore, issueScore, externalScore],
    [0.35, 0.25, 0.15, 0.25],
  );
}

function popularityScore(m: Metrics): number {
  const starScore = normalize.logScale(m.totalStars, 500);
  const followerScore = normalize.logScale(m.followers, 300);
  const forkScore = normalize.logScale(m.totalForks, 100);
  const watcherScore = normalize.logScale(m.totalWatchers, 100);
  return normalize.weightedAverage(
    [starScore, followerScore, forkScore, watcherScore],
    [0.40, 0.30, 0.20, 0.10],
  );
}

function consistencyScore(m: Metrics): number {
  const streakScore = normalize.logScale(m.longestStreak, 120);
  const currentStreakScore = normalize.logScale(m.currentStreak, 30);
  const longevityScore = normalize.logScale(m.accountAgeDays, 365 * 4);
  const activeDaysScore = normalize.linearScale(m.activeDaysLast90, 45);
  return normalize.weightedAverage(
    [streakScore, currentStreakScore, longevityScore, activeDaysScore],
    [0.35, 0.25, 0.15, 0.25],
  );
}

function technicalScore(m: Metrics): number {
  const langScore = normalize.linearScale(m.languageCount, 8);
  const balanceScore = languageBalanceScore(m.languagePercent);
  const topicsAsFrameworkProxy = normalize.ratioScale(m.reposWithTopics, Math.max(1, m.originalRepos));
  return normalize.weightedAverage(
    [langScore, balanceScore, topicsAsFrameworkProxy],
    [0.50, 0.30, 0.20],
  );
}

function languageBalanceScore(pct: Record<string, number>): number {
  if (Object.keys(pct).length <= 1) return 0;
  let top = 0;
  for (const p of Object.values(pct)) {
    if (p > top) top = p;
  }
  const score = (100 - top) / 60 * 100;
  return normalize.clamp(score, 0, 100);
}