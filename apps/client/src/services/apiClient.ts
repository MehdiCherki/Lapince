import { refreshSession } from "./authApi";

// UN SEUL refresh à la fois, partagé par toutes les requêtes qui reçoivent un 401 en même temps.
// Indispensable : chaque refresh token ne sert qu'une fois (rotation, tuto de l'audit §6).
// Le tableau de bord lance 4 requêtes d'un coup : 4 refresh en parallèle avec le même cookie,
// et les 3 derniers échoueraient… et déconnecteraient l'utilisateur.
let refreshInFlight: Promise<void> | null = null;

export function refreshOnce(): Promise<void> {
  refreshInFlight ??= refreshSession().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * fetch + cookies de session. Sur un 401 : rafraîchit la session, puis rejoue la requête UNE fois.
 * Si le refresh échoue, la session est vraiment terminée : on prévient l'application.
 */
export async function apiFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const send = () => fetch(url, { ...init, credentials: "include" });

  const response = await send();
  if (response.status !== 401) return response;

  try {
    await refreshOnce();
  } catch {
    window.dispatchEvent(new Event("session-expired"));
    return response; // l'appelant traite ce 401 comme n'importe quelle erreur
  }
  return send();
}
