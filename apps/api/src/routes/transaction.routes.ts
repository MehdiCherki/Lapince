import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js"; // On importe les fonctions du contrôleur de transaction. Ces fonctions contiennent la logique pour gérer les différentes opérations sur les transactions (création, récupération, mise à jour, suppression). En les important ici, on peut les associer aux routes correspondantes dans ce fichier de routing.
// Importe ici ton middleware d'authentification (ajuste le chemin selon ton projet)
import { authMiddleware } from "../middlewares/auth.middleware.ts"; // On importe le middleware d'authentification. Ce middleware vérifie que l'utilisateur est authentifié avant de lui permettre d'accéder aux routes protégées. En l'appliquant à ce router, on s'assure que toutes les routes de transaction nécessitent une authentification, ce qui est essentiel pour protéger les données sensibles des utilisateurs.

const router = Router();

// On applique le middleware d'authentification sur TOUTES les routes de ce router.
// De cette façon, req.user sera toujours présent dans le Controller ! Si l'utilisateur n'est pas authentifié, le middleware renverra une erreur avant même d'atteindre les contrôleurs, ce qui protège efficacement les routes contre les accès non autorisés.
router.use(authMiddleware);

// --- Les Routes ---
router.get("/", transactionController.getAll);
router.post("/", transactionController.create);
router.get("/:id", transactionController.getOne);
router.patch("/:id", transactionController.update);
router.delete("/:id", transactionController.remove);

export default router;
