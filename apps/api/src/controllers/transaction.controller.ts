import type { Request, Response } from "express";
import * as transactionService from "../services/transaction.service.ts";

import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from "../validators/transaction.validator.ts";
import { validationError } from "../lib/validation.ts";

// --- 1. GET /transactions ---
export const getAll = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const filters = transactionQuerySchema.safeParse(req.query || {});
  if (!filters.success)
    return res.status(400).json(validationError(filters.error));

  const transactions = await transactionService.getAllTransactions(
    req.user.id,
    filters.data,
  );
  return res.status(200).json(transactions);
};

// --- 2. POST /transactions ---
export const create = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const body = createTransactionSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json(validationError(body.error));

  // Le service recalcule aussi l'alerte du budget de la catégorie (même transaction)
  const transaction = await transactionService.createTransaction(
    req.user.id,
    body.data,
  );

  return res.status(201).json(transaction);
};

// --- 3. GET /transactions/:id ---
export const getOne = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

  const transaction = await transactionService.getTransactionById(
    id,
    req.user.id,
  );
  if (!transaction)
    return res.status(404).json({ error: "Transaction introuvable" });

  return res.status(200).json(transaction);
};

// --- 4. PATCH /transactions/:id ---
export const update = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

  const body = updateTransactionSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json(validationError(body.error));

  const updatedTransaction = await transactionService.updateTransaction(
    id,
    req.user.id,
    body.data,
  );
  if (!updatedTransaction)
    return res
      .status(404)
      .json({ error: "Transaction introuvable ou non autorisée" });

  return res.status(200).json(updatedTransaction);
};

// --- 5. DELETE /transactions/:id ---
export const remove = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

  const deleted = await transactionService.deleteTransaction(id, req.user.id);
  if (!deleted)
    return res
      .status(404)
      .json({ error: "Transaction introuvable ou non autorisée" });

  return res.status(204).send();
};
