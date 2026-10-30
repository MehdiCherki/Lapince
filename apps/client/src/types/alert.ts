export type Alert = {
  id: number;
  category: { id: number; name: string };
  exceededAmount: number;
  isRead: boolean;
  userId: number;
  createdAt: string;
};

// Forme brute reçue de l'API : exceededAmount est un Decimal en base, envoyé en texte ("50").
// Convertie en Alert à l'entrée de alertApi.ts.
export type AlertResponse = Omit<Alert, "exceededAmount"> & {
  exceededAmount: string;
};
