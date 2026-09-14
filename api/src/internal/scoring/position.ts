import * as normalize from "./normalize";
import { Metrics } from "./metrics";
import { CategoryScores } from "./categories";

export interface TechProfile {
  Frontend: number;
  Backend: number;
  AI: number;
  DevOps: number;
  Mobile: number;
}

const frontendLangs = new Set([
  "JavaScript", "TypeScript", "HTML", "CSS", "Vue", "Svelte",
]);
const backendLangs = new Set([
  "Java", "Go", "C#", "PHP", "Ruby", "Rust", "Scala", "Elixir", "C", "C++",
]);
const aiLangs = new Set([
  "Python", "Jupyter Notebook", "R", "Julia",
]);
const devopsLangs = new Set([
  "Shell", "Dockerfile", "HCL", "Makefile", "PowerShell",
]);
const mobileLangs = new Set([
  "Swift", "Kotlin", "Dart", "Objective-C",
]);

const aiKeywords = [
  "machine-learning", "deep-learning", "tensorflow", "pytorch", "data-science",
  "neural-network", "nlp", "computer-vision", "llm", "ai", "ml",
];
const devopsKeywords = [
  "docker", "kubernetes", "terraform", "ansible", "ci-cd", "devops",
  "infrastructure", "helm", "ec2", "aws", "gcp", "azure",
];
const mobileKeywords = [
  "android", "ios", "flutter", "react-native", "mobile-app", "swiftui",
];
const frontendKeywords = [
  "react", "vue", "nextjs", "frontend", "ui", "tailwindcss", "website", "landing-page", "webapp",
];
const backendKeywords = [
  "api", "backend", "microservice", "database", "server", "rest-api", "graphql", "grpc",
];

function hasAny(haystack: string, keywords: string[]): boolean {
  const h = haystack.toLowerCase();
  for (const k of keywords) {
    if (h.includes(k)) return true;
  }
  return false;
}

export function detectTechProfile(repos: { language: string | null; description: string | null; topics: string[]; fork: boolean }[]): TechProfile {
  const tp: TechProfile = { Frontend: 0, Backend: 0, AI: 0, DevOps: 0, Mobile: 0 };
  let total = 0;

  for (const r of repos) {
    if (r.fork) continue;
    total++;
    const combined = ((r.description || "") + " " + r.topics.join(" ")).toLowerCase();

    if (frontendLangs.has(r.language || "")) tp.Frontend++;
    else if (backendLangs.has(r.language || "")) tp.Backend++;
    else if (aiLangs.has(r.language || "")) tp.AI++;
    else if (devopsLangs.has(r.language || "")) tp.DevOps++;
    else if (mobileLangs.has(r.language || "")) tp.Mobile++;

    if (hasAny(combined, aiKeywords)) tp.AI += 0.5;
    if (hasAny(combined, devopsKeywords)) tp.DevOps += 0.5;
    if (hasAny(combined, mobileKeywords)) tp.Mobile += 0.5;
    if (hasAny(combined, frontendKeywords)) tp.Frontend += 0.3;
    if (hasAny(combined, backendKeywords)) tp.Backend += 0.3;
  }

  if (total === 0) return tp;
  tp.Frontend /= total;
  tp.Backend /= total;
  tp.AI /= total;
  tp.DevOps /= total;
  tp.Mobile /= total;
  return tp;
}

export interface Position {
  code: string;
  name: string;
  reason: string;
}

const positionNames: Record<string, string> = {
  GK: "Goalkeeper",
  CB: "Centre Back",
  LB: "Left Back",
  RB: "Right Back",
  CDM: "Defensive Midfielder",
  CM: "Central Midfielder",
  CAM: "Attacking Midfielder",
  LW: "Left Winger",
  RW: "Right Winger",
  ST: "Striker",
};

interface PositionCandidate {
  area: string;
  score: number;
}

export function assignPosition(tp: TechProfile, c: CategoryScores): Position {
  const candidates: PositionCandidate[] = [
    { area: "frontend", score: tp.Frontend },
    { area: "backend", score: tp.Backend },
    { area: "ai", score: tp.AI },
    { area: "devops", score: tp.DevOps },
    { area: "mobile", score: tp.Mobile },
  ];

  let best = candidates[0];
  let allZero = true;
  for (const cand of candidates) {
    if (cand.score > best.score) best = cand;
    if (cand.score > 0) allZero = false;
  }

  if (allZero) {
    return build("CM", "Not enough repository data yet to detect a specialization.");
  }

  if (isVersatile(candidates)) {
    return build("CM", "Balanced activity across frontend, backend and tooling — a true all-rounder.");
  }

  switch (true) {
    case best.area === "ai":
      return build("CAM", "Strong AI/ML and data-science focus in your repositories.");
    case best.area === "devops":
      return build("GK", "Repositories lean heavily on DevOps, infrastructure and reliability tooling.");
    case best.area === "backend":
      if (c.Consistency >= 60) {
        return build("CB", "Consistent, structured backend and systems work.");
      }
      return build("CDM", "Backend, APIs and database-focused development.");
    case best.area === "frontend":
      if (c.Activity >= 60) {
        if (Math.floor(tp.Frontend * 1000) % 2 === 0) {
          return build("RW", "Fast-moving frontend/UI development with frequent shipping.");
        }
        return build("LW", "Fast-moving frontend/UI development with frequent shipping.");
      }
      return build("CAM", "Frontend-leaning with creative, feature-driven projects.");
    case best.area === "mobile":
      return build("RB", "Mobile app development focus with cross-platform delivery.");
    default:
      if (c.Projects >= 70 && c.Activity >= 65) {
        return build("ST", "High project output and consistent execution.");
      }
      return build("CM", "Balanced developer performing steadily across categories.");
  }
}

function isVersatile(candidates: PositionCandidate[]): boolean {
  let max = 0;
  let min = 1;
  let nonZero = 0;
  for (const c of candidates) {
    if (c.score > max) max = c.score;
    if (c.score < min) min = c.score;
    if (c.score > 0.05) nonZero++;
  }
  return nonZero >= 3 && (max - min) < 0.15 && max > 0;
}

function build(code: string, reason: string): Position {
  return { code, name: positionNames[code], reason };
}