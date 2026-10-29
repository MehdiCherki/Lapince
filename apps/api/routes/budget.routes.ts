// Toutes les routes sont protégées par le middleware JWT
// -------------------------------------------------------

import { Router } from "express";
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} from "../controllers/budget.controller.js";

import { authMiddleware } from "../middlewares/access.controller.middleware.ts";

const router = Router();

// Créer un budget
router.post("/", authMiddleware, createBudget);

// Récupérer tous les budgets de l'utilisateur connecté
router.get("/", authMiddleware, getBudgets);

// Récupérer un budget spécifique
router.get("/:id", authMiddleware, getBudgetById);

// Modifier un budget (mise à jour partielle)
router.patch("/:id", authMiddleware, updateBudget);

// Supprimer un budget
router.delete("/:id", authMiddleware, deleteBudget);

export default router;
