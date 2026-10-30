import { Router } from "express";
import * as statsController from "../controllers/stats.controller.ts";
import { authMiddleware } from "../middlewares/access.controller.middleware.ts";

const router = Router();

/**
 * Routes pour les statistiques du tableau de bord.
 * Toutes ces routes sont en lecture seule (read-only) :
 * elles ne modifient pas la base, elles agrègent simplement les données existantes.
 */

// Résumé global : revenus, dépenses, balance nette
router.get("/overview", authMiddleware, statsController.getOverview);

// Analyse mensuelle : revenus/dépenses par mois (pour le graphique à barres)
router.get("/monthly", authMiddleware, statsController.getMonthlyStats);

// Répartition par catégorie : total des dépenses par catégorie (pour un graphique en secteurs ou barres)
router.get("/categories", authMiddleware, statsController.getCategoryStats);

// Suivi des budgets : utilisation de chaque budget (limite, dépensé, restant, pourcentage)
router.get("/budgets", authMiddleware, statsController.getBudgetStats);

export default router;
