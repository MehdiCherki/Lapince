import { apiFetch } from "./apiClient";
import type { Budget, CreateBudgetPayload, BudgetStatus } from "@/types/budget";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/budgets`;

// Lève une erreur avec le message renvoyé par l'API ({ error: "..." }) quand il existe.
// .catch(() => null) : si la réponse n'est pas du JSON (proxy en panne…), on garde un message générique.
async function throwApiError(
  response: Response,
  fallback: string,
): Promise<never> {
  const body = await response.json().catch(() => null);
  throw new Error(body?.error ?? `${fallback} (erreur ${response.status})`);
}

// GET /budgets — tous les budgets de l'utilisateur connecté
export async function fetchBudgets(): Promise<Budget[]> {
  const response = await apiFetch(API_URL, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} en chargeant les budgets`);
  }
  return response.json();
}

// POST /budgets — créer un budget

export async function createBudget(
  payload: CreateBudgetPayload,
): Promise<Budget> {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    await throwApiError(response, "Impossible de créer le budget");

  return response.json() as Promise<Budget>;
}

// PATCH /budgets/:id — modifier un budget

export async function updateBudget(
  id: number,
  data: Partial<CreateBudgetPayload>,
): Promise<Budget> {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok)
    await throwApiError(response, "Impossible de modifier le budget");

  return response.json() as Promise<Budget>;
}

// DELETE /budgets/:id — supprimer un budget

export async function deleteBudget(id: number): Promise<void> {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok)
    await throwApiError(response, "Impossible de supprimer le budget");
  // 204 No Content : pas de corps à lire (response.json() lèverait une erreur)
}

// GET /budgets/:id/status — dépensé / restant / pourcentage

export async function fetchBudgetStatus(id: number): Promise<BudgetStatus[]> {
  const response = await apiFetch(`${API_URL}/${id}/status`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Erreur ${response.status} en chargeant le statut du budget`,
    );
  }
  return response.json();
}
