import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.ts";
import { createVerifiedUser, loginUser } from "../helpers/auth.ts";
import { createBudget } from "../helpers/budgets.ts";
import { prisma } from "../../src/lib/prisma.ts";

// Les montants sont stockés en DECIMAL(12, 2) : au centime près, moins de 10 milliards.
// Un montant hors de ces bornes doit être refusé par la validation (400 + message sous le champ),
// pas échouer en base (500) ni être arrondi sans prévenir.
const transaction = (amount: number, idcategory = 1) => ({
  amount,
  date: new Date().toISOString(),
  idcategory,
});

describe("Montants : bornes de DECIMAL(12, 2)", () => {
  it("transaction : refuse un montant de 10 milliards ou plus", async () => {
    const cookie = await loginUser(await createVerifiedUser("montant_max"));

    const res = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .send(transaction(10_000_000_000));

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("amount");
  });

  it("transaction : refuse plus de 2 décimales", async () => {
    const cookie = await loginUser(
      await createVerifiedUser("montant_decimales"),
    );

    const res = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .send(transaction(12.345));

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("amount");
  });

  it("transaction : accepte les montants au centime, jusqu'au maximum", async () => {
    const cookie = await loginUser(await createVerifiedUser("montant_ok"));
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "EXPENSE" },
    });

    // 0.29 * 100 = 28.999999999999996 en virgule flottante : ne doit pas être pris pour 3 décimales
    for (const amount of [0.29, 1234.56, 9_999_999_999.99]) {
      const res = await request(app)
        .post("/transactions")
        .set("Cookie", cookie)
        .send(transaction(amount, category.id));

      expect(res.status).toBe(201);
      expect(Number(res.body.amount)).toBe(amount);
    }
  });

  it("budget : refuse une limite hors bornes, à la création comme à la modification", async () => {
    const cookie = await loginUser(await createVerifiedUser("limite_bornes"));

    for (const limit_amount of [10_000_000_000, 12.345]) {
      const created = await request(app)
        .post("/budgets")
        .set("Cookie", cookie)
        .send({ limit_amount, period: "monthly", id_category: 1 });
      expect(created.status).toBe(400);
      expect(created.body.field).toBe("limit_amount");
    }

    const { budgetId } = await createBudget(cookie);
    const updated = await request(app)
      .patch(`/budgets/${budgetId}`)
      .set("Cookie", cookie)
      .send({ limit_amount: 12.345 });
    expect(updated.status).toBe(400);
    expect(updated.body.field).toBe("limit_amount");
  });
});
