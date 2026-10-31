import { z } from "zod";
import { amountSchema } from "./amount.ts";

export const createTransactionSchema = z.object({
  amount: amountSchema("Le montant doit être strictement positif"),
  // Utilisation de la nouvelle syntaxe z.iso.datetime()
  date: z.iso.datetime({ message: "La date doit être au format ISO 8601" }),
  // Facultatif : vide ou fait d'espaces → null (l'affichage montre alors le nom de la catégorie)
  description: z
    .string()
    .trim()
    .max(255, "La description est trop longue")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  idcategory: z.number().int().positive("L'ID de la catégorie est invalide"),
  budgetId: z.number().int().positive().nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// Types déduits des schémas (source unique : validation et typage)
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const transactionQuerySchema = z.object({
  idcategory: z.coerce.number().int().positive().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
