import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";
import { addExpense, createBudget } from "../../helpers/budgets.ts";

// Données d'un utilisateur : transactions, budgets, alertes, sessions
const dataOf = (userId: number) =>
  Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.budget.count({ where: { userId } }),
    prisma.alert.count({ where: { userId } }),
    prisma.refreshToken.count({ where: { userId } }),
  ]);

// RG9 : supprimer son compte supprime toutes ses données (clés étrangères en cascade)
describe("DELETE /users/me — suppression du compte", () => {
  it("supprime le compte et toutes ses données, et ferme la session", async () => {
    const email = await createVerifiedUser("suppression");
    const cookie = await loginUser(email);
    const { categoryId } = await createBudget(cookie, { limit: 10 });
    await addExpense(cookie, categoryId, 50); // dépasse le budget : une alerte
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(await dataOf(user.id)).toEqual([1, 1, 1, 1]);

    const res = await request(app).delete("/users/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await dataOf(user.id)).toEqual([0, 0, 0, 0]);
    // La session ne peut plus être renouvelée
    const refresh = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookie);
    expect(refresh.status).toBe(401);
  });

  it("ne touche pas aux données d'un autre utilisateur", async () => {
    const cookieA = await loginUser(await createVerifiedUser("suppression_a"));
    const emailB = await createVerifiedUser("suppression_b");
    const cookieB = await loginUser(emailB);
    const { categoryId } = await createBudget(cookieB, { limit: 10 });
    await addExpense(cookieB, categoryId, 50);
    const userB = await prisma.user.findUniqueOrThrow({
      where: { email: emailB },
    });

    const res = await request(app).delete("/users/me").set("Cookie", cookieA);

    expect(res.status).toBe(200);
    expect(await dataOf(userB.id)).toEqual([1, 1, 1, 1]);
  });

  it("refuse sans session", async () => {
    const res = await request(app).delete("/users/me");

    expect(res.status).toBe(401);
  });
});
