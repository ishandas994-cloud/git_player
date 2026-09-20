import type { ApiResponse } from "./types.js";
import { NotFoundError, RateLimitedError } from "../github/client.js";
import { error as sendError } from "./respond.js";

export const UsernameRe = /^[a-zA-Z0-9]([a-zA-Z0-9]|-[a-zA-Z0-9]){0,38}$/;

export function writeGitHubError(res: ApiResponse, err: Error, username: string): void {
  if (err instanceof NotFoundError) {
    sendError(res, 404, "user_not_found", `no GitHub user found for "${username}"`);
  } else if (err instanceof RateLimitedError) {
    sendError(res, 429, "rate_limited", "GitHub API rate limit reached, please try again shortly");
  } else {
    sendError(res, 502, "github_api_error", "couldn't reach GitHub right now, please try again");
  }
}