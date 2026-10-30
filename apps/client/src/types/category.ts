// src/types/category.ts

export type CategoryType = "EXPENSE" | "INCOME";

// Ajoute bien 'export' ici
export interface Category {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
}
