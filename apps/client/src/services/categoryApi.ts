import { apiFetch } from "./apiClient";
import type { Category } from "../types/category";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/categories`;

/**
 * Récupère toutes les catégories — GET /categories
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await apiFetch(API_URL, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Erreur ${response.status} : Impossible de récupérer les catégories.`,
    );
  }

  return response.json();
}

/**
 * Récupère une catégorie spécifique par son ID — GET /categories/:id
 */
export async function fetchCategoryById(id: number): Promise<Category> {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status} : Catégorie ${id} introuvable.`);
  }

  return response.json();
}
