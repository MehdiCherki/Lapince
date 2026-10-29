import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../lib/error.ts";

// GET /alerts
export async function getAlerts(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const alerts = await prisma.alert.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return res.json(alerts);
}

// GET /alerts/:id
export async function getAlertById(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError("Identifiant invalide");

  const alert = await prisma.alert.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!alert) throw new NotFoundError("Alerte introuvable");
  if (alert.userId !== req.user.id) throw new UnauthorizedError("Accès refusé");

  return res.json(alert);
}

// PATCH /alerts/:id/read
export async function markAlertAsRead(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError("Identifiant invalide");

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) throw new NotFoundError("Alerte introuvable");
  if (alert.userId !== req.user.id) throw new UnauthorizedError("Accès refusé");

  const updated = await prisma.alert.update({
    where: { id },
    data: { isRead: true },
  });
  return res.json(updated);
}

// PATCH /alerts/read-all
export async function markAllAlertsAsRead(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  await prisma.alert.updateMany({
    where: { userId: req.user.id },
    data: { isRead: true },
  });

  return res.json({
    message: "Toutes les alertes ont été marquées comme lues",
  });
}

// DELETE /alerts/:id
export async function deleteAlert(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError("Identifiant invalide");

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) throw new NotFoundError("Alerte introuvable");
  if (alert.userId !== req.user.id) throw new UnauthorizedError("Accès refusé");

  await prisma.alert.delete({ where: { id } });
  return res.status(204).send();
}
