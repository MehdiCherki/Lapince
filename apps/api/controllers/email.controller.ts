import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;
  if (!token) {
    res.status(400).json({ error: "Token manquant" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token as string },
  });
  if (!user) {
    res.status(400).json({ error: "Token invalide" });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null, // on efface le token
    },
  });
  res.status(200).json({ message: "Email confirmé" });
}
