import type { Request, Response } from "express";
import * as statsService from "../services/stats.service.ts";

// GET /stats/overview
export const getOverview = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const data = await statsService.getOverview(req.user.id);
  return res.status(200).json(data);
};

// GET /stats/monthly
export const getMonthlyStats = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const data = await statsService.getMonthlyStats(req.user.id);
  return res.status(200).json(data);
};

// GET /stats/categories
export const getCategoryStats = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const data = await statsService.getCategoryStats(req.user.id);
  return res.status(200).json(data);
};

// GET /stats/budgets
export const getBudgetStats = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const data = await statsService.getBudgetStats(req.user.id);
  return res.status(200).json(data);
};
