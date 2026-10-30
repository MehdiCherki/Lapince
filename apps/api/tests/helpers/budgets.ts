import { expect } from "vitest";
import request from "supertest";
import app from "../../src/app.ts";
import { prisma } from "../../src/lib/prisma.ts";

// Budget mensuel sur une catégorie de dépenses → renvoie son id et celui de la catégorie
export async function createBudget(cookie: string, { limit = 500 } = {}) {
  const category = await prisma.category.findFirstOrThrow({
    where: { type: "EXPENSE" },
  });
  const res = await request(app)
    .post("/budgets")
    .set("Cookie", cookie)
    .send({ limit_amount: limit, period: "monthly", id_category: category.id });
  expect(res.status).toBe(201);
  return { budgetId: res.body.id as number, categoryId: category.id };
}

// Dépense dans une catégorie → renvoie l'id de la transaction
export async function addExpense(
  cookie: string,
  categoryId: number,
  amount: number,
  date = new Date(),
) {
  const res = await request(app)
    .post("/transactions")
    .set("Cookie", cookie)
    .send({ amount, date: date.toISOString(), idcategory: categoryId });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

export async function countAlerts(cookie: string) {
  const res = await request(app).get("/alerts").set("Cookie", cookie);
  expect(res.status).toBe(200);
  return res.body.length as number;
}
