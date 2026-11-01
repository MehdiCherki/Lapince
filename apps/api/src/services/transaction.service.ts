// Ce service contient la logique métier liée aux transactions, comme la création d'une transaction, la validation des données, etc.
// Il interagit avec la base de données via Prisma pour effectuer les opérations nécessaires.
// Par exemple, la fonction createTransaction pourrait recevoir les données d'une nouvelle transaction, vérifier que l'utilisateur a suffisamment de fonds, créer la transaction en base, mettre à jour le solde de l'utilisateur, etc.
// En séparant la logique métier dans un service, on garde les contrôleurs propres et centrés sur la gestion des requêtes/réponses, ce qui facilite la maintenance et les tests.

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
  // Début et fin dans un même objet `date` : deux spreads séparés faisaient écraser le début par la fin
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
      include: { category: true }, // On inclut la catégorie pour avoir le type (income/expense) côté front
    }),
  );
};

// --- 3. Récupérer une transaction par son ID ---
export const getTransactionById = async (id: number, userId: number) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId }, // On s'assure que la transaction appartient bien à l'utilisateur connecté pour éviter les accès non autorisés
    include: { category: true },
  });
  return transaction;
};

// --- 4. Mettre à jour une transaction (null si elle n'existe pas ou appartient à un autre utilisateur) ---
export const updateTransaction = async (
  id: number,
  userId: number,
  data: UpdateTransactionInput,
) => {
  // Seulement les champs envoyés (Prisma refuse un « undefined » explicite : exactOptionalPropertyTypes).
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
  // Après le contrôle de propriété : la dépense d'un autre reste un 404, quelle que soit la catégorie
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

// --- 5. Supprimer une transaction (false si elle n'existe pas ou appartient à un autre utilisateur) ---
export const deleteTransaction = async (id: number, userId: number) => {
  const existing = await getTransactionById(id, userId);
  if (!existing) return false;

  // La dépense supprimée peut faire repasser le budget sous sa limite
  await withAlertRefresh(userId, [existing.categoryId], (tx) =>
    tx.transaction.deleteMany({ where: { id, userId } }),
  );
  return true;
};
