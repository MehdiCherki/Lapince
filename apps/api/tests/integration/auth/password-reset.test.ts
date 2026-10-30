import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { transporter } from "../../../src/lib/mailer.ts";
import {
  TEST_PASSWORD,
  createVerifiedUser,
  loginUser,
} from "../../helpers/auth.ts";

const NEW_PASSWORD = "Nouveau1@mdp";

const forgot = (email: string) =>
  request(app).post("/auth/forgot-password").send({ email });

const reset = (token: string, password: string) =>
  request(app).post("/auth/reset-password").send({ token, password });

// Le jeton en clair n'existe que dans l'email (mailer simulé par tests/setup/integration.ts)
function tokenSentTo(email: string): string {
  const calls = vi.mocked(transporter.sendMail).mock.calls;
  const mail = calls
    .map(
      ([options]) => options as { to: string; subject: string; html: string },
    )
    .filter((m) => m.to === email && m.subject.includes("Réinitialisation"))
    .at(-1);
  const token = mail?.html.match(/token=([a-f0-9]{64})/)?.[1];
  if (!token) throw new Error(`Aucun email de réinitialisation pour ${email}`);
  return token;
}

// Limites par fichier : 5 demandes de réinitialisation, 5 inscriptions
describe("Mot de passe oublié", () => {
  it("répond pareil pour un email inconnu, sans envoyer d'email", async () => {
    const email = `inconnu_${Date.now()}@lapince.fr`;

    const res = await forgot(email);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Si un compte existe/);
    expect(transporter.sendMail).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: email }),
    );
  });

  it("envoie un lien valable 30 minutes et ne stocke que le hash du jeton", async () => {
    const email = await createVerifiedUser("reset_mail");

    const res = await forgot(email);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Si un compte existe/);
    const token = tokenSentTo(email);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.passwordResetTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(user.passwordResetTokenHash).not.toBe(token);
    expect(user.passwordResetExpiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it("change le mot de passe, ferme les sessions, et le lien ne sert qu'une fois", async () => {
    const email = await createVerifiedUser("reset_ok");
    const cookie = await loginUser(email);
    await forgot(email);
    const token = tokenSentTo(email);

    const res = await reset(token, NEW_PASSWORD);
    expect(res.status).toBe(200);

    // Sessions ouvertes avant la réinitialisation : plus prolongeables
    const refresh = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookie);
    expect(refresh.status).toBe(401);

    // Ancien mot de passe refusé, nouveau accepté
    const oldLogin = await request(app)
      .post("/auth/login")
      .send({ email, password: TEST_PASSWORD });
    expect(oldLogin.status).toBe(401);
    await loginUser(email, NEW_PASSWORD);

    // Usage unique
    expect((await reset(token, "Encore1@mdp")).status).toBe(400);
  });

  it("refuse un lien expiré", async () => {
    const email = await createVerifiedUser("reset_expire");
    await forgot(email);
    const token = tokenSentTo(email);
    await prisma.user.update({
      where: { email },
      data: { passwordResetExpiresAt: new Date(Date.now() - 1000) },
    });

    const res = await reset(token, NEW_PASSWORD);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalide ou a expiré/);
  });

  it("refuse un nouveau mot de passe trop faible, avec le message de la règle", async () => {
    const email = await createVerifiedUser("reset_faible");
    await forgot(email);
    const token = tokenSentTo(email);

    const res = await reset(token, "aaaaaaaa");

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("password");
    expect(res.body.error).toMatch(/majuscule/);
  });
});
