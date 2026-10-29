export type { User } from "@prisma/client";

export type Token = {
  token: string;
  expiresIn: number;
};

export type AuthTokens = {
  accessToken: Token;
  refreshToken: Token;
};
