import { describe, it, expect, vi } from "vitest";
import crypto from "node:crypto";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { transporter } from "../../../src/lib/mailer.ts";
import {
  TEST_PASSWORD,
  createVerifiedUser,
  uniqueEmail,
} from "../../helpers/auth.ts";

const sha256 = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

// Valeur du cookie refreshToken posé par une réponse
function refreshTokenOf(res: { headers: Record<string, unknown> }): string {
  const cookies = (res.headers["set-cookie"] as string[] | undefined) ?? [];
  const cookie = cookies.find((c) => c.startsWith("refreshToken="));
  if (!cookie) throw new Error("Aucun cookie refreshToken");
  return cookie.split(";")[0]!.slice("refreshToken=".length);
}

const login = (email: string) =>
  request(app).post("/auth/login").send({ email, password: TEST_PASSWORD });

const refreshWith = (token: string) =>
  request(app).post("/auth/refresh").set("Cookie", `refreshToken=${token}`);

// Limites par fichier : 5 inscriptions, 10 connexions, 30 rafraîchissements
describe("Jetons de session", () => {
  it("ne stocke que l'empreinte du jeton de rafraîchissement", async () => {
    const email = await createVerifiedUser("session_hash");

    const res = await login(email);

    expect(res.status).toBe(204);
    const token = refreshTokenOf(res);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const stored = await prisma.refreshToken.findMany({
      where: { userId: user.id },
    });
    expect(stored).toHaveLength(1);
    // Une fuite de la base ne donne aucun jeton utilisable
    expect(stored[0]!.tokenHash).toBe(sha256(token));
  });

  it("refuse un jeton de rafraîchissement déjà utilisé", async () => {
    const email = await createVerifiedUser("session_reuse");
    const token = refreshTokenOf(await login(email));

    const first = await refreshWith(token);
    const replay = await refreshWith(token);

    expect(first.status).toBe(204);
    expect(replay.status).toBe(401);
  });

  it("deux rafraîchissements simultanés avec le même jeton : un seul réussit", async () => {
    const email = await createVerifiedUser("session_race");
    const token = refreshTokenOf(await login(email));

    // Deux conditions pour que les requêtes se chevauchent vraiment, comme en production :
    // des connexions à la base déjà ouvertes (sinon la première requête finit pendant que les
    // autres attendent la leur), et un seul serveur (request(app) en démarre un par requête).
    // Avant le correctif : 2 à 3 requêtes sur 10 réussissaient, chacune créant une session.
    await Promise.all(
      Array.from({ length: 10 }, () => prisma.$queryRaw`SELECT 1`),
    );
    const server = app.listen(0);
    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(server)
          .post("/auth/refresh")
          .set("Cookie", `refreshToken=${token}`),
      ),
    );
    server.close();

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 204)).toHaveLength(1);
    expect(statuses.filter((s) => s === 401)).toHaveLength(9);
    // Une seule session issue de ce jeton : la rotation ne l'a pas dupliquée
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(
      await prisma.refreshToken.count({ where: { userId: user.id } }),
    ).toBe(1);
  });
});

// Le jeton en clair n'existe que dans l'email (mailer simulé par tests/setup/integration.ts)
function verificationTokenSentTo(email: string): string {
  const mail = vi
    .mocked(transporter.sendMail)
    .mock.calls.map(([options]) => options as { to: string; html: string })
    .filter((m) => m.to === email)
    .at(-1);
  const token = mail?.html.match(/verify-email\?token=([a-f0-9-]{36})/)?.[1];
  if (!token) throw new Error(`Aucun email de confirmation pour ${email}`);
  return token;
}

describe("Jeton de confirmation de l'email", () => {
  it("ne stocke que son empreinte, et le lien reçu confirme l'adresse une seule fois", async () => {
    const email = uniqueEmail("verify_hash");
    const register = await request(app).post("/auth/register").send({
      first_name: "Test",
      last_name: "User",
      email,
      password: TEST_PASSWORD,
    });
    expect(register.status).toBe(201);
    const token = verificationTokenSentTo(email);

    const before = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(before.emailVerificationTokenHash).toBe(sha256(token));

    const verify = await request(app)
      .get("/auth/verify-email")
      .query({ token });
    const again = await request(app).get("/auth/verify-email").query({ token });

    expect(verify.status).toBe(200);
    const after = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(after.emailVerified).toBe(true);
    expect(after.emailVerificationTokenHash).toBeNull();
    expect(again.status).toBe(400);
  });

  it("répond 400, pas 500, à un jeton en double dans l'adresse", async () => {
    const res = await request(app).get("/auth/verify-email?token=a&token=b");

    expect(res.status).toBe(400);
  });
});
