// Service Budget
// -------------------------------------------------------------
// Ce fichier contient toute la logique métier liée aux budgets.
// Le contrôleur appelle ces fonctions pour interagir avec la base
// de données via Prisma. Cela permet de séparer la logique métier
// de la gestion des requêtes HTTP, rendant le code plus propre
// et plus facile à maintenir.

import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError } from "../lib/error.js";



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
export const createBudget = async (userId: number, data: any) => {
  const existing = await prisma.budget.findFirst({
    where: { userId, id_category: data.id_category },
  });
  if (existing) throw new ConflictError("Un budget existe déjà pour cette catégorie");

  return prisma.budget.create({
    data: {
      userId,
      id_category: data.id_category,
      limit_amount: data.limit_amount,
      period: data.period,
    },
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
export const updateBudget = async (id: number, userId: number, data: any) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new NotFoundError("Budget introuvable");
  
  if (data.id_category !== undefined && data.id_category !== budget.id_category) {
    const taken = await prisma.budget.findFirst({
      where: { userId, id_category: data.id_category },
    });
    if (taken) throw new ConflictError("Un budget existe déjà pour cette catégorie");
  }

  return prisma.budget.update({ where: { id, userId }, data });
};


// -------------------------------------------------------------
// 5. Supprimer un budget
// -------------------------------------------------------------

export const deleteBudget = async (id: number, userId: number) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new NotFoundError("Budget introuvable");
  return prisma.budget.delete({ where: { id, userId } });
};

