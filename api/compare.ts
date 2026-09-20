import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handler as compareHandler } from "../server/src/compare.js";

/** Vercel maps this file to GET /api/compare?a=...&b=... automatically. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await compareHandler(req, res);
  } catch (err) {
    console.error("compare error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "internal_error", message: "something went wrong" });
    }
  }
}
