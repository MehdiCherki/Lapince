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

// RG1 : l'email est unique sans distinction de casse. La base le garantit elle-même (index
// d'unicité + contrainte CHECK : email enregistré en minuscules, sans espaces autour), et les
// requêtes simultanées qui passent toutes la vérification préalable reçoivent un 409, jamais un 500.
// Max 5 inscriptions par fichier (rate limit) : 5 requêtes /auth/register ci-dessous.
describe("Email unique sans distinction de casse : garanti par la base", () => {
  it("la base refuse un email qui n'est pas en minuscules", async () => {
    const email = uniqueEmail("casse_base").toUpperCase();
    try {
      await expect(
        prisma.$executeRaw`INSERT INTO users (first_name, last_name, email, password, updated_at)
          VALUES ('Test', 'User', ${email}, 'x', now())`,
      ).rejects.toThrow();
      expect(await prisma.user.count({ where: { email } })).toBe(0);
    } finally {
      // Si la base l'a accepté (défaut), le nettoyage par email en minuscules ne le retrouverait pas
      await prisma.user.deleteMany({ where: { email } });
    }
  });

  it("inscriptions simultanées avec le même email : un 201, un 409", async () => {
    const email = uniqueEmail("casse_simultanee");
    const body = {
      first_name: "Test",
      last_name: "User",
      email,
      password: TEST_PASSWORD,
    };

    const responses = await Promise.all(
      [1, 2].map(() => request(app).post("/auth/register").send(body)),
    );

    const statuses = responses.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
    for (const r of responses.filter((r) => r.status === 409)) {
      expect(r.body).toEqual({
        error: "Cet email est déjà utilisé",
        field: "email",
      });
    }
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  it("deux comptes qui prennent le même nouvel email en même temps : un 200, un 409", async () => {
    const [a, b] = await Promise.all([
      createVerifiedUser("casse_changement_a"),
      createVerifiedUser("casse_changement_b"),
    ]);
    const [cookieA, cookieB] = await Promise.all([loginUser(a), loginUser(b)]);
    const target = uniqueEmail("casse_changement_cible");

    const responses = await Promise.all(
      [cookieA, cookieB].map((cookie) =>
        request(app)
          .patch("/users/me")
          .set("Cookie", cookie)
          .send({ email: target, currentPassword: TEST_PASSWORD }),
      ),
    );

    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.user.count({ where: { email: target } })).toBe(1);
  });

  it("refuse un email non ASCII à la modification du profil, comme à l'inscription", async () => {
    const cookie = await loginUser(await createVerifiedUser("casse_ascii"));

    const res = await request(app)
      .patch("/users/me")
      .set("Cookie", cookie)
      .send({ email: "çà_et_là@lapince.fr", currentPassword: TEST_PASSWORD });

    expect(res.status).toBe(400);
  });
});
