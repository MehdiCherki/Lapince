import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import {
  TEST_PASSWORD,
  createVerifiedUser,
  loginUser,
  uniqueEmail,
} from "../../helpers/auth.ts";

// Une adresse email ne dépend pas des majuscules (claviers mobiles : « Cherki@… ») :
// elle est enregistrée et comparée en minuscules, sans espaces autour.
// Max 5 inscriptions par fichier (rate limit) : 5 requêtes /auth/register ci-dessous.
describe("Emails insensibles à la casse", () => {
  it("enregistre l'email en minuscules, sans espaces", async () => {
    const email = uniqueEmail("casse_inscription"); // en minuscules, suivi pour le nettoyage

    const res = await request(app)
      .post("/auth/register")
      .send({
        first_name: "Test",
        last_name: "User",
        email: `  ${email.toUpperCase()}  `,
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(201);
    expect(await prisma.user.findUnique({ where: { email } })).not.toBeNull();
  });

  it("connecte avec l'email tapé en majuscules", async () => {
    const email = await createVerifiedUser("casse_connexion");

    await loginUser(email.toUpperCase());
  });

  it("refuse un second compte qui ne diffère que par la casse", async () => {
    const email = await createVerifiedUser("casse_doublon");

    const res = await request(app).post("/auth/register").send({
      first_name: "Test",
      last_name: "User",
      email: email.toUpperCase(),
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(409);
  });

  it("enregistre en minuscules un nouvel email saisi dans le profil", async () => {
    const email = await createVerifiedUser("casse_profil");
    const cookie = await loginUser(email);
    const newEmail = uniqueEmail("casse_nouveau");

    const res = await request(app)
      .patch("/users/me")
      .set("Cookie", cookie)
      .send({
        email: ` ${newEmail.toUpperCase()} `,
        currentPassword: TEST_PASSWORD,
      });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(newEmail);
  });
});
