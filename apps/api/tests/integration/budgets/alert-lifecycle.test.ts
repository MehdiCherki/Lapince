import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";
import {
  addExpense,
  countAlerts,
  createBudget,
} from "../../helpers/budgets.ts";

describe("Alerte de budget — cycle de vie", () => {
  it("l'alerte disparaît quand on supprime la dépense qui faisait dépasser", async () => {
    // 1. Un utilisateur vérifié + son cookie
    const email = await createVerifiedUser("alert");
    const cookie = await loginUser(email);

    // 2. Budget de 100 € sur une catégorie de dépenses
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "EXPENSE" },
    });
    const budgetRes = await request(app)
      .post("/budgets")
      .set("Cookie", cookie)
      .send({
        limit_amount: 100,
        period: "monthly",
        id_category: category.id,
      });
    expect(budgetRes.status).toBe(201);

    // 3. Dépense de 150 € dans la même catégorie → dépassement de 50 €
    // ⚠️ idcategory sans underscore (≠ id_category des budgets)
    const transactionRes = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .send({
        amount: 150,
        date: new Date().toISOString(),
        idcategory: category.id,
      });
    expect(transactionRes.status).toBe(201);
    const transactionId = transactionRes.body.id;

    // 4. Le dépassement a créé une alerte
    const alertsBefore = await request(app)
      .get("/alerts")
      .set("Cookie", cookie);
    expect(alertsBefore.status).toBe(200);
    expect(alertsBefore.body).toHaveLength(1);

    // 5. On supprime la dépense qui faisait dépasser
    const deleteRes = await request(app)
      .delete(`/transactions/${transactionId}`)
      .set("Cookie", cookie);
    expect(deleteRes.status).toBe(204);

    // 6. Plus de dépassement → l'alerte a disparu
    const alertsAfter = await request(app).get("/alerts").set("Cookie", cookie);
    expect(alertsAfter.status).toBe(200);
    expect(alertsAfter.body).toHaveLength(0);
  });

  it("l'alerte disparaît quand on remonte la limite du budget", async () => {
    const cookie = await loginUser(await createVerifiedUser("raise"));
    const { budgetId, categoryId } = await createBudget(cookie, { limit: 100 });
    await addExpense(cookie, categoryId, 150);
    expect(await countAlerts(cookie)).toBe(1);

    const res = await request(app)
      .patch(`/budgets/${budgetId}`)
      .set("Cookie", cookie)
      .send({ limit_amount: 500 });
    expect(res.status).toBe(200);

    expect(await countAlerts(cookie)).toBe(0);
  });

  it("l'alerte disparaît quand on supprime le budget", async () => {
    const cookie = await loginUser(await createVerifiedUser("delbudget"));
    const { budgetId, categoryId } = await createBudget(cookie, { limit: 100 });
    await addExpense(cookie, categoryId, 150);
    expect(await countAlerts(cookie)).toBe(1);

    const res = await request(app)
      .delete(`/budgets/${budgetId}`)
      .set("Cookie", cookie);
    expect(res.status).toBe(204);

    expect(await countAlerts(cookie)).toBe(0);
  });
});
