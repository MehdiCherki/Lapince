import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { disconnectRedis } from "../../../src/lib/redis.ts";
import { logger } from "../../../src/lib/logger.ts";

// Choix retenu : Redis indisponible → la requête passe sans limite (l'application reste utilisable)
// et chaque incident est journalisé. Fichier à part : il coupe la connexion Redis de ses modules.
describe("Limiteur de tentatives : Redis indisponible", () => {
  it("laisse passer les requêtes, sans erreur 500, et journalise l'incident", async () => {
    const logError = vi.spyOn(logger, "error");
    await disconnectRedis();

    // Au-delà de la limite de 10 : ni 429 ni 500, la requête suit son cours (corps vide → 400)
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post("/auth/login")
        .set("X-Forwarded-For", "203.0.113.30, 172.18.0.5")
        .send({});
      expect(res.status).toBe(400);
    }

    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      "express-rate-limit: error from store, allowing request without rate-limiting.",
    );
  });
});
