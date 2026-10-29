import type { Request, Response, NextFunction } from "express";
import { HttpClientError } from "../lib/error.js";
import { logger } from "../lib/logger.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpClientError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
}
