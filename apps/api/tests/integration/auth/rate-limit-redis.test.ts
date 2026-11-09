import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";
import app from "../../../src/app.ts";
import { config } from "../../../src/config.ts";
import { redis } from "../../../src/lib/redis.ts";
import { createVerifiedUser, TEST_PASSWORD } from "../../helpers/auth.ts";

// Compteurs du limiteur dans un vrai Redis, sous le préfixe propre à ce fichier
// (tests/setup/rate-limit-prefix.ts). Un visiteur par test (adresses de documentation) :
// chaque test a son propre compteur.
const NGINX_PROXY_IP = "172.18.0.5";
const WRONG_PASSWORD = "Mauvais-mdp1@";
const WINDOW_MS = 15 * 60 * 1000;

const tryLogin = (target: Express, visitor: string, body: object = {}) =>
  request(target)
    .post("/auth/login")
    .set("X-Forwarded-For", `${visitor}, ${NGINX_PROXY_IP}`)
    .send(body);

const loginKey = (visitor: string) =>
  `${config.rateLimitPrefix}login:${visitor}`;

describe("Limiteur de connexion : compteurs dans Redis", () => {
  it("crée le compteur avec une durée de vie égale à la fenêtre de 15 minutes", async () => {
    const visitor = "203.0.113.21";

    // Corps vide → 400 avant tout accès à la base, mais la tentative est comptée
    expect((await tryLogin(app, visitor)).status).toBe(400);

    expect(await redis.sendCommand(["GET", loginKey(visitor)])).toBe("1");
    const ttl = Number(await redis.sendCommand(["PTTL", loginKey(visitor)]));
    expect(ttl).toBeGreaterThan(WINDOW_MS - 10_000);
    expect(ttl).toBeLessThanOrEqual(WINDOW_MS);
  });

  it("renvoie 429 au-delà de 10 échecs, avec le temps restant dans Retry-After", async () => {
    const visitor = "203.0.113.22";
    for (let i = 0; i < 10; i++) {
      expect((await tryLogin(app, visitor)).status).toBe(400);
    }

    const blocked = await tryLogin(app, visitor);
    expect(blocked.status).toBe(429);
    const retryAfter = Number(blocked.headers["retry-after"]);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000);
  });

  it("ne compte pas une connexion réussie, sans effacer les échecs (pas de contournement par son propre compte)", async () => {
    const visitor = "203.0.113.23";
    const email = await createVerifiedUser("rl_success");
    const wrong = { email, password: WRONG_PASSWORD };

    for (let i = 0; i < 9; i++) {
      expect((await tryLogin(app, visitor, wrong)).status).toBe(401);
    }
    expect(
      (await tryLogin(app, visitor, { email, password: TEST_PASSWORD })).status,
    ).toBe(204);

    // L'essai réussi est rendu : les 9 échecs restent comptés
    expect(await redis.sendCommand(["GET", loginKey(visitor)])).toBe("9");
    expect((await tryLogin(app, visitor, wrong)).status).toBe(401);
    // 10 échecs : même le bon mot de passe est refusé jusqu'à la fin de la fenêtre
    expect(
      (await tryLogin(app, visitor, { email, password: TEST_PASSWORD })).status,
    ).toBe(429);
  });

  it("partage le compteur entre deux instances de l'API", async () => {
    const visitor = "203.0.113.24";

    // Seconde instance : nouveaux modules, donc ses propres limiteurs et sa propre connexion Redis
    vi.resetModules();
    const { default: otherApp } = await import("../../../src/app.ts");
    const { disconnectRedis: disconnectOther } =
      await import("../../../src/lib/redis.ts");
    const { prisma: otherPrisma } = await import("../../../src/lib/prisma.ts");

    try {
      for (let i = 0; i < 5; i++) {
        expect((await tryLogin(app, visitor)).status).toBe(400);
        expect((await tryLogin(otherApp, visitor)).status).toBe(400);
      }
      // 10 tentatives au total, réparties sur les deux instances : la 11e est refusée par chacune
      expect((await tryLogin(otherApp, visitor)).status).toBe(429);
      expect((await tryLogin(app, visitor)).status).toBe(429);
    } finally {
      await disconnectOther();
      await otherPrisma.$disconnect();
    }
  });
});
