import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handler as playerHandler } from "../server/src/player.js";

/** Vercel maps this file to GET /api/player?username=... automatically. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await playerHandler(req, res);
  } catch (err) {
    console.error("player error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "internal_error", message: "something went wrong" });
    }
  }
}
