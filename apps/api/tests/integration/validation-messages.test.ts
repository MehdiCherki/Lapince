import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.ts";
import {
  TEST_PASSWORD,
  createVerifiedUser,
  loginUser,
  uniqueEmail,
} from "../helpers/auth.ts";

// Une erreur de validation doit dire QUOI corriger et OÙ : message de la règle + champ en cause
// (le client affiche le message sous ce champ). Avant : « Données invalides » pour tout.
describe("Messages des erreurs de validation", () => {
  it("inscription : mot de passe faible → message de la règle, sous le champ mot de passe", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        first_name: "Test",
        last_name: "User",
        email: uniqueEmail("validation_mdp"),
        password: "aaaaaaaa",
      });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("password");
    expect(res.body.error).toMatch(/majuscule/);
  });

  it("inscription : email invalide → message sous le champ email", async () => {
    const res = await request(app).post("/auth/register").send({
      first_name: "Test",
      last_name: "User",
      email: "pas-un-email",
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("email");
    expect(res.body.error).toMatch(/email/i);
  });

  it("transaction : montant négatif → message sous le champ montant", async () => {
    const cookie = await loginUser(await createVerifiedUser("validation_tx"));

    const res = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .send({
        amount: -5,
        date: new Date().toISOString(),
        idcategory: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("amount");
    expect(res.body.error).toMatch(/positif/);
  });

  it("profil : nouveau mot de passe faible → message de la règle", async () => {
    const email = await createVerifiedUser("validation_profil");
    const cookie = await loginUser(email);

    const res = await request(app)
      .patch("/users/me")
      .set("Cookie", cookie)
      .send({ password: "aaaaaaaa", currentPassword: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("password");
    expect(res.body.error).not.toBe("Données invalides");
  });
});
