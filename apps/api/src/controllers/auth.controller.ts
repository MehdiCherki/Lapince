import type { Request, Response } from "express";
import argon2 from "argon2";
import { config } from "../config.ts";
import type { User } from "@prisma/client";
import type { Token } from "../types/auth.ts";
import { prisma } from "../lib/prisma.ts";
import { BadRequestError, UnauthorizedError } from "../lib/error.ts";
import { generateAuthTokens, hashToken } from "../lib/tokens.ts";
import { registerSchema, loginSchema } from "../validators/auth.validator.ts";
import { sendVerificationEmail } from "../services/mail.service.ts";
import { validationError } from "../lib/validation.ts";

// POST /auth/register
export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(validationError(result.error));
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
      emailVerificationTokenHash: hashToken(token),
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

  res.status(201).json({
    message:
      "Inscription réussi. Verifiez votre email pour activer votre compte.",
  });
}

// POST /auth/login
export async function login(req: Request, res: Response) {
  const result = await loginSchema.safeParseAsync(req.body);
  if (!result.success) {
    res.status(400).json(validationError(result.error));
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
    res.status(403).json({
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

  if (typeof refreshToken !== "string" || !refreshToken) {
    throw new BadRequestError("Refresh token manquant");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
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

// Le jeton présenté est consommé : un jeton ne sert qu'une fois.
// Deux requêtes simultanées avec le même jeton passent toutes deux la lecture ci-dessus ; la
// suppression tranche : PostgreSQL verrouille la ligne, une seule requête la supprime (count = 1),
// les autres ne trouvent plus rien et reçoivent 401 au lieu de créer chacune une session.
// Transaction : si la création échoue, l'ancien jeton n'est pas perdu (pas de déconnexion).
async function rotateRefreshTokenInDatabase(
  oldToken: string,
  newToken: Token,
  user: User,
) {
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.refreshToken.deleteMany({
      where: { tokenHash: hashToken(oldToken) },
    });
    if (count === 0) {
      throw new UnauthorizedError("Refresh token invalide ou expiré");
    }
    await tx.refreshToken.create({
      data: {
        tokenHash: hashToken(newToken.token),
        userId: user.id,
        expiresAt: new Date(Date.now() + newToken.expiresIn),
      },
    });
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
      tokenHash: hashToken(refreshToken.token),
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

// Cookies SameSite=Lax : client et API sont sur le même site, aucune requête légitime ne vient
// d'un autre site (protection contre le CSRF). Lax suffit : depuis un autre site, il ne laisse
// passer les cookies que lors d'un clic sur un lien (navigation en GET), et les actions de
// l'utilisateur (ajouter, modifier, supprimer) passent toutes par POST, PATCH ou DELETE.

function setAccessTokenCookie(res: Response, accessToken: Token) {
  res.cookie("accessToken", accessToken.token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    maxAge: accessToken.expiresIn,
  });
}

function setRefreshTokenCookie(res: Response, refreshToken: Token) {
  res.cookie("refreshToken", refreshToken.token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    maxAge: refreshToken.expiresIn,
    path: REFRESH_COOKIE_PATH,
  });
}

function setSessionIndicatorCookie(res: Response, refreshToken: Token) {
  res.cookie("sessionExists", "1", {
    httpOnly: false, // lu par le front (AuthContext) — ne contient aucun secret, juste "1"
    secure: config.isProd,
    sameSite: "lax",
    maxAge: refreshToken.expiresIn,
  });
}
