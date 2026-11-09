import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";
import { addExpense, createBudget } from "../../helpers/budgets.ts";

// Une dépense et l'alerte de son budget forment un tout : la base ne doit jamais
// contenir l'une sans l'autre à jour, même en cas d'erreur ou de requêtes simultanées.
describe("Dépense et alerte : cohérence", () => {
  // Le dépassement est une somme de dépenses : il peut dépasser le montant maximal d'une dépense.
  it("deux dépenses maximales valides : 201 et une alerte au montant exact, jamais un 500", async () => {
    const cookie = await loginUser(await createVerifiedUser("alerte_grosse"));
    const { categoryId } = await createBudget(cookie, { limit: 0.01 });
    await addExpense(cookie, categoryId, 9_999_999_999.99);

    // Dépassement de 19 999 999 999,97 € : plus grand que le montant maximal d'une dépense
    const res = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .send({
        amount: 9_999_999_999.99,
        date: new Date().toISOString(),
        idcategory: categoryId,
      });

    expect(res.status).toBe(201);
    const alerts = await request(app).get("/alerts").set("Cookie", cookie);
    expect(alerts.body).toHaveLength(1);
    expect(alerts.body[0].exceededAmount).toBe("19999999999.97");
  });

  it("si le dépassement excède la borne de la base : 400 explicite, et rien n'est enregistré", async () => {
    const email = await createVerifiedUser("alerte_borne");
    const cookie = await loginUser(email);
    const { categoryId } = await createBudget(cookie, { limit: 0.01 });
    const { id: userId } = await prisma.user.findUniqueOrThrow({
      where: { email },
    });
    // 1 000 dépenses maximales du mois, insérées directement (l'API en refuserait l'envoi en série
    // par lenteur, pas par règle) : 9 999 999 999 990 € au total, juste sous la borne
    await prisma.transaction.createMany({
      data: Array.from({ length: 1000 }, () => ({
        userId,
        categoryId,
        amount: 9_999_999_999.99,
        date: new Date(),
      })),
    });

    const res = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .send({
        amount: 9_999_999_999.99,
        date: new Date().toISOString(),
        idcategory: categoryId,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/trop élevé/);
    expect(await prisma.transaction.count({ where: { userId } })).toBe(1000);
  });

  it("dépenses simultanées : une seule alerte, au montant exact", async () => {
    const cookie = await loginUser(
      await createVerifiedUser("alerte_simultanee"),
    );
    const { categoryId } = await createBudget(cookie, { limit: 50 });

    await Promise.all(
      Array.from({ length: 8 }, () => addExpense(cookie, categoryId, 10)),
    );

    const alerts = await request(app).get("/alerts").set("Cookie", cookie);
    expect(alerts.body).toHaveLength(1);
    expect(Number(alerts.body[0].exceededAmount)).toBe(30);
  });

  // Défense en profondeur : même sans passer par le verrou du service, la base refuse
  // une seconde alerte pour le même utilisateur et la même catégorie (règle RG6).
  it("la base refuse une seconde alerte pour la même catégorie", async () => {
    const email = await createVerifiedUser("alerte_unique");
    const { id: userId } = await prisma.user.findUniqueOrThrow({
      where: { email },
    });
    const { id: categoryId } = await prisma.category.findFirstOrThrow({
      where: { type: "EXPENSE" },
    });

    await prisma.alert.create({
      data: { userId, categoryId, exceededAmount: 1 },
    });

    await expect(
      prisma.alert.create({ data: { userId, categoryId, exceededAmount: 2 } }),
    ).rejects.toMatchObject({ code: "P2002" });
    expect(await prisma.alert.count({ where: { userId, categoryId } })).toBe(1);
  });
});
