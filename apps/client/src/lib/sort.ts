import type { Transaction } from "@/types/transaction";

// Plus récentes d'abord ; même jour (la saisie se fait au jour) → la dernière créée d'abord.
// Même règle que l'API (orderBy date desc, id desc) : l'ordre ne bouge pas après une modification.
export function newestFirst(a: Transaction, b: Transaction): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id;
}
