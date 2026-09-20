import type { ApiRequest, ApiResponse } from "./internal/httpx/types.js";
import { handlePreflight, json } from "./internal/httpx/respond.js";

export async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (handlePreflight(req, res)) return;
  json(res, 200, {
    status: "ok",
    time: new Date().toISOString(),
  });
}