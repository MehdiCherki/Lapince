// fichier qui permet de faire les appels à l'API d'authentification
import type { RegisterPayload, AuthUser, LoginPayload } from "@/types/auth";
import type { ApiError } from "@/types/api";

export async function registerUser(formData: RegisterPayload): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

export async function loginUser(credentials: LoginPayload): Promise<void> {
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

// Réponse d'erreur de l'API → ApiError (message lisible), même quand le corps n'est pas du JSON
async function toApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  return {
    error: body?.error ?? "Une erreur est survenue, réessayez.",
    ...(body?.field ? { field: body.field } : {}),
  };
}

// POST /auth/forgot-password — renvoie le message de l'API (identique que le compte existe ou non)
export async function requestPasswordReset(email: string): Promise<string> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );
  if (!response.ok) throw await toApiError(response);
  const data = await response.json();
  return data.message;
}

// POST /auth/reset-password — jeton reçu par email + nouveau mot de passe
export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    },
  );
  if (!response.ok) throw await toApiError(response);
}
