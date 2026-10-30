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
