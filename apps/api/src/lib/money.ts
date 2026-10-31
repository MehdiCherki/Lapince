// Argent : calcul en centimes entiers. En nombres à virgule flottante, 0,10 + 0,20 = 0,30000000000000004,
// ce qui ferait croire à un dépassement quand les dépenses égalent exactement le budget.
// Les montants sont des DECIMAL(12, 2) en base (Prisma les renvoie en Decimal) : 2 décimales au plus.
export const toCents = (amount: unknown): number =>
  Math.round(Number(amount) * 100);
