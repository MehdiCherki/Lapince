// Types transverses des échanges avec l'API

// Erreur renvoyée par l'API ({ error: "..." }), parfois avec le champ en cause
export interface ApiError {
  error: string;
  field?: string;
}

// Réponse paginée (GET /transactions)
export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};
