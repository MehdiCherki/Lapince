import { z } from "zod";
import { emailSchema, photoSchema } from "./auth.validator.ts";

//Schéma de mise à jour du profil
//Tous les champs sont optionnels : l'utilisateur peut modifier un seul champ à la fois
export const updateUserSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis").optional(),
  last_name: z.string().min(1, "Le nom est requis").optional(),
  photo: photoSchema.optional(),
  // Même règle qu'à l'inscription : normalisé (sans espaces, en minuscules), puis format ASCII.
  // ASCII seulement : lower() de PostgreSQL et toLowerCase() de JavaScript peuvent diverger
  // au-delà, et la contrainte CHECK de la base refuserait alors l'email normalisé par l'API.
  email: emailSchema("Format d'email invalide").optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /[A-Z]/,
      "Le mot de passe doit contenir au moins une lettre majuscule",
    )
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(
      /[@$!%*?&]/,
      "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, %, *, ?, &)",
    )
    .optional(),
  // Exigé par le contrôleur pour changer le mot de passe ou l'email (ré-authentification)
  currentPassword: z.string().optional(),
});
