import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { hashToken } from "../lib/tokens.ts";

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;
  // Une chaîne seulement : ?token=a&token=b donnerait un tableau
  if (typeof token !== "string" || !token) {
    res.status(400).json({ error: "Token manquant" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationTokenHash: hashToken(token) },
  });
  if (!user) {
    res.status(400).json({ error: "Token invalide" });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationTokenHash: null, // lien à usage unique
    },
  });
  res.status(200).json({ message: "Email confirmé" });
}
