import "dotenv/config";
import express from "express";
import { handler as healthHandler } from "../../health";
import { handler as playerHandler } from "../../player";
import { handler as compareHandler } from "../../compare";

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
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

app.use((req, res) => {
  res.status(404).json({ error: "not_found", message: "path not found" });
});

const rawAddr = process.env.ADDR || ":4000";
const port = parseInt(rawAddr.replace(":", ""), 10) || 4000;
app.listen(port, () => {
  const token = process.env.GITHUB_TOKEN;
  console.log("dev server listening on", rawAddr);
  console.log("GITHUB_TOKEN:", token ? "loaded (" + token.slice(0, 6) + "...)" : "MISSING - rate limits will apply!");
});