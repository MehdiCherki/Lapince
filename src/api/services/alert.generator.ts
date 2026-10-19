import { prisma } from "../lib/prisma.js";

export const generateBudgetAlert = async (budgetId: number, userId: number) => {
  // 1. Récupérer le budget avec ses transactions et sa catégorie
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
    include: {
      category: true,
    },
  });

  // Si le budget n'existe pas → rien à faire
  if (!budget) return null;

  // 2. Calcul du total dépensé
  const transactionsForCategory = await prisma.transaction.findMany({
    where: { userId, categoryId: budget.category.id },
  });
  // Les dépenses sont stockées en positif → on somme directement
  const spent = transactionsForCategory
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 3. Si le budget n'est pas dépassé → aucune alerte
  if (spent <= budget.limit_amount) return null;

  // 4. Calcul du montant dépassé
  const exceededAmount = spent - budget.limit_amount;

  // 5. Vérifier si une alerte existe déjà pour cette catégorie
  const existingAlert = await prisma.alert.findFirst({
    where: {
      userId,
      categoryId: budget.category.id,
    },
  });

  if (existingAlert) {
    // L'alerte a déjà été lue → on la remet en non-lue avec le montant à jour
    // pour que l'utilisateur soit re-notifié du nouveau dépassement
    if (existingAlert.isRead) {
      return await prisma.alert.update({
        where: { id: existingAlert.id },
        data: { isRead: false, exceededAmount },
      });
    }
    // Alerte déjà non-lue → pas de doublon
    return existingAlert;
  }

  // 6. Créer une nouvelle alerte
  const alert = await prisma.alert.create({
    data: {
      userId,
      categoryId: budget.category.id,
      exceededAmount,
    },
  });

  // 7. Retourner l’alerte créée
  return alert;
};
