import type { ApiRequest, ApiResponse } from "./internal/httpx/types.js";
import { handlePreflight, error, json } from "./internal/httpx/respond.js";
import { UsernameRe, writeGitHubError } from "./internal/httpx/github_errors.js";
import { Shared, playerKey } from "./internal/cache/cache.js";
import { GitHubClient } from "./internal/github/client.js";
import { fetchSnapshot } from "./internal/github/fetch.js";
import { buildPlayerResult, PlayerResult } from "./internal/scoring/result.js";

export interface CompareResult {
  playerA: PlayerResult;
  playerB: PlayerResult;
  winner: string;
  scoreA: number;
  scoreB: number;
  summary: string;
}

export async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (handlePreflight(req, res)) return;
  if (req.method !== "GET") {
    error(res, 405, "method_not_allowed", "use GET");
    return;
  }

  const userA = ((req.query.a as string) || "").trim();
  const userB = ((req.query.b as string) || "").trim();
  if (!userA || !userB) {
    error(res, 400, "missing_usernames", "provide ?a=<username>&b=<username>");
    return;
  }
  if (!UsernameRe.test(userA) || !UsernameRe.test(userB)) {
    error(res, 400, "invalid_username", "one of the usernames doesn't look valid");
    return;
  }

  const client = new GitHubClient();

  let resA: PlayerResult | undefined;
  let resB: PlayerResult | undefined;
  let errA: Error | null = null;
  let errB: Error | null = null;

  const fetchOne = async (
    username: string,
    setResult: (r: PlayerResult) => void,
    setError: (e: Error) => void,
  ): Promise<void> => {
    const cached = Shared.get(playerKey(username));
    if (cached !== undefined) {
      setResult(cached as PlayerResult);
      return;
    }
    try {
      const snap = await fetchSnapshot(client, username);
      const result = buildPlayerResult(snap);
      Shared.set(playerKey(username), result);
      setResult(result);
    } catch (e) {
      setError(e as Error);
    }
  };

  await Promise.all([
    fetchOne(userA, (r) => { resA = r; }, (e) => { errA = e; }),
    fetchOne(userB, (r) => { resB = r; }, (e) => { errB = e; }),
  ]);

  if (errA) {
    writeGitHubError(res, errA, userA);
    return;
  }
  if (errB) {
    writeGitHubError(res, errB, userB);
    return;
  }

  const result = buildComparison(resA!, resB!);
  json(res, 200, result);
}

export function buildComparison(a: PlayerResult, b: PlayerResult): CompareResult {
  let aWins = 0;
  let bWins = 0;
  const pairs: [number, number][] = [
    [a.attributes.pac, b.attributes.pac],
    [a.attributes.sho, b.attributes.sho],
    [a.attributes.pas, b.attributes.pas],
    [a.attributes.dri, b.attributes.dri],
    [a.attributes.def, b.attributes.def],
    [a.attributes.phy, b.attributes.phy],
  ];
  for (const p of pairs) {
    if (p[0] > p[1]) aWins++;
    else if (p[1] > p[0]) bWins++;
  }

  let winner = "draw";
  if (aWins > bWins) winner = "A";
  else if (bWins > aWins) winner = "B";

  return {
    playerA: a,
    playerB: b,
    winner,
    scoreA: aWins,
    scoreB: bWins,
    summary: buildSummary(a.displayName, b.displayName, aWins, bWins, winner),
  };
}

export function buildSummary(nameA: string, nameB: string, aWins: number, bWins: number, winner: string): string {
  const a = String(aWins);
  const b = String(bWins);
  switch (winner) {
    case "draw":
      return `${nameA} and ${nameB} tie ${a}–${b}`;
    case "A":
      return `${nameA} wins ${a}–${b}`;
    default:
      return `${nameB} wins ${b}–${a}`;
  }
}

