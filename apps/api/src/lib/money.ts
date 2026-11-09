// Argent : calcul en centimes entiers. En nombres à virgule flottante, 0,10 + 0,20 = 0,30000000000000004,
// ce qui ferait croire à un dépassement quand les dépenses égalent exactement le budget.
// En base, DECIMAL(12, 2) pour les dépenses et les budgets, DECIMAL(15, 2) pour le dépassement d'une
// alerte (Prisma les renvoie en Decimal) : 2 décimales au plus, centimes exacts en nombre JavaScript.
export const toCents = (amount: unknown): number =>
  Math.round(Number(amount) * 100);
