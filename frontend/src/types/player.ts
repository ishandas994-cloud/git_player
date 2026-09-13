export interface Attributes {
  pac: number
  sho: number
  pas: number
  dri: number
  def: number
  phy: number
}

export interface Position {
  code: string
  name: string
  reason: string
}

export interface BreakdownItem {
  category: string
  score: number
  max: number
  rawPercent: number
}

export interface Insights {
  strengths: string[]
  weaknesses: string[]
}

export interface Overview {
  repositories: number
  stars: number
  followers: number
  following: number
  forks: number
  recentCommits: number
  pullRequests: number
  issues: number
}

export interface ActivityInfo {
  activeDaysLast90: number
  currentStreak: number
  longestStreak: number
  contributionsLastYear: number
  isEstimate: boolean
}

export interface LanguageSlice {
  language: string
  percent: number
  repos: number
}

export interface RepoSummary {
  name: string
  description: string
  stars: number
  forks: number
  language: string
  topics: string[]
  url: string
  updatedAt: string
}

export interface PlayerResult {
  username: string
  displayName: string
  avatarUrl: string
  bio: string
  location: string
  profileUrl: string

  ovr: number
  tier: string
  position: Position
  attributes: Attributes
  breakdown: BreakdownItem[]
  insights: Insights

  overview: Overview
  activity: ActivityInfo
  languages: LanguageSlice[]
  topRepos: RepoSummary[]

  disclaimer: string
}

export interface CompareResult {
  playerA: PlayerResult
  playerB: PlayerResult
  winner: 'A' | 'B' | 'draw'
  scoreA: number
  scoreB: number
  summary: string
}

export interface ApiErrorBody {
  error: string
  message: string
}
