import type { Request, Response } from "express";
import argon2 from "argon2";
import { prisma } from "../lib/prisma.ts";
import { updateUserSchema } from "../validators/user.validator.ts";
import { validationError } from "../lib/validation.ts";

// GET /users/me
export async function getMe(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      photo: true,
      createdAt: true,
    },
  });

  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  return res.status(200).json({ user });
}

// PATCH /users/me
export async function updateMe(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const result = updateUserSchema.safeParse(req.body);
  if (!result.success)
    return res.status(400).json(validationError(result.error));

  const { first_name, last_name, email, password, photo, currentPassword } =
    result.data;

  const current = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!current)
    return res.status(404).json({ error: "Utilisateur introuvable" });

  // Changer le mot de passe ou l'email permet de prendre le contrôle du compte :
  // une session ouverte ne suffit pas (ordinateur laissé allumé, jeton volé), on exige le mot de passe actuel.
  // Le formulaire renvoie toujours l'email : seul un email différent compte comme un changement.
  const emailChanges = email !== undefined && email !== current.email;
  if (password || emailChanges) {
    if (!currentPassword)
      return res.status(400).json({
        error:
          "Saisissez votre mot de passe actuel pour modifier l'email ou le mot de passe",
        field: "currentPassword",
      });
    // 403 et non 401 : le client traite tout 401 comme une session expirée (refresh puis nouvel essai)
    if (!(await argon2.verify(current.password, currentPassword)))
      return res.status(403).json({
        error: "Mot de passe actuel incorrect",
        field: "currentPassword",
      });
  }

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user.id)
      return res
        .status(409)
        .json({ error: "Cet email est déjà utilisé", field: "email" });
  }

  const hashedPassword = password ? await argon2.hash(password) : undefined;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(first_name && { first_name }),
      ...(last_name && { last_name }),
      ...(email && { email }),
      ...(photo !== undefined && { photo }),
      ...(hashedPassword && { password: hashedPassword }),
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      photo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Nouveau mot de passe : toutes les sessions (y compris celle d'un éventuel intrus) sont fermées
  if (hashedPassword) {
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
  }

  return res.status(200).json({ message: "Profil mis à jour", user });
}

// DELETE /users/me
export async function deleteMe(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!existing)
    return res.status(404).json({ error: "Utilisateur introuvable" });

  await prisma.user.delete({ where: { id: req.user.id } });

  return res.status(200).json({ message: "Compte supprimé avec succès" });
}
