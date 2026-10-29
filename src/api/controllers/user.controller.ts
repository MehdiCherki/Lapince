import type { Request, Response } from "express";
import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { updateUserSchema } from "../validators/user.validator.js";

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
    return res
      .status(400)
      .json({ error: "Données invalides", details: result.error.issues });

  const { first_name, last_name, email, password, photo } = result.data;

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
