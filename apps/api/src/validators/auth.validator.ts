import { z } from "zod";

// Email normalisé AVANT la vérification du format : sans espaces autour, en minuscules
// (une adresse ne dépend pas de la casse ; un clavier mobile met souvent une majuscule)
export const emailSchema = (message: string) =>
  z.string().trim().toLowerCase().pipe(z.email(message));

// Photo de profil : seulement l'adresse d'un avatar DiceBear, telle que le client la construit
// (graine aléatoire, aucune donnée personnelle). Une adresse arbitraire en base pourrait servir à
// pister les visiteurs ou à afficher une image choisie par un tiers : elle est refusée (400).
export const photoSchema = z
  .string()
  .regex(
    /^https:\/\/api\.dicebear\.com\/9\.x\/lorelei\/svg\?seed=[a-z0-9]{1,16}$/,
    "Avatar invalide",
  );

// Règles du mot de passe, communes à l'inscription et à la réinitialisation
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(
    /[@$!%*?&]/,
    "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, %, *, ?, &)",
  );

export const registerSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  photo: photoSchema.optional(),
  email: emailSchema("Format d'email invalide"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema("Veuillez fournir une adresse email valide"),
  password: z.string("Le mot de passe est requis"),
});

// POST /auth/forgot-password
export const forgotPasswordSchema = z.object({
  email: emailSchema("Veuillez fournir une adresse email valide"),
});

// POST /auth/reset-password
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Lien invalide"),
  password: passwordSchema,
});
