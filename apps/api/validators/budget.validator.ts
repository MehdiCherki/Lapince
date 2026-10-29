import { z } from "zod";

// Schéma pour POST /budgets
export const createBudgetSchema = z.object({
  limit_amount: z.number().positive(),
  period: z.enum(["weekly", "monthly", "custom"]),
  id_category: z.number().int().positive(),
});

// Schéma pour PATCH /budgets/:id
export const updateBudgetSchema = z.object({
  limit_amount: z.number().positive("Le montant doit être positif").optional(),

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
