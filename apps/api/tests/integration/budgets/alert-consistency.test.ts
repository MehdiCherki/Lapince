import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";
import { addExpense, createBudget } from "../../helpers/budgets.ts";

// Une dépense et l'alerte de son budget forment un tout : la base ne doit jamais
// contenir l'une sans l'autre à jour, même en cas d'erreur ou de requêtes simultanées.
describe("Dépense et alerte : cohérence", () => {
  it("si l'alerte ne peut pas être enregistrée, la dépense ne l'est pas non plus", async () => {
    const cookie = await loginUser(await createVerifiedUser("alerte_atomique"));
    const { categoryId } = await createBudget(cookie, { limit: 0.01 });
    await addExpense(cookie, categoryId, 9_999_999_999.99);

    // Dépassement de 19 999 999 999,97 € : ne tient pas dans DECIMAL(12, 2) → l'alerte échoue
    const res = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .send({
        amount: 9_999_999_999.99,
        date: new Date().toISOString(),
        idcategory: categoryId,
      });

    expect(res.status).toBe(500);
    const list = await request(app).get("/transactions").set("Cookie", cookie);
    expect(list.body.total).toBe(1);
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
});
