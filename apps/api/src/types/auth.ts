export type Token = {
  token: string;
  expiresIn: number;
};

// Contenu signé dans les access et refresh tokens (lib/tokens.ts), relu par auth.middleware.ts
export type AccessTokenPayload = {
  userId: number;
  email: string;
};

export type AuthTokens = {
  accessToken: Token;
  refreshToken: Token;
};
