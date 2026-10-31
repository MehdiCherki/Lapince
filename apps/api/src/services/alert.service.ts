import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.ts";

// Client des requêtes : le client global, ou celui d'une transaction en cours
type Db = Prisma.TransactionClient;

// Argent : calcul en centimes entiers. En nombres à virgule flottante, 0,10 + 0,20 = 0,30000000000000004,
// ce qui ferait croire à un dépassement quand les dépenses égalent exactement le budget.
// Les montants sont des DECIMAL(12, 2) en base (Prisma les renvoie en Decimal) : 2 décimales au plus.
const toCents = (amount: unknown): number => Math.round(Number(amount) * 100);

export const generateBudgetAlert = async (
  budgetId: number,
  userId: number,
  db: Db = prisma,
) => {
  // 1. Récupérer le budget avec ses transactions et sa catégorie
  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId },
    include: {
      category: true,
    },
  });

  // Si le budget n'existe pas → rien à faire
  if (!budget) return null;

  // 2. Calcul du total dépensé
  const transactionsForCategory = await db.transaction.findMany({
    where: { userId, categoryId: budget.category.id },
  });
  // Les dépenses sont stockées en positif → on somme directement
  const spentCents = transactionsForCategory.reduce(
    (sum, t) => sum + toCents(t.amount),
    0,
  );
  const limitCents = toCents(budget.limit_amount);

  // 3. Budget pas (ou plus) dépassé → on retire l'alerte éventuelle de cette catégorie
  if (spentCents <= limitCents) {
    await removeCategoryAlert(userId, budget.category.id, db);
    return null;
  }

  // 4. Calcul du montant dépassé (repassé en euros, exact au centime)
  const exceededAmount = (spentCents - limitCents) / 100;

  // 5. Vérifier si une alerte existe déjà pour cette catégorie
  const existingAlert = await db.alert.findFirst({
    where: {
      userId,
      categoryId: budget.category.id,
    },
  });

  if (existingAlert) {
    // L'alerte a déjà été lue → on la remet en non-lue avec le montant à jour
    // pour que l'utilisateur soit re-notifié du nouveau dépassement
    if (existingAlert.isRead) {
      return await db.alert.update({
        where: { id: existingAlert.id },
        data: { isRead: false, exceededAmount },
      });
    }
    // Alerte non lue mais montant périmé → on met juste le montant à jour
    if (toCents(existingAlert.exceededAmount) !== spentCents - limitCents) {
      return await db.alert.update({
        where: { id: existingAlert.id },
        data: { exceededAmount },
      });
    }
    // Alerte non lue et montant à jour → rien à faire
    return existingAlert;
  }

  // 6. Créer une nouvelle alerte
  const alert = await db.alert.create({
    data: {
      userId,
      categoryId: budget.category.id,
      exceededAmount,
    },
  });

  // 7. Retourner l’alerte créée
  return alert;
};

export const removeCategoryAlert = (
  userId: number,
  categoryId: number,
  db: Db = prisma,
) => db.alert.deleteMany({ where: { userId, categoryId } });

// Alerte d'une catégorie : calculée d'après son budget s'il y en a un, sinon aucune alerte
const refreshCategoryAlert = async (
  db: Db,
  userId: number,
  categoryId: number,
) => {
  const budget = await db.budget.findFirst({
    where: { userId, id_category: categoryId },
  });
  if (budget) await generateBudgetAlert(budget.id, userId, db);
  else await removeCategoryAlert(userId, categoryId, db);
};

// Écrit une dépense ou un budget, puis recalcule les alertes des catégories touchées,
// dans une seule transaction : tout est enregistré, ou rien (une alerte qui échoue annule l'écriture).
// Le verrou par (utilisateur, catégorie) fait passer les requêtes simultanées l'une après l'autre :
// chacune recalcule l'alerte en voyant les écritures déjà validées par les autres. Il est libéré
// à la fin de la transaction. Catégories verrouillées par ordre croissant : deux requêtes ne peuvent
// pas s'attendre mutuellement (interblocage).
export const withAlertRefresh = <T>(
  userId: number,
  categoryIds: number[],
  write: (tx: Db) => Promise<T>,
) =>
  prisma.$transaction(async (tx) => {
    const ids = [...new Set(categoryIds)].sort((a, b) => a - b);
    for (const id of ids) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::int, ${id}::int)`;
    }
    const result = await write(tx);
    for (const id of ids) await refreshCategoryAlert(tx, userId, id);
    return result;
  });
