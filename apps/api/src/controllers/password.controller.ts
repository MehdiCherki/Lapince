import type { Request, Response } from "express";
import crypto from "node:crypto";
import argon2 from "argon2";
import { prisma } from "../lib/prisma.ts";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.ts";
import { sendPasswordResetEmail } from "../services/mail.service.ts";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // lien valable 30 minutes

// Même réponse que le compte existe ou non : la page ne doit pas révéler quels emails sont inscrits
const FORGOT_PASSWORD_MESSAGE =
  "Si un compte existe pour cette adresse, un email de réinitialisation vous a été envoyé.";

// Seul le hash du jeton est stocké : une fuite de la base ne donne aucun lien utilisable
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// POST /auth/forgot-password
export async function forgotPassword(req: Request, res: Response) {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success)
    return res
      .status(400)
      .json({ error: "Adresse email invalide", field: "email" });

  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hashToken(token),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });
    await sendPasswordResetEmail(user.email, token);
  }

  return res.status(200).json({ message: FORGOT_PASSWORD_MESSAGE });
}

// POST /auth/reset-password
export async function resetPassword(req: Request, res: Response) {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.issues[0];
    return res.status(400).json({
      error: issue?.message ?? "Données invalides",
      field: issue?.path[0] === "password" ? "password" : undefined,
    });
  }

  const { token, password } = result.data;
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: { gt: new Date() },
    },
  });
  if (!user)
    return res.status(400).json({
      error:
        "Ce lien est invalide ou a expiré. Faites une nouvelle demande de réinitialisation.",
    });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await argon2.hash(password),
      // Jeton à usage unique
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      // Le lien reçu prouve que l'utilisateur contrôle cette adresse
      emailVerified: true,
      emailVerificationToken: null,
    },
  });
  // Toutes les sessions sont fermées (y compris celle d'un éventuel intrus)
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  return res
    .status(200)
    .json({ message: "Mot de passe modifié. Vous pouvez vous connecter." });
}
