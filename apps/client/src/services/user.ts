import { apiFetch } from "./apiClient";
import type { AuthUser, ApiError } from "@/types/auth";

export async function fetchUserProfile(): Promise<AuthUser> {
  const response = await apiFetch(
    `${import.meta.env.VITE_API_BASE_URL}/users/me`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Impossible de charger le profil utilisateur");
  }
  const data = await response.json();
  return data.user;
}

export async function updateUserProfile(payload: {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  photo?: string | null;
}): Promise<AuthUser> {
  const response = await apiFetch(
    `${import.meta.env.VITE_API_BASE_URL}/users/me`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw {
      error: data.error ?? "Erreur lors de la mise à jour",
      field: data.field,
    } as ApiError;
  }
  return data.user;
}

export async function deleteUserAccount(): Promise<void> {
  const response = await apiFetch(
    `${import.meta.env.VITE_API_BASE_URL}/users/me`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error("Erreur lors de la suppression du compte");
  }
}
