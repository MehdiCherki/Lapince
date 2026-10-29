// Budget
export type Budget = {
  id: number;
  limit_amount: number;
  period: "weekly" | "monthly" | "custom";
  id_category: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    type: "EXPENSE" | "INCOME";
  };
};
// Type pour créer un budget (body du POST /budgets)
export type CreateBudgetPayload = {
  limit_amount: number;
  period: "weekly" | "monthly" | "custom";
  id_category: number;
};

// Type pour la réponse de GET /budgets/:id/status
export type BudgetStatus = {
  budgetId: number;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
};
