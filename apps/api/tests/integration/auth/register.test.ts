import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { transporter } from "../../../src/lib/mailer.ts";
import { uniqueEmail } from "../../helpers/auth.ts";

// Ce fichier sert aussi de témoin du mock du mailer (tests/setup/integration.ts) :
// si sendMail n'est pas un vi.fn() appelé, le mock n'est pas appliqué et de vrais emails partiraient.
const testEmail = uniqueEmail("test");

describe("POST /auth/register", () => {
  it("crée un compte non vérifié, envoie l'email de vérification et retourne 201", async () => {
    const res = await request(app).post("/auth/register").send({
      first_name: "Test",
      last_name: "User",
      email: testEmail,
      password: "Motdepasse1@",
    });

    expect(res.status).toBe(201);
    // Depuis la vérification d'email, la réponse ne renvoie plus l'utilisateur
    expect(res.body).not.toHaveProperty("user");

    // Le compte existe en base, pas encore vérifié, avec un mot de passe hashé
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).not.toBeNull();
    expect(user?.emailVerified).toBe(false);
    expect(user?.password).not.toBe("Motdepasse1@");

    // L'email de vérification part vers la bonne adresse
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: testEmail }),
    );
  });

  it("refuse un doublon d'email avec 409", async () => {
    const res = await request(app).post("/auth/register").send({
      first_name: "Test",
      last_name: "User",
      email: testEmail,
      password: "Motdepasse1@",
    });

    expect(res.status).toBe(409);
  });

  it("refuse un mot de passe sans majuscule ni caractère spécial avec 400", async () => {
    const res = await request(app).post("/auth/register").send({
      first_name: "Test",
      last_name: "User",
      email: "autre@lapince.fr",
      password: "trop_court",
    });

    expect(res.status).toBe(400);
  });
});
