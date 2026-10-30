import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";
import { addExpense } from "../../helpers/budgets.ts";

// Sécurité des dépenses : authentification, isolation entre utilisateurs, validation des entrées.
// A possède une dépense ; B est un autre utilisateur connecté.
let cookieA: string;
let cookieB: string;
let userA: { id: number; email: string };
let userB: { id: number; email: string };
let categoryId: number;
let expenseA: number;

beforeAll(async () => {
  const emailA = await createVerifiedUser("secu_a");
  const emailB = await createVerifiedUser("secu_b");
  cookieA = await loginUser(emailA);
  cookieB = await loginUser(emailB);
  userA = await prisma.user.findUniqueOrThrow({ where: { email: emailA } });
  userB = await prisma.user.findUniqueOrThrow({ where: { email: emailB } });
  categoryId = (
    await prisma.category.findFirstOrThrow({ where: { type: "EXPENSE" } })
  ).id;
  expenseA = await addExpense(cookieA, categoryId, 42.5);
});

// La dépense de A est toujours là, inchangée
async function expectExpenseAIntact() {
  const res = await request(app)
    .get(`/transactions/${expenseA}`)
    .set("Cookie", cookieA);
  expect(res.status).toBe(200);
  expect(Number(res.body.amount)).toBe(42.5);
  expect(res.body.userId).toBe(userA.id);
}

const validBody = () => ({
  amount: 10,
  date: new Date().toISOString(),
  idcategory: categoryId,
});

describe("Transactions — authentification (401)", () => {
  it("refuse toutes les routes sans session", async () => {
    const calls = [
      request(app).get("/transactions"),
      request(app).post("/transactions").send(validBody()),
      request(app).get(`/transactions/${expenseA}`),
      request(app).patch(`/transactions/${expenseA}`).send({ amount: 1 }),
      request(app).delete(`/transactions/${expenseA}`),
    ];
    for (const res of await Promise.all(calls)) {
      expect(res.status).toBe(401);
    }
    await expectExpenseAIntact();
  });

  it("refuse un jeton invalide, falsifié, expiré, non signé ou de rafraîchissement", async () => {
    const claims = { userId: userA.id, email: userA.email };
    const base64url = (part: object) =>
      Buffer.from(JSON.stringify(part)).toString("base64url");
    const refreshToken = cookieA
      .split("; ")
      .find((c) => c.startsWith("refreshToken="))
      ?.slice("refreshToken=".length);
    expect(refreshToken).toBeDefined();

    const tokens = {
      quelconque: "pas-un-jeton",
      "signé avec un autre secret": jwt.sign(claims, "un-autre-secret", {
        audience: "access",
      }),
      expiré: jwt.sign(claims, process.env.JWT_SECRET!, {
        audience: "access",
        expiresIn: -60,
      }),
      // « alg: none » : jeton sans signature, que la bibliothèque doit refuser
      "non signé": `${base64url({ alg: "none", typ: "JWT" })}.${base64url({ ...claims, aud: "access" })}.`,
      // Même secret, mais audience « refresh » : ne vaut pas jeton d'accès
      "de rafraîchissement": refreshToken!,
    };

    for (const [label, token] of Object.entries(tokens)) {
      const read = await request(app)
        .get("/transactions")
        .set("Authorization", `Bearer ${token}`);
      const write = await request(app)
        .delete(`/transactions/${expenseA}`)
        .set("Authorization", `Bearer ${token}`);
      expect([label, read.status, write.status]).toEqual([label, 401, 401]);
    }
    await expectExpenseAIntact();
  });
});

describe("Transactions — isolation entre utilisateurs (404)", () => {
  it("B ne peut ni lire, ni modifier, ni supprimer la dépense de A", async () => {
    const read = await request(app)
      .get(`/transactions/${expenseA}`)
      .set("Cookie", cookieB);
    const update = await request(app)
      .patch(`/transactions/${expenseA}`)
      .set("Cookie", cookieB)
      .send({ amount: 1 });
    const remove = await request(app)
      .delete(`/transactions/${expenseA}`)
      .set("Cookie", cookieB);

    // 404 et pas 403 : B n'apprend même pas que cette dépense existe
    expect([read.status, update.status, remove.status]).toEqual([
      404, 404, 404,
    ]);
    await expectExpenseAIntact();
  });

  it("la liste de B ne contient pas les dépenses de A", async () => {
    const res = await request(app).get("/transactions").set("Cookie", cookieB);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((t: { id: number }) => t.id);
    expect(ids).not.toContain(expenseA);
  });

  it("un userId glissé dans la requête est ignoré : la dépense reste à son auteur", async () => {
    const created = await request(app)
      .post("/transactions")
      .set("Cookie", cookieB)
      .send({ ...validBody(), userId: userA.id });
    expect(created.status).toBe(201);
    expect(created.body.userId).toBe(userB.id);

    const updated = await request(app)
      .patch(`/transactions/${expenseA}`)
      .set("Cookie", cookieA)
      .send({ userId: userB.id });
    expect(updated.status).toBe(200);
    await expectExpenseAIntact();
  });
});

describe("Transactions — entrées invalides (400)", () => {
  it.each(["abc", "12abc", "1.5", "-1", "99999999999"])(
    "refuse l'identifiant %s",
    async (id) => {
      const calls = [
        request(app).get(`/transactions/${id}`).set("Cookie", cookieA),
        request(app)
          .patch(`/transactions/${id}`)
          .set("Cookie", cookieA)
          .send({ amount: 1 }),
        request(app).delete(`/transactions/${id}`).set("Cookie", cookieA),
      ];
      for (const res of await Promise.all(calls)) {
        expect(res.status).toBe(400);
      }
    },
  );

  it.each([
    ["montant négatif", { amount: -5 }],
    ["montant en texte", { amount: "12" }],
    ["date absente", { date: undefined }],
    ["date invalide", { date: "hier" }],
    ["catégorie absente", { idcategory: undefined }],
    ["catégorie inexistante", { idcategory: 2_000_000_000 }],
    ["intitulé trop long", { description: "x".repeat(256) }],
  ])("refuse une création avec %s", async (_, override) => {
    const res = await request(app)
      .post("/transactions")
      .set("Cookie", cookieA)
      .send({ ...validBody(), ...override });

    expect(res.status).toBe(400);
  });

  it("refuse une modification vers une catégorie inexistante", async () => {
    const res = await request(app)
      .patch(`/transactions/${expenseA}`)
      .set("Cookie", cookieA)
      .send({ idcategory: 2_000_000_000 });

    expect(res.status).toBe(400);
    await expectExpenseAIntact();
  });

  it("refuse des paramètres de liste hors bornes", async () => {
    for (const query of ["page=0", "limit=0", "limit=101", "idcategory=abc"]) {
      const res = await request(app)
        .get(`/transactions?${query}`)
        .set("Cookie", cookieA);
      expect([query, res.status]).toEqual([query, 400]);
    }
  });
});
