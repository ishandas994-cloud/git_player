import { Request, Response } from "express";
import { handlePreflight, error, json } from "./internal/httpx/respond";
import { UsernameRe, writeGitHubError } from "./internal/httpx/github_errors";
import { Shared, playerKey } from "./internal/cache/cache";
import { GitHubClient } from "./internal/github/client";
import { fetchSnapshot } from "./internal/github/fetch";
import { buildPlayerResult, PlayerResult } from "./internal/scoring/result";

export async function handler(req: Request, res: Response): Promise<void> {
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
    const client = new GitHubClient();
    const snap = await fetchSnapshot(client, username);
    const result = buildPlayerResult(snap);
    Shared.set(playerKey(username), result);
    json(res, 200, result);
  } catch (err) {
    writeGitHubError(res, err as Error, username);
  }
}