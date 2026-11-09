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

// La photo de profil n'accepte que l'adresse d'un avatar DiceBear telle que le client la construit
// (graine aléatoire, aucune donnée personnelle). Une adresse arbitraire en base pourrait servir à
// pister les visiteurs ou à afficher une image choisie par un tiers : l'API la refuse (400).
// Max 5 inscriptions par fichier (rate limit) : 3 requêtes /auth/register ci-dessous.
const VALID_AVATAR = "https://api.dicebear.com/9.x/lorelei/svg?seed=k3x9a1b2";
const FOREIGN_URL = "https://pisteur.example/pixel.png?visiteur=1";

describe("Photo de profil : avatar DiceBear seulement", () => {
  it("refuse une adresse arbitraire à l'inscription", async () => {
    const email = uniqueEmail("avatar_inscription_refus");

    const res = await request(app).post("/auth/register").send({
      first_name: "Test",
      last_name: "User",
      email,
      password: TEST_PASSWORD,
      photo: FOREIGN_URL,
    });

    expect(res.status).toBe(400);
    expect(await prisma.user.count({ where: { email } })).toBe(0);
  });

  it("accepte un avatar DiceBear à l'inscription", async () => {
    const email = uniqueEmail("avatar_inscription_ok");

    const res = await request(app).post("/auth/register").send({
      first_name: "Test",
      last_name: "User",
      email,
      password: TEST_PASSWORD,
      photo: VALID_AVATAR,
    });

    expect(res.status).toBe(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.photo).toBe(VALID_AVATAR);
  });

  it("refuse une adresse arbitraire à la modification du profil, accepte un avatar", async () => {
    const email = await createVerifiedUser("avatar_profil");
    const cookie = await loginUser(email);

    for (const photo of [
      FOREIGN_URL,
      "javascript:alert(1)",
      `${VALID_AVATAR}&size=99999`,
    ]) {
      const refused = await request(app)
        .patch("/users/me")
        .set("Cookie", cookie)
        .send({ photo });
      expect(refused.status).toBe(400);
    }

    const accepted = await request(app)
      .patch("/users/me")
      .set("Cookie", cookie)
      .send({ photo: VALID_AVATAR });
    expect(accepted.status).toBe(200);
    expect(accepted.body.user.photo).toBe(VALID_AVATAR);
  });
});
