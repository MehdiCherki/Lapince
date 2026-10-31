// Service Budget
// -------------------------------------------------------------
// Ce fichier contient toute la logique métier liée aux budgets.
// Le contrôleur appelle ces fonctions pour interagir avec la base
// de données via Prisma. Cela permet de séparer la logique métier
// de la gestion des requêtes HTTP, rendant le code plus propre
// et plus facile à maintenir.

import { prisma } from "../lib/prisma.ts";
import { ConflictError, NotFoundError } from "../lib/error.ts";
import { withAlertRefresh } from "./alert.service.ts";
import { assertCategoryExists } from "./category.service.ts";
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from "../validators/budget.validator.ts";

// -------------------------------------------------------------
// 1. Récupérer tous les budgets d'un utilisateur
// -------------------------------------------------------------
export const getAllBudgets = async (userId: number) => {
  return prisma.budget.findMany({
    where: { userId },
    include: {
      category: true,
    },
  });
};

// -------------------------------------------------------------
// 2. Créer un nouveau budget
// -------------------------------------------------------------
// Avec l'alerte de sa catégorie (les dépenses déjà saisies peuvent dépasser la limite)
export const createBudget = async (userId: number, data: CreateBudgetInput) => {
  await assertCategoryExists(data.id_category);
  return withAlertRefresh(userId, [data.id_category], async (tx) => {
    // Vérifié sous le verrou de la catégorie : deux créations simultanées passent l'une après l'autre
    const existing = await tx.budget.findFirst({
      where: { userId, id_category: data.id_category },
    });
    if (existing)
      throw new ConflictError("Un budget existe déjà pour cette catégorie");

    return tx.budget.create({
      data: {
        userId,
        id_category: data.id_category,
        limit_amount: data.limit_amount,
        period: data.period,
      },
    });
  });
};

// -------------------------------------------------------------
// 3. Récupérer un budget spécifique par ID
// -------------------------------------------------------------
export const getBudgetById = async (id: number, userId: number) => {
  return prisma.budget.findFirst({
    where: { id, userId },
    include: {
      category: true,
    },
  });
};

// -------------------------------------------------------------
// 4. Mettre à jour un budget existant
// -------------------------------------------------------------
export const updateBudget = async (
  id: number,
  userId: number,
  data: UpdateBudgetInput,
) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new NotFoundError("Budget introuvable");
  if (data.id_category !== undefined)
    await assertCategoryExists(data.id_category);

  // Nouvelle limite et/ou nouvelle catégorie → alertes recalculées ; l'ancienne catégorie,
  // qui n'a plus de budget, perd son alerte
  const categoryIds = [
    budget.id_category,
    data.id_category ?? budget.id_category,
  ];
  return withAlertRefresh(userId, categoryIds, async (tx) => {
    if (
      data.id_category !== undefined &&
      data.id_category !== budget.id_category
    ) {
      const taken = await tx.budget.findFirst({
        where: { userId, id_category: data.id_category },
      });
      if (taken)
        throw new ConflictError("Un budget existe déjà pour cette catégorie");
    }

    // Seulement les champs envoyés : Prisma refuse un « undefined » explicite (exactOptionalPropertyTypes)
    return tx.budget.update({
      where: { id, userId },
      data: {
        ...(data.limit_amount !== undefined
          ? { limit_amount: data.limit_amount }
          : {}),
        ...(data.period !== undefined ? { period: data.period } : {}),
        ...(data.id_category !== undefined
          ? { id_category: data.id_category }
          : {}),
      },
    });
  });
};

// -------------------------------------------------------------
// 5. Supprimer un budget
// -------------------------------------------------------------

export const deleteBudget = async (id: number, userId: number) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new NotFoundError("Budget introuvable");
  // Plus de budget = plus de limite : l'alerte de la catégorie disparaît avec lui
  return withAlertRefresh(userId, [budget.id_category], (tx) =>
    tx.budget.delete({ where: { id, userId } }),
  );
};
