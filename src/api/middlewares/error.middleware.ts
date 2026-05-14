import type { Request, Response, NextFunction } from "express";
import { HttpClientError } from "../lib/error.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpClientError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err); // remplacé par un vrai logger plus tard
  res.status(500).json({ error: "Internal server error" });
}