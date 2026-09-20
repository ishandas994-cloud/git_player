import { CategoryScores } from "./categories.js";
import * as normalize from "./normalize.js";

export interface BreakdownItem {
  category: string;
  score: number;
  max: number;
  rawPercent: number;
}

export interface OverallResult {
  ovr: number;
  breakdown: BreakdownItem[];
}

export function computeOverall(c: CategoryScores, w: { Activity: number; Projects: number; OpenSource: number; Popularity: number; Consistency: number; Technical: number }): OverallResult {
  const items: BreakdownItem[] = [
    { category: "Activity", score: normalize.round1(c.Activity * w.Activity), max: normalize.round1(w.Activity * 100), rawPercent: normalize.round1(c.Activity) },
    { category: "Projects", score: normalize.round1(c.Projects * w.Projects), max: normalize.round1(w.Projects * 100), rawPercent: normalize.round1(c.Projects) },
    { category: "Open Source", score: normalize.round1(c.OpenSource * w.OpenSource), max: normalize.round1(w.OpenSource * 100), rawPercent: normalize.round1(c.OpenSource) },
    { category: "Popularity", score: normalize.round1(c.Popularity * w.Popularity), max: normalize.round1(w.Popularity * 100), rawPercent: normalize.round1(c.Popularity) },
    { category: "Consistency", score: normalize.round1(c.Consistency * w.Consistency), max: normalize.round1(w.Consistency * 100), rawPercent: normalize.round1(c.Consistency) },
    { category: "Technical Diversity", score: normalize.round1(c.Technical * w.Technical), max: normalize.round1(w.Technical * 100), rawPercent: normalize.round1(c.Technical) },
  ];

  let total = 0;
  for (const it of items) {
    total += it.score;
  }

  return {
    ovr: Math.round(normalize.clamp(total, 0, 100)),
    breakdown: items,
  };
}