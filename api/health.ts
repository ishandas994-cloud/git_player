import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handler as healthHandler } from "../server/src/health.js";

/**
 * Vercel maps this file to GET /api/health automatically.
 *
 * IMPORTANT: /api must contain ONLY these thin entrypoint files. Vercel turns every
 * .ts/.js/.mjs file anywhere under /api into its own serverless function, and the
 * Hobby plan caps a deployment at 12. All real logic lives in /server, outside /api.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await healthHandler(req, res);
  } catch (err) {
    console.error("health error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "internal_error", message: "something went wrong" });
    }
  }
}
