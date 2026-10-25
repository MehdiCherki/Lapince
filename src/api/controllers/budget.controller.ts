import type { Request, Response } from "express";
import * as budgetService from "../services/budget.service.ts";
import { generateBudgetAlert, removeCategoryAlert } from "../services/alert.generator.ts";

import {
  createBudgetSchema,
  updateBudgetSchema,
} from "../validators/budget.validator.js";

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
  if (!body.success)
    return res.status(400).json({ error: "Données invalides", details: body.error.issues });
  const budget = await budgetService.createBudget(req.user.id, body.data);
  await generateBudgetAlert(budget.id, req.user.id)
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
  if (!body.success)
    return res.status(400).json({ error: "Données invalides", details: body.error.issues });

  // Lu AVANT la mise à jour : seul moyen de connaître l'ancienne catégorie
  const before = await budgetService.getBudgetById(id, req.user.id);
  if (!before) return res.status(404).json({ error: "Budget introuvable" });

  const updated = await budgetService.updateBudget(id, req.user.id, body.data);

  // Budget déplacé vers une autre catégorie → l'ancienne n'a plus de limite
  if (before.id_category !== updated.id_category) {
    await removeCategoryAlert(req.user.id, before.id_category);
  }
  // Nouvelle limite et/ou nouvelle catégorie → on recalcule (crée, met à jour ou retire)
  await generateBudgetAlert(updated.id, req.user.id);

  return res.status(200).json(updated);
};

// --- 5. DELETE /budgets/:id ---
export const deleteBudget = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

  const deleted = await budgetService.deleteBudget(id, req.user.id);
  // Plus de budget = plus de limite : l'alerte de la catégorie disparaît avec lui
  await removeCategoryAlert(req.user.id, deleted.id_category);
  return res.status(204).send();
};

