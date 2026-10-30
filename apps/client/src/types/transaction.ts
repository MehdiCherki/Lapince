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

// Body du POST /transactions
export interface CreateTransactionPayload {
  amount: number;
  date: string;
  description: string;
  idcategory: number;
}

// Body du PATCH /transactions/:id : seuls les champs envoyés sont modifiés
export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;
