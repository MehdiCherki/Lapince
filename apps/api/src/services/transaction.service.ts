// Accès aux données des transactions (dépenses et revenus). Chaque requête est filtrée sur
// l'utilisateur connecté ; les écritures passent par withAlertRefresh (alert.service.ts),
// qui recalcule l'alerte du budget de la catégorie dans la même transaction.

import { prisma } from "../lib/prisma.ts";
import { withAlertRefresh } from "./alert.service.ts";
import { assertCategoryExists } from "./category.service.ts";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "../validators/transaction.validator.ts";

// --- 1. Récupérer toutes les transactions avec les filtres ---
export const getAllTransactions = async (
  userId: number,
  filters: {
    idcategory?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    page: number;
    limit: number;
  },
) => {
  // Début et fin dans un même objet `date` (deux objets séparés : la fin écraserait le début)
  const where = {
    userId,
    ...(filters.idcategory && { categoryId: filters.idcategory }),
    ...((filters.startDate || filters.endDate) && {
      date: {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      },
    }),
  };
  const skip = (filters.page - 1) * filters.limit;

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      // id en départage : les transactions d'un même jour ont la même date (saisie au jour),
      // sans lui PostgreSQL renvoie l'ordre physique, qui change après une modification
      // (et la pagination peut alors répéter ou sauter une transaction)
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: { category: true },
      skip,
      take: filters.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data,
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
  };
};

// --- 2. Créer une transaction ---
export const createTransaction = async (
  userId: number,
  data: CreateTransactionInput,
) => {
  // A. Vérification de la catégorie
  await assertCategoryExists(data.idcategory);

  // B. Création de la transaction, avec l'alerte du budget de sa catégorie
  return withAlertRefresh(userId, [data.idcategory], (tx) =>
    tx.transaction.create({
      data: {
        userId,
        amount: data.amount,
        date: new Date(data.date),
        categoryId: data.idcategory,
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
      },
      // La catégorie donne le type (dépense ou revenu), dont le client a besoin pour l'afficher
      include: { category: true },
    }),
  );
};

// --- 3. Récupérer une transaction par son ID ---
export const getTransactionById = async (id: number, userId: number) => {
  const transaction = await prisma.transaction.findFirst({
    // Filtre sur l'utilisateur connecté : la transaction d'un autre est introuvable (404)
    where: { id, userId },
    include: { category: true },
  });
  return transaction;
};

// --- 4. Mettre à jour une transaction (null si inexistante ou à un autre utilisateur) ---
export const updateTransaction = async (
  id: number,
  userId: number,
  data: UpdateTransactionInput,
) => {
  // Seulement les champs envoyés : Prisma refuse un « undefined » explicite
  // (option exactOptionalPropertyTypes de TypeScript).
  // budgetId (accepté par le schéma) n'existe pas sur une transaction : il est ignoré.
  const updateData = {
    ...(data.amount !== undefined ? { amount: data.amount } : {}),
    ...(data.description !== undefined
      ? { description: data.description }
      : {}),
    // On passe la date en objet Date si elle a été modifiée
    ...(data.date ? { date: new Date(data.date) } : {}),
    // Mappage des champs idcategory -> categoryId si présent
    ...(data.idcategory ? { categoryId: data.idcategory } : {}),
  };

  const existing = await getTransactionById(id, userId);
  if (!existing) return null;
  // Après le contrôle de propriété : la dépense d'un autre reste un 404,
  // quelle que soit la catégorie demandée
  if (data.idcategory !== undefined)
    await assertCategoryExists(data.idcategory);

  // Changement de catégorie → l'ancienne a une dépense en moins, la nouvelle une en plus
  const categoryIds = [
    existing.categoryId,
    data.idcategory ?? existing.categoryId,
  ];
  return withAlertRefresh(userId, categoryIds, (tx) =>
    tx.transaction.update({
      where: { id, userId },
      data: updateData,
      include: { category: true },
    }),
  );
};

// --- 5. Supprimer une transaction (false si inexistante ou à un autre utilisateur) ---
export const deleteTransaction = async (id: number, userId: number) => {
  const existing = await getTransactionById(id, userId);
  if (!existing) return false;

  // La dépense supprimée peut faire repasser le budget sous sa limite
  await withAlertRefresh(userId, [existing.categoryId], (tx) =>
    tx.transaction.deleteMany({ where: { id, userId } }),
  );
  return true;
};
