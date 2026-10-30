import type { Request, Response } from "express";
// Le service recalcule aussi les alertes des catégories touchées (même transaction)
import * as budgetService from "../services/budget.service.ts";

import {
  createBudgetSchema,
  updateBudgetSchema,
} from "../validators/budget.validator.ts";
import { validationError } from "../lib/validation.ts";

// --- 1. GET /budgets ---
export const getBudgets = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  const budgets = await budgetService.getAllBudgets(req.user.id);
  return res.status(200).json(budgets);
};

// --- 2. POST /budgets ---
export const createBudget = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  const body = createBudgetSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json(validationError(body.error));
  const budget = await budgetService.createBudget(req.user.id, body.data);
  return res.status(201).json(budget);
};

// --- 3. GET /budgets/:id ---
export const getBudgetById = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
  const budget = await budgetService.getBudgetById(id, req.user.id);
  if (!budget) return res.status(404).json({ error: "Budget introuvable" });
  return res.status(200).json(budget);
};

// --- 4. PATCH /budgets/:id ---
export const updateBudget = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

  const body = updateBudgetSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json(validationError(body.error));

  // Budget absent ou d'un autre utilisateur → NotFoundError (404)
  const updated = await budgetService.updateBudget(id, req.user.id, body.data);
  return res.status(200).json(updated);
};

// --- 5. DELETE /budgets/:id ---
export const deleteBudget = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

  await budgetService.deleteBudget(id, req.user.id);
  return res.status(204).send();
};
