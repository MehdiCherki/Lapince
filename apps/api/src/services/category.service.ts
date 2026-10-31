import { prisma } from "../lib/prisma.ts";
import { BadRequestError } from "../lib/error.ts";

// Catégorie envoyée par le client (dépense, budget) : elle doit exister.
// Vérifié ici pour répondre 400, au lieu d'une erreur de clé étrangère en base (500).
export async function assertCategoryExists(id: number) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new BadRequestError("Catégorie introuvable");
}
