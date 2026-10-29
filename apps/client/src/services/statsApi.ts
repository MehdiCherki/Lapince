import { apiFetch } from "./apiClient";
import type { Overview, MonthlyEntry } from "../types/stats";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/stats`;

export async function fetchOverview(): Promise<Overview> {
  const res = await apiFetch(`${BASE}/overview`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} (overview)`);
  return res.json();
}

export async function fetchMonthlyStats(): Promise<MonthlyEntry[]> {
  const res = await apiFetch(`${BASE}/monthly`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} (monthly)`);
  return res.json();
}
