import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.ts";
import { createVerifiedUser, loginUser } from "../helpers/auth.ts";
import { createBudget } from "../helpers/budgets.ts";

// Entrées invalides sur les budgets et les catégories : 400, jamais 500 ni une ressource devinée
// (parseInt("12abc") vaudrait 12). Les transactions : transactions/security.test.ts.
let cookie: string;
let budgetId: number;

beforeAll(async () => {
  cookie = await loginUser(await createVerifiedUser("entrees_invalides"));
  ({ budgetId } = await createBudget(cookie));
});

describe("Identifiants invalides (400)", () => {
  it.each(["12abc", "1.5", "-1", "99999999999"])(
    "budgets et catégories refusent l'identifiant %s",
    async (id) => {
      const calls = {
        "GET /budgets": request(app)
          .get(`/budgets/${id}`)
          .set("Cookie", cookie),
        "PATCH /budgets": request(app)
          .patch(`/budgets/${id}`)
          .set("Cookie", cookie)
          .send({ limit_amount: 1 }),
        "DELETE /budgets": request(app)
          .delete(`/budgets/${id}`)
          .set("Cookie", cookie),
        "GET /categories": request(app)
          .get(`/categories/${id}`)
          .set("Cookie", cookie),
      };
      for (const [route, call] of Object.entries(calls)) {
        expect([route, (await call).status]).toEqual([route, 400]);
      }
    },
  );
});

describe("Catégorie inexistante (400)", () => {
  it("refuse un budget sur une catégorie inexistante", async () => {
    const created = await request(app)
      .post("/budgets")
      .set("Cookie", cookie)
      .send({
        limit_amount: 100,
        period: "monthly",
        id_category: 2_000_000_000,
      });
    const moved = await request(app)
      .patch(`/budgets/${budgetId}`)
      .set("Cookie", cookie)
      .send({ id_category: 2_000_000_000 });

    expect([created.status, moved.status]).toEqual([400, 400]);
  });
});
