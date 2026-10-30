import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";
import { createBudget } from "../../helpers/budgets.ts";

async function getBudgetStatus(
  method: "get" | "delete",
  id: number,
  cookie: string,
): Promise<number> {
  const res = await request(app)
    [method](`/budgets/${id}`)
    .set("Cookie", cookie);
  return res.status;
}

describe("Budget — isolation entre utilisateurs", () => {
  it("userB ne peut ni voir ni supprimer un budget de userA", async () => {
    const emailA = await createVerifiedUser("userA");
    const emailB = await createVerifiedUser("userB");

    const cookieA = await loginUser(emailA);
    const cookieB = await loginUser(emailB);

    const { budgetId: budgetIdA } = await createBudget(cookieA);
    const { budgetId: budgetIdB } = await createBudget(cookieB);

    expect(await getBudgetStatus("get", budgetIdA, cookieB)).toBe(404);
    expect(await getBudgetStatus("delete", budgetIdA, cookieB)).toBe(404);
    expect(await getBudgetStatus("get", budgetIdA, cookieA)).toBe(200);
    expect(await getBudgetStatus("get", budgetIdB, cookieB)).toBe(200);
  });
  it("refuse un deuxième budget sur la même catégorie (409)", async () => {
    const cookie = await loginUser(await createVerifiedUser("unique"));
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "EXPENSE" },
    });
    const body = {
      limit_amount: 200,
      period: "monthly",
      id_category: category.id,
    };

    const first = await request(app)
      .post("/budgets")
      .set("Cookie", cookie)
      .send(body);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/budgets")
      .set("Cookie", cookie)
      .send(body);
    expect(second.status).toBe(409);
    expect(second.body.error).toBe(
      "Un budget existe déjà pour cette catégorie",
    );
  });
});
