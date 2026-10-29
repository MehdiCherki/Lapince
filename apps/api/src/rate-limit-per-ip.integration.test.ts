import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "./index.js";

vi.mock("../lib/mailer.js", () => ({
  transporter: { sendMail: vi.fn().mockResolvedValue({}) },
}));

// Reproduit la prod : navigateur → nginx-proxy → nginx du client → API.
// Chaque proxy ajoute à X-Forwarded-For l'adresse de celui qui lui a parlé :
// l'API reçoit "IP du visiteur, IP de nginx-proxy" (réseau Docker privé).
const NGINX_PROXY_IP = "172.18.0.5";
const VISITOR_A = "203.0.113.10";
const VISITOR_B = "198.51.100.20";

// Corps vide → 400 avant tout accès à la base, mais la tentative est comptée par le rate limit
const tryLogin = (forwardedFor: string) =>
  request(app)
    .post("/auth/login")
    .set("X-Forwarded-For", forwardedFor)
    .send({});

describe("Rate limit de connexion derrière les proxys", () => {
  it("compte chaque visiteur séparément, sans qu'il puisse contourner la limite", async () => {
    // 10 tentatives autorisées par fenêtre de 15 min (loginRateLimit)
    for (let i = 0; i < 10; i++) {
      expect((await tryLogin(`${VISITOR_A}, ${NGINX_PROXY_IP}`)).status).toBe(
        400,
      );
    }
    expect((await tryLogin(`${VISITOR_A}, ${NGINX_PROXY_IP}`)).status).toBe(
      429,
    );

    // Un autre visiteur n'est pas bloqué par les tentatives du premier
    expect((await tryLogin(`${VISITOR_B}, ${NGINX_PROXY_IP}`)).status).toBe(
      400,
    );

    // Le visiteur A invente une adresse en tête de son X-Forwarded-For : toujours bloqué
    // (nginx-proxy ajoute la vraie adresse après celle qu'il a reçue)
    expect(
      (await tryLogin(`1.2.3.4, ${VISITOR_A}, ${NGINX_PROXY_IP}`)).status,
    ).toBe(429);
  });
});
