import type { Category } from "./category";

export type BudgetPeriod = "weekly" | "monthly" | "custom";

// Budget
export type Budget = {
  id: number;
  limit_amount: number;
  period: BudgetPeriod;
  id_category: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, "id" | "name" | "type">;
};
// Type pour créer un budget (body du POST /budgets)
export type CreateBudgetPayload = {
  limit_amount: number;
  period: BudgetPeriod;
  id_category: number;
};

// Body du PATCH /budgets/:id : seuls les champs envoyés sont modifiés
export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;
