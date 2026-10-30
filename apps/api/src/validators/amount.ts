import { z } from "zod";

// Montant en euros, stocké en DECIMAL(12, 2) : strictement positif, au centime près, moins de 10 milliards.
// Vérifié ici (400 + message sous le champ) plutôt qu'en base (500, ou arrondi sans prévenir).
export const amountSchema = (positiveMessage: string) =>
  z
    .number()
    .positive(positiveMessage)
    .max(9_999_999_999.99, "Le montant doit être inférieur à 10 milliards")
    .multipleOf(0.01, "Le montant ne peut pas avoir plus de 2 décimales");
