import { z } from "zod";

export const registerSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  photo: z.string().optional(),
  email: z.email("Format d'email invalide"), // La REGEX PRECEDENTE N'ETAIT PAS FIABLE, ELLE LAISSAIT PASSER DES EMAILS NON VALIDES, J'AI DONC UTILISÉ LA FONCTION EMAIL DE ZOD QUI EST PLUS FIABLE ET PLUS SIMPLE À UTILISER.
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
    ),
});

export const loginSchema = z.object({
  email: z.email("Veuillez fournir une adresse email valide"),
  password: z.string("Le mot de passe est requis"),
});
