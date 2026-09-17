import { Snapshot } from "../github/types.js";
import { Metrics, computeMetrics } from "./metrics.js";
import { CategoryScores, computeCategoryScores } from "./categories.js";
import * as normalize from "./normalize.js";
import { OverallResult, BreakdownItem, computeOverall } from "./overall.js";
import { Tier } from "./tier.js";
import { Position, assignPosition, detectTechProfile } from "./position.js";
import { Attributes, computeAttributes } from "./attributes.js";
import { Insights, generateInsights } from "./insights.js";

export interface PlayerResult {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  location: string;
  profileUrl: string;
  ovr: number;
  tier: string;
  position: Position;
  attributes: Attributes;
  breakdown: BreakdownItem[];
  insights: Insights;
  overview: {
    repositories: number;
    stars: number;
    followers: number;
    following: number;
    forks: number;
    recentCommits: number;
    pullRequests: number;
    issues: number;
  };
  activity: {
    activeDaysLast90: number;
    currentStreak: number;
    longestStreak: number;
    contributionsLastYear: number;
    isEstimate: boolean;
  };
  languages: Array<{ language: string; percent: number; repos: number }>;
  topRepos: Array<{
    name: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    topics: string[];
    url: string;
    updatedAt: string;
  }>;
  disclaimer: string;
}

const disclaimerText = "GitHub Player Rating is an independent scoring system based on publicly available GitHub data. It is not affiliated with GitHub.";

function displayName(p: { name: string | null; login: string }): string {
  if (p.name) return p.name;
  return p.login;
}

function daysSince(t: string): number {
  return Math.floor((Date.now() - new Date(t).getTime()) / (1000 * 60 * 60 * 24));
}

function buildLanguageSlices(m: Metrics): PlayerResult["languages"] {
  const slices: PlayerResult["languages"] = [];
  for (const [lang, count] of Object.entries(m.languageBreakdown)) {
    slices.push({
      language: lang,
      percent: m.languagePercent[lang],
      repos: count,
    });
  }
  slices.sort((a, b) => b.percent - a.percent);
  if (slices.length > 8) {
    return slices.slice(0, 8);
  }
  return slices;
}

type RepoType = import("../github/types").Repo;

function topRepos(repos: RepoType[], n: number): PlayerResult["topRepos"] {
  type scored = { repo: RepoType; score: number };
  const candidates: scored[] = [];
  for (const r of repos) {
    if (r.fork) continue;
    const s =
      normalize.logScale(r.stargazers_count, 200) * 0.5 +
      normalize.logScale(r.forks_count, 50) * 0.25 +
      normalize.logScale(r.size, 5000) * 0.15 +
      recencyScore(r) * 0.1;
    candidates.push({ repo: r, score: s });
  }
  candidates.sort((a, b) => b.score - a.score);

  const actualN = Math.min(n, candidates.length);
  const out: PlayerResult["topRepos"] = [];
  for (let i = 0; i < actualN; i++) {
    const c = candidates[i];
    out.push({
      name: c.repo.name,
      description: c.repo.description || "",
      stars: c.repo.stargazers_count,
      forks: c.repo.forks_count,
      language: c.repo.language || "",
      topics: c.repo.topics,
      url: "https://github.com/" + c.repo.full_name,
      updatedAt: new Date(c.repo.pushed_at).toISOString().slice(0, 10),
    });
  }
  return out;
}

function recencyScore(r: RepoType): number {
  const days = daysSince(r.pushed_at);
  if (days <= 30) return 100;
  if (days <= 90) return 75;
  if (days <= 180) return 50;
  if (days <= 365) return 25;
  return 5;
}

export function buildPlayerResult(snap: Snapshot): PlayerResult {
  const metrics = computeMetrics(snap);
  const categories = computeCategoryScores(metrics);
  const attributes = computeAttributes(categories);
  const overall = computeOverall(categories, { Activity: 0.25, Projects: 0.20, OpenSource: 0.15, Popularity: 0.15, Consistency: 0.15, Technical: 0.10 });
  const techProfile = detectTechProfile(snap.repos);
  const position = assignPosition(techProfile, categories);
  const insights = generateInsights(metrics, categories);

  const ovr = normalize.remapToRange(overall.ovr, 50, 100);

  const remappedAttributes = {
    pac: normalize.remapToRange(attributes.pac, 50, 100),
    sho: normalize.remapToRange(attributes.sho, 50, 100),
    pas: normalize.remapToRange(attributes.pas, 50, 100),
    dri: normalize.remapToRange(attributes.dri, 50, 100),
    def: normalize.remapToRange(attributes.def, 50, 100),
    phy: normalize.remapToRange(attributes.phy, 50, 100),
  };

  const res: PlayerResult = {
    username: snap.profile.login,
    displayName: displayName(snap.profile),
    avatarUrl: snap.profile.avatar_url,
    bio: snap.profile.bio || "",
    location: snap.profile.location || "",
    profileUrl: snap.profile.html_url,
    ovr,
    tier: Tier(ovr),
    position,
    attributes: remappedAttributes,
    breakdown: overall.breakdown,
    insights,
    overview: {
      repositories: 0,
      stars: 0,
      followers: 0,
      following: 0,
      forks: 0,
      recentCommits: 0,
      pullRequests: 0,
      issues: 0,
    },
    activity: {
      activeDaysLast90: 0,
      currentStreak: 0,
      longestStreak: 0,
      contributionsLastYear: 0,
      isEstimate: false,
    },
    languages: [],
    topRepos: [],
    disclaimer: disclaimerText,
  };

  res.overview.repositories = metrics.publicRepos;
  res.overview.stars = metrics.totalStars;
  res.overview.followers = metrics.followers;
  res.overview.following = metrics.following;
  res.overview.forks = metrics.totalForks;
  res.overview.recentCommits = metrics.recentCommits;
  res.overview.pullRequests = metrics.recentPRsOpened;
  res.overview.issues = metrics.recentIssuesOpened + metrics.recentIssuesClosed;

  res.activity.activeDaysLast90 = metrics.activeDaysLast90;
  res.activity.currentStreak = metrics.currentStreak;
  res.activity.longestStreak = metrics.longestStreak;
  res.activity.contributionsLastYear = metrics.contributionsLastYear;
  res.activity.isEstimate = !metrics.hasCalendarData;

  res.languages = buildLanguageSlices(metrics);
  res.topRepos = topRepos(snap.repos, 6);

  return res;
}