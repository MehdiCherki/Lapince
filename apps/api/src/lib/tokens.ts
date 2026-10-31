import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config.ts";
import type { User } from "@prisma/client";
import type { AccessTokenPayload, AuthTokens } from "../types/auth.ts";

// Seule cette empreinte des jetons est stockée (session, confirmation d'email, réinitialisation) :
// une fuite de la base ne donne aucun jeton utilisable. SHA-256 suffit ici, contrairement aux
// mots de passe (Argon2) : un jeton aléatoire ne se devine pas par essais successifs.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateAuthTokens(
  user: Pick<User, "id" | "email">,
): AuthTokens {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: "45m",
    audience: "access",
  });
  const refreshToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: "7d",
    audience: "refresh",
    jwtid: crypto.randomUUID(),
  });

  return {
    accessToken: {
      token: accessToken,
      expiresIn: 45 * 60 * 1000,
    },
    refreshToken: {
      token: refreshToken,
      expiresIn: 7 * 24 * 60 * 60 * 1000,
    },
  };
}
