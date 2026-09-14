import { Request, Response } from "express";
import { handlePreflight, json } from "./internal/httpx/respond";

export async function handler(req: Request, res: Response): Promise<void> {
  if (handlePreflight(req, res)) return;
  json(res, 200, {
    status: "ok",
    time: new Date().toISOString(),
  });
}