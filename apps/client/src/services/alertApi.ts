import { apiFetch } from "./apiClient";
import type { Alert } from "@/types/alert";

export async function fetchAlerts(): Promise<Alert[]> {
  const response = await apiFetch(
    `${import.meta.env.VITE_API_BASE_URL}/alerts`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} en chargeant les alertes`);
  }

  return response.json();
  // Le JSON renvoyé a exactement la même shape que notre type Alert :
  // { id, categoryName, exceededAmount, isRead, userId, createdAt
}

// Marque une alerte comme lue — PATCH /alerts/:id/read
export async function markAlertAsRead(id: number): Promise<void> {
  await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/alerts/${id}/read`, {
    method: "PATCH",
  });
  // Fire-and-forget : on n'attend pas la réponse pour fermer la popup.
}
