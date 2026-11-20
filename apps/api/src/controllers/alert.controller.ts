import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { BadRequestError, NotFoundError } from "../lib/error.ts";
import { getUserAlerts } from "../services/alert.service.ts";

// Alerte de l'utilisateur connecté, sinon 404 : celle d'un autre répond comme une alerte
// inexistante, pour ne pas révéler qu'elle existe (même règle que les transactions et les budgets)
async function findOwnAlert(id: number, userId: number) {
  const alert = await prisma.alert.findFirst({
    where: { id, userId },
    include: { category: true },
  });
  if (!alert) throw new NotFoundError("Alerte introuvable");
  return alert;
}

// GET /alerts
export async function getAlerts(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  // Recalculées avant lecture (changement de mois ou de semaine)
  const alerts = await getUserAlerts(req.user.id);
  return res.json(alerts);
}

// GET /alerts/:id
export async function getAlertById(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError("Identifiant invalide");

  const alert = await findOwnAlert(id, req.user.id);
  return res.json(alert);
}

// PATCH /alerts/:id/read
export async function markAlertAsRead(req: Request, res: Response) {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError("Identifiant invalide");

  await findOwnAlert(id, req.user.id);

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

  await findOwnAlert(id, req.user.id);

  await prisma.alert.delete({ where: { id } });
  return res.status(204).send();
}
