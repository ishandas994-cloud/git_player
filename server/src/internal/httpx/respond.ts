import type { ApiRequest, ApiResponse } from "./types.js";

export interface ErrorBody {
  error: string;
  message: string;
}

/**
 * Sets permissive CORS headers. Uses setHeader (not Express's res.header) so this
 * works on Vercel's native serverless response object too.
 */
export function enableCORS(res: ApiResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function json(res: ApiResponse, status: number, v: unknown): void {
  res.status(status).json(v);
}

export function error(res: ApiResponse, status: number, code: string, message: string): void {
  json(res, status, { error: code, message });
}

/** Returns true (and has already responded) if this was an OPTIONS preflight request. */
export function handlePreflight(req: ApiRequest, res: ApiResponse): boolean {
  enableCORS(res);
  if (req.method === "OPTIONS") {
    // status().end() rather than Express's sendStatus() — sendStatus doesn't exist on Vercel.
    res.status(204).end();
    return true;
  }
  return false;
}
