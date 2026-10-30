import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export async function getAllCategory(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  const categories = await prisma.category.findMany();
  return res.status(200).json(categories);
}

export async function getOneCategory(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category)
    return res.status(404).json({ error: "Catégorie introuvable" });

  return res.status(200).json(category);
}
