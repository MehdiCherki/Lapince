import type { Request, Response } from "express";
import argon2 from "argon2";
import { config } from "../config.ts";
import type { Token, User } from "../models/index.ts";
import { prisma } from "../lib/prisma.js";
import { BadRequestError, UnauthorizedError } from "../lib/error.ts";
import { generateAuthTokens } from "../lib/tokens.ts";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { sendVerificationEmail } from "../services/mail.service.ts";

// POST /auth/register
export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res
      .status(400)
      .json({ error: "Données invalides", details: result.error.issues });
    return;
  }

  const { first_name, last_name, email, password, photo } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res
      .status(409)
      .json({ error: "Cet email est déjà utilisé", field: "email" });
    return;
  }

  const hashedPassword = await argon2.hash(password);
  const token = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password: hashedPassword,
      photo: photo ?? null,
      emailVerificationToken: token,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      photo: true,
      createdAt: true,
    },
  });

  await sendVerificationEmail(user.email, token);

  res
    .status(201)
    .json({
      message:
        "Inscription réussi. Verifiez votre email pour activer votre compte.",
    });
}

// POST /auth/login
export async function login(req: Request, res: Response) {
  const result = await loginSchema.safeParseAsync(req.body);
  if (!result.success) {
    res
      .status(400)
      .json({ error: "Données invalides", details: result.error.issues });
    return;
  }

  const { email, password } = result.data;

  const user = await prisma.user.findFirst({ where: { email } });

  const isMatching = user
    ? await argon2.verify(user.password, password)
    : false;

  if (!user || !isMatching) {
    throw new UnauthorizedError(
      "Le login et le mot de passe ne correspondent pas",
    );
  }

  if (!user.emailVerified) {
    res
      .status(403)
      .json({
        error: "Veuillez confirmer votre email avant de vous connecter.",
      });
    return;
  }

  const { accessToken, refreshToken } = generateAuthTokens(user);

  await createRefreshTokenInDatabase(refreshToken, user);
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  setSessionIndicatorCookie(res, refreshToken);

  res.status(204).end();
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    throw new BadRequestError("Refresh token manquant");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token invalide ou expiré");
  }

  const user = storedToken.user;
  const newTokens = generateAuthTokens(user);

  await rotateRefreshTokenInDatabase(
    refreshToken,
    newTokens.refreshToken,
    user,
  );
  setAccessTokenCookie(res, newTokens.accessToken);
  setRefreshTokenCookie(res, newTokens.refreshToken);
  setSessionIndicatorCookie(res, newTokens.refreshToken);


  res.status(204).end();
}

async function rotateRefreshTokenInDatabase(
  oldToken: string,
  newToken: Token,
  user: User,
) {
  // deleteMany (pas delete) : ne plante pas si le token a déjà disparu entre-temps
  // (ex. deux refresh presque simultanés depuis deux onglets avec le même vieux token)
  await prisma.refreshToken.deleteMany({ where: { token: oldToken } });
  await prisma.refreshToken.create({
    data: {
      token: newToken.token,
      userId: user.id,
      expiresAt: new Date(Date.now() + newToken.expiresIn),
    },
  });
}

// POST /auth/logout
// Déconnexion de TOUS les appareils de l'utilisateur, volontairement : le cookie refreshToken
// n'est envoyé par le navigateur qu'à /auth/refresh (voir son path dans setRefreshTokenCookie),
// donc cette route ne sait pas quelle session appartient à cet appareil. Pour une déconnexion
// appareil par appareil, il faudrait élargir le path du cookie à /auth.
export async function logoutUser(req: Request, res: Response) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: REFRESH_COOKIE_PATH });
  res.clearCookie("sessionExists");
  if (req.user) {
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
  }
  res.status(204).end();
}

const MAX_SESSIONS = 5;

async function createRefreshTokenInDatabase(refreshToken: Token, user: User) {
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken.token,
      userId: user.id,
      expiresAt: new Date(Date.now() + refreshToken.expiresIn),
    },
  });

  const tooMany = await prisma.refreshToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: MAX_SESSIONS,
    select: { id: true },
  });
  if (tooMany.length > 0) {
    await prisma.refreshToken.deleteMany({
      where: { id: { in: tooMany.map((t) => t.id) } },
    });
  }
}

// Le navigateur passe TOUJOURS par /api (proxy Vite en dev, Nginx en prod) :
// le cookie du refresh token doit donc viser /api/auth/refresh dans les deux cas
const REFRESH_COOKIE_PATH = "/api/auth/refresh";

function setAccessTokenCookie(res: Response, accessToken: Token) {
  res.cookie("accessToken", accessToken.token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? "none" : "lax",
    maxAge: accessToken.expiresIn,
  });
}

function setRefreshTokenCookie(res: Response, refreshToken: Token) {
  res.cookie("refreshToken", refreshToken.token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? "none" : "lax",
    maxAge: refreshToken.expiresIn,
    path: REFRESH_COOKIE_PATH,
  });
}

function setSessionIndicatorCookie(res: Response, refreshToken: Token) {
  res.cookie("sessionExists", "1", {
    httpOnly: false, // lu par le front (AuthContext) — ne contient aucun secret, juste "1"
    secure: config.isProd,
    sameSite: config.isProd ? "none" : "lax",
    maxAge: refreshToken.expiresIn,
  });
}
