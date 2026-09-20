import type { ApiRequest, ApiResponse } from "./internal/httpx/types.js";
import { handlePreflight, error, json } from "./internal/httpx/respond.js";
import { UsernameRe, writeGitHubError } from "./internal/httpx/github_errors.js";
import { Shared, playerKey } from "./internal/cache/cache.js";
import { GitHubClient } from "./internal/github/client.js";
import { fetchSnapshot } from "./internal/github/fetch.js";
import { buildPlayerResult, PlayerResult } from "./internal/scoring/result.js";

export async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (handlePreflight(req, res)) return;
  if (req.method !== "GET") {
    error(res, 405, "method_not_allowed", "use GET");
    return;
  }

  const username = ((req.query.username as string) || "").trim();
  if (!username) {
    error(res, 400, "missing_username", "provide ?username=<github-username>");
    return;
  }
  if (!UsernameRe.test(username)) {
    error(res, 400, "invalid_username", "that doesn't look like a valid GitHub username");
    return;
  }

  const cached = Shared.get(playerKey(username));
  if (cached !== undefined) {
    json(res, 200, cached);
    return;
  }

  try {
    console.log(`[player] Fetching profile for ${username}`);
    const client = new GitHubClient();
    console.log(`[player] Fetching snapshot for ${username}`);
    const snap = await fetchSnapshot(client, username);
    console.log(`[player] Building result for ${username}`);
    const result = buildPlayerResult(snap);
    Shared.set(playerKey(username), result);
    json(res, 200, result);
  } catch (err) {
    console.error(`[player] Error for ${username}:`, err);
    writeGitHubError(res, err as Error, username);
  }
}