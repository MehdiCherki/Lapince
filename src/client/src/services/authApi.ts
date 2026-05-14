// fichier qui permet de faire les appels à l'API d'authentification
import type { RegisterFormData, AuthUser, ApiError } from "../types/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function registerUser(
  formData: RegisterFormData,
): Promise<AuthUser> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
      credentials: "include",
    },
  );
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const error: ApiError = await response.json();
      throw error;
    }
    throw new Error("Une erreur est survenue, réessaie.");
  }
  const data = await response.json();
  return data.user;
}

export async function loginUser(credentials: LoginCredentials): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    },
  );
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const error: ApiError = await response.json();
      throw error;
    }
    throw { error: "Email ou mot de passe incorrect." } as ApiError;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/users/me`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Non authentifié ou session expirée");
  }

  const data = await response.json();
  return data.user;
}

export async function fetchLogout(): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    console.error("Erreur lors de la déconnexion côté serveur");
  }
}

export async function refreshSession(): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error("Refresh token invalide ou expiré");
  }
}
