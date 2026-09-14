import express from "express";
import { handler as healthHandler } from "./health";
import { handler as playerHandler } from "./player";
import { handler as compareHandler } from "./compare";
import type { Request, Response } from "express";

const app = express();

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", async (req, res) => {
  try { await healthHandler(req, res); }
  catch (err) { console.error("health error:", err); if (!res.headersSent) res.status(500).json({ error: "internal_error", message: "something went wrong" }); }
});
app.get("/api/player", async (req, res) => {
  try { await playerHandler(req, res); }
  catch (err) { console.error("player error:", err); if (!res.headersSent) res.status(500).json({ error: "internal_error", message: "something went wrong" }); }
});
app.get("/api/compare", async (req, res) => {
  try { await compareHandler(req, res); }
  catch (err) { console.error("compare error:", err); if (!res.headersSent) res.status(500).json({ error: "internal_error", message: "something went wrong" }); }
});

app.use((_req, res) => {
  res.status(404).json({ error: "not_found", message: "path not found" });
});

export default function handler(req: Request, res: Response) {
  return app(req, res);
}

