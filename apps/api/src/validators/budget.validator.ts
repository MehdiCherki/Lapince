import { z } from "zod";
import { amountSchema } from "./amount.ts";

// Schéma pour POST /budgets
export const createBudgetSchema = z.object({
  limit_amount: amountSchema("Le montant doit être positif"),
  period: z.enum(["weekly", "monthly", "custom"]),
  id_category: z.number().int().positive(),
});

// Schéma pour PATCH /budgets/:id
export const updateBudgetSchema = z.object({
  limit_amount: amountSchema("Le montant doit être positif").optional(),

  period: z
    .enum(["weekly", "monthly", "custom"], {
      message: "La période doit être 'weekly', 'monthly' ou 'custom'",
    })
    .optional(),

  id_category: z
    .number()
    .int("L'identifiant doit être un entier")
    .positive("Catégorie invalide")
    .optional(),
});

// Types des corps de requête, déduits des schémas (source unique : validation et typage)
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
