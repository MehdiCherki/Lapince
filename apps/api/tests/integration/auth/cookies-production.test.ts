import { describe, it, expect, vi, afterAll } from "vitest";
import request from "supertest";
import { TEST_PASSWORD, createVerifiedUser } from "../../helpers/auth.ts";

// En dev, les cookies sont déjà SameSite=Lax et sans Secure : ce test ne prouverait rien.
// src/config.ts lit NODE_ENV à l'import, et le setup des tests a déjà chargé l'app :
// on recharge donc l'app avec la configuration de production.
process.env.NODE_ENV = "production";
vi.resetModules();
const { default: app } = await import("../../../src/app.ts");
const { prisma } = await import("../../../src/lib/prisma.ts");
afterAll(() => prisma.$disconnect());

describe("Cookies de session en production", () => {
  it("sont Secure, SameSite=Lax, et inaccessibles au JavaScript pour les jetons", async () => {
    const email = await createVerifiedUser("cookies_prod");

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: TEST_PASSWORD });

    expect(res.status).toBe(204);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies).toHaveLength(3);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/; Secure/);
      // Client et API sur le même site (/api) : les cookies ne partent pas avec les requêtes d'un autre site
      expect(cookie).toMatch(/; SameSite=Lax/);
    }
    for (const name of ["accessToken", "refreshToken"]) {
      expect(cookies.find((c) => c.startsWith(`${name}=`))).toMatch(
        /; HttpOnly/,
      );
    }
  });
});
