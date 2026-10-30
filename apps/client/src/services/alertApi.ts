import { apiFetch } from "./apiClient";
import type { Alert, AlertResponse } from "@/types/alert";

// Le dépassement reçu en texte (Decimal) devient un nombre, une seule fois, ici
function toAlert(raw: AlertResponse): Alert {
  return { ...raw, exceededAmount: Number(raw.exceededAmount) };
}

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

  const alerts: AlertResponse[] = await response.json();
  return alerts.map(toAlert);
}

// Marque une alerte comme lue — PATCH /alerts/:id/read
export async function markAlertAsRead(id: number): Promise<void> {
  await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/alerts/${id}/read`, {
    method: "PATCH",
  });
  // Fire-and-forget : on n'attend pas la réponse pour fermer la popup.
}
