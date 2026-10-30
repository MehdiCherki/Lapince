import jwt from "jsonwebtoken";
import { config } from "../config.ts";
import type { User } from "@prisma/client";

export function generateAuthTokens(user: User) {
  const payload = {
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
