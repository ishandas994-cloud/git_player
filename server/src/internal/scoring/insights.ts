import { Metrics } from "./metrics.js";
import { CategoryScores } from "./categories.js";

export interface Insights {
  strengths: string[];
  weaknesses: string[];
}

export function generateInsights(m: Metrics, c: CategoryScores): Insights {
  let strengths: string[] = [];
  let weaknesses: string[] = [];

  const checks: { score: number; strength: string; weakness: string }[] = [
    {
      score: c.Technical,
      strength: `Strong technical diversity — active in ${m.languageCount} languages`,
      weakness: "Technical range is narrow — try a project in a new language or stack",
    },
    {
      score: c.Consistency,
      strength: `Strong contribution consistency — longest streak of ${m.longestStreak} days`,
      weakness: "Contribution activity is sporadic — aim for smaller, regular commits over long gaps",
    },
    {
      score: c.Projects,
      strength: `Solid project portfolio — ${m.activeRepos} active original repositories`,
      weakness: "Repository documentation is thin — add READMEs and topics to your projects",
    },
    {
      score: c.Activity,
      strength: `High recent activity — ${m.recentCommits} commits and ${m.activeDaysLast90} active days in the last 90 days`,
      weakness: "Recent activity is low — regular commits in the last 90 days would boost this score",
    },
    {
      score: c.OpenSource,
      strength: `Good open-source engagement — ${m.recentPRsOpened} pull requests opened recently`,
      weakness: "Increase open-source contributions — opening pull requests and reviewing others' code helps most",
    },
    {
      score: c.Popularity,
      strength: `Repositories are getting noticed — ${m.totalStars} total stars across your projects`,
      weakness: "Repository visibility is low — clear READMEs and topics make projects easier to discover",
    },
  ];

  for (const chk of checks) {
    if (chk.score >= 65) {
      strengths.push(chk.strength);
    } else if (chk.score < 40) {
      weaknesses.push(chk.weakness);
    }
  }

  if (strengths.length === 0) {
    strengths.push("Consistent presence on GitHub with room to grow across every category");
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Maintain current momentum — no significant weak spots detected");
  }

  return { strengths, weaknesses };
}