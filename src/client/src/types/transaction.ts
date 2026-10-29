export type Transaction = {
  id: number;
  amount: number;
  date: string;
  description: string | null;
  userId: number;
  categoryId: number;
  category: {
    id: number;
    name: string;
    type: "EXPENSE" | "INCOME";
    icon: string | null;
  };
};
