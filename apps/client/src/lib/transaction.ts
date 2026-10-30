import type { Transaction } from "@/types/transaction";

// Nom affiché d'une transaction : son intitulé (facultatif), sinon le nom de sa catégorie.
// Même règle sur l'accueil et le tableau de bord.
export function transactionLabel(
  t: Pick<Transaction, "description" | "category">,
): string {
  return t.description?.trim() || t.category.name;
}
