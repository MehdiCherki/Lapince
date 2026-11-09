import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { errorMiddleware } from "./error.middleware.ts";
import { logger } from "../lib/logger.ts";

vi.mock("../lib/logger.ts", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

// Réponse Express simulée : on lit le code et le corps envoyés
const fakeResponse = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const run = (err: unknown) => {
  const res = fakeResponse();
  errorMiddleware(
    err,
    {} as Request,
    res as unknown as Response,
    vi.fn() as NextFunction,
  );
  return res;
};

// Détail renvoyé par PostgreSQL : il recopie la ligne refusée (email, hash du mot de passe)
const detail =
  "Failing row contains (1, T, U, MAJUSCULES@EXEMPLE.FR, $argon2id$…)";

describe("errorMiddleware : contrainte CHECK de la base", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requête brute refusée par une contrainte CHECK → 400, sans le détail dans le journal", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Raw query failed", {
      code: "P2010",
      clientVersion: "test",
      meta: {
        driverAdapterError: { cause: { originalCode: "23514", detail } },
      },
    });

    const res = run(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Données invalides" });
    expect(logger.error).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain(
      "MAJUSCULES",
    );
  });

  it("écriture Prisma refusée par une contrainte CHECK (erreur de l'adaptateur) → 400", () => {
    const err = new Error("violates check constraint");
    err.name = "DriverAdapterError";
    err.cause = { originalCode: "23514", detail };

    const res = run(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("toute autre erreur imprévue reste un 500 sans détail", () => {
    const res = run(new Error("panne"));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
