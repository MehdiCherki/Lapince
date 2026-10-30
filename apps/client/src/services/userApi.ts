import { apiFetch } from "./apiClient";
import type { AuthUser } from "@/types/auth";
import type { ApiError } from "@/types/api";
import type { UpdateProfilePayload } from "@/types/user";

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

export async function updateUserProfile(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
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
