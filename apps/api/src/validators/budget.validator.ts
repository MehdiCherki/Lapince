import { z } from "zod";
import { amountSchema } from "./amount.ts";

// Période du budget : mois ou semaine en cours. « custom » (encore dans le type de la base) est refusé :
// aucune date de début ni de fin n'est enregistrée, la période ne pourrait pas être calculée.
const periodSchema = z.enum(["weekly", "monthly"], {
  message: "La période doit être 'weekly' ou 'monthly'",
});

// Schéma pour POST /budgets
export const createBudgetSchema = z.object({
  limit_amount: amountSchema("Le montant doit être positif"),
  period: periodSchema,
  id_category: z.number().int().positive(),
});

// Schéma pour PATCH /budgets/:id
export const updateBudgetSchema = z.object({
  limit_amount: amountSchema("Le montant doit être positif").optional(),

  period: periodSchema.optional(),

  id_category: z
    .number()
    .int("L'identifiant doit être un entier")
    .positive("Catégorie invalide")
    .optional(),
});

// Types des corps de requête, déduits des schémas (source unique : validation et typage)
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
