import type { Budget } from "@/types/budget";

// Données de test partagées entre fichiers de test (ne pas modifier dans un test : copier avec { ...coursesBudget })

export const coursesBudget: Budget = {
  id: 1,
  limit_amount: 300,
  period: "monthly",
  id_category: 3,
  userId: 7,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  category: { id: 3, name: "Courses", type: "EXPENSE" },
};
