import type { Category } from "./category";

export type Transaction = {
  id: number;
  amount: number;
  date: string;
  description: string | null;
  userId: number;
  categoryId: number;
  category: Pick<Category, "id" | "name" | "type" | "icon">;
};

// Forme brute reçue de l'API : amount est un Decimal en base, que Prisma envoie en texte ("150").
// Convertie en Transaction à l'entrée des services (toTransaction dans transactionApi.ts).
export type TransactionResponse = Omit<Transaction, "amount"> & {
  amount: string;
};

// Body du POST /transactions
export interface CreateTransactionPayload {
  amount: number;
  date: string;
  description: string;
  idcategory: number;
}

// Body du PATCH /transactions/:id : seuls les champs envoyés sont modifiés
export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;
