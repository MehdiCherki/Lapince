export type Alert = {
  id: number;
  category: { id: number; name: string };
  exceededAmount: number;
  isRead: boolean;
  userId: number;
  createdAt: string;
};
