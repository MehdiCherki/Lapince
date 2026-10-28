import { apiFetch } from "./apiClient";
import type { Transaction } from "../types/transaction";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/transactions`;

export type { Transaction };

export interface TransactionPayload {
  amount: number;
  date: string;
  description: string;
  idcategory: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

// GET transactions - toutes les transactions de l'utilisateur connecté
export async function fetchTransactions(
  page = 1,
  limit = 20,
): Promise<PaginatedTransactions> {
  const response = await apiFetch(`${API_URL}?page=${page}&limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Erreur ${response.status} : Impossible de récupérer les transactions`,
    );
  }
  return response.json();
}

// POST transactions - créer une transactions

export async function createTransaction(
  data: TransactionPayload,
): Promise<Transaction> {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      `Erreur ${response.status} : Impossible de créer la transaction.`,
    );
  }
  const transaction = await response.json();
  return transaction;
}

export async function deleteTransactionApi(id: number) {
  const res = await apiFetch(
    `${import.meta.env.VITE_API_BASE_URL}/transactions/${id}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error("Delete failed");
}

export async function updateTransactionApi(t: Transaction) {
  const payload = {
    amount: t.amount,
    description: t.description,
    date: t.date,
    categoryId: t.category.id,
  };

  const res = await apiFetch(
    `${import.meta.env.VITE_API_BASE_URL}/transactions/${t.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error("Erreur API");
  }

  return await res.json();
}
