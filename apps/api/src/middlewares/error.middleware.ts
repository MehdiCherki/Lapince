import type { Request, Response, NextFunction } from "express";
import { isCheckViolation } from "../lib/db-errors.ts";
import { HttpClientError } from "../lib/error.ts";
import { logger } from "../lib/logger.ts";

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

  // Donnée refusée par une contrainte CHECK de la base : la validation de l'API aurait dû
  // l'écarter. Journalisée sans l'erreur, dont le détail recopie la ligne refusée (email, hash).
  if (isCheckViolation(err)) {
    logger.warn("Check constraint violation");
    res.status(400).json({ error: "Données invalides" });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
}
