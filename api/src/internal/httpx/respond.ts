import { Request, Response } from "express";

export interface ErrorBody {
  error: string;
  message: string;
}

export function enableCORS(res: Response): void {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
}

export function json(res: Response, status: number, v: unknown): void {
  res.status(status).json(v);
}

export function error(res: Response, status: number, code: string, message: string): void {
  json(res, status, { error: code, message });
}

export function handlePreflight(req: Request<any, any, any, any, Record<string, any>>, res: Response): boolean {
  enableCORS(res);
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return true;
  }
  return false;
}