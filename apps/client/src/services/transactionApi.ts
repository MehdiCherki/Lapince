import { apiFetch } from "./apiClient";
import type {
  Transaction,
  TransactionResponse,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from "@/types/transaction";
import type { Paginated } from "@/types/api";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/transactions`;

// Seul endroit où le montant reçu en texte devient un nombre : le reste de l'app manipule des nombres
function toTransaction(raw: TransactionResponse): Transaction {
  return { ...raw, amount: Number(raw.amount) };
}

// GET transactions - toutes les transactions de l'utilisateur connecté
export async function fetchTransactions(
  page = 1,
  limit = 20,
): Promise<Paginated<Transaction>> {
  const response = await apiFetch(`${API_URL}?page=${page}&limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Erreur ${response.status} : Impossible de récupérer les transactions`,
    );
  }
  const body: Paginated<TransactionResponse> = await response.json();
  return { ...body, data: body.data.map(toTransaction) };
}

// GET toutes les transactions (toutes les pages) - pour le tableau de bord,
// qui filtre et calcule ses totaux dans le navigateur
export async function fetchAllTransactions(): Promise<Transaction[]> {
  const first = await fetchTransactions(1, 100); // 100 = maximum accepté par l'API
  const all = [...first.data];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await fetchTransactions(page, 100);
    all.push(...next.data);
  }
  return all;
}

// POST transactions - créer une transactions

export async function createTransaction(
  data: CreateTransactionPayload,
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
  const transaction: TransactionResponse = await response.json();
  return toTransaction(transaction);
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

export async function updateTransactionApi(
  t: Transaction,
): Promise<Transaction> {
  const payload: UpdateTransactionPayload = {
    // Déjà un nombre (toTransaction), mais le formulaire de modification écrit dans t.amount :
    // la conversion garantit un nombre à l'API quoi que la saisie y ait mis
    amount: Number(t.amount),
    // null refusé par l'API ; undefined fait disparaître la clé du JSON → champ inchangé
    description: t.description ?? undefined,
    date: t.date,
    idcategory: t.category.id,
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

  const updated: TransactionResponse = await res.json();
  return toTransaction(updated);
}
