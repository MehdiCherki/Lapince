import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../lib/error.ts";
import { config } from "../config.ts";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accessToken = extractAccessToken(req);
    const payload = verifyAndDecodeJWT(accessToken);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    return next(
      new ForbiddenError("Vous n'êtes pas autorisé à accéder à cette resource"),
    );
  }
}

function extractAccessToken(req: Request) {
  // 1. On cherche d'abord dans les cookies (recommandé pour le web)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // 2. Sinon on cherche dans le header Authorization (standard pour mobile/API)
  const parts = req.headers.authorization?.split(" ");
  if (parts && parts.length === 2 && parts[0] === "Bearer" && parts[1]) {
    return parts[1];
  }

  throw new UnauthorizedError(
    "Vous n'êtes pas autorisé à accéder à cette resource",
  );
}

function verifyAndDecodeJWT(accessToken: string): JwtPayload {
  try {
    const payload = jwt.verify(accessToken, config.jwtSecret, {
      audience: "access",
    }) as JwtPayload;
    return payload;
  } catch (error) {
    throw new UnauthorizedError(
      "Vous n'êtes pas autorisé à accéder à cette resource",
    );
  }
}
