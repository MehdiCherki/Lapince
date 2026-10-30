import { z, type ZodError } from "zod";

// Messages par défaut de Zod en français (règles sans message personnalisé)
z.config(z.locales.fr());

// Corps d'une réponse 400 de validation : message de la première règle non respectée
// et champ en cause, que le client affiche sous ce champ. details : toutes les erreurs.
export function validationError(error: ZodError) {
  const issue = error.issues[0];
  const field = issue?.path[0];
  return {
    error: issue?.message ?? "Données invalides",
    ...(typeof field === "string" ? { field } : {}),
    details: error.issues,
  };
}

// Identifiant d'URL (/budgets/12) : entier positif écrit en chiffres seulement, dans les bornes
// d'un INTEGER PostgreSQL. null sinon (→ 400). parseInt devinait : "12abc" → 12, "1.5" → 1,
// et un nombre trop grand faisait échouer la requête en base (500).
export function parseId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value)) return null;
  const id = Number(value);
  return id <= 2_147_483_647 ? id : null;
}
