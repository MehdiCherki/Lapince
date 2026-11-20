import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";
import { addExpense, createBudget } from "../../helpers/budgets.ts";

describe("Alerte — isolation entre utilisateurs", () => {
  it("userB ne peut ni lire, ni marquer comme lue, ni supprimer une alerte de userA (404, comme une alerte inexistante)", async () => {
    const cookieA = await loginUser(await createVerifiedUser("alerteA"));
    const cookieB = await loginUser(await createVerifiedUser("alerteB"));

    const { categoryId } = await createBudget(cookieA, { limit: 50 });
    await addExpense(cookieA, categoryId, 80);
    const alertes = await request(app).get("/alerts").set("Cookie", cookieA);
    expect(alertes.body).toHaveLength(1);
    const idAlerte = alertes.body[0].id as number;

    const lire = await request(app)
      .get(`/alerts/${idAlerte}`)
      .set("Cookie", cookieB);
    const marquer = await request(app)
      .patch(`/alerts/${idAlerte}/read`)
      .set("Cookie", cookieB);
    const supprimer = await request(app)
      .delete(`/alerts/${idAlerte}`)
      .set("Cookie", cookieB);
    expect([lire.status, marquer.status, supprimer.status]).toEqual([
      404, 404, 404,
    ]);

    // Même réponse que pour une alerte qui n'existe pas : B n'apprend pas qu'elle existe
    const inexistante = await request(app)
      .get(`/alerts/${idAlerte + 1_000_000}`)
      .set("Cookie", cookieB);
    expect(inexistante.status).toBe(404);
    expect(lire.body).toEqual(inexistante.body);

    // L'alerte de A est intacte : toujours en base, toujours non lue
    const enBase = await prisma.alert.findUniqueOrThrow({
      where: { id: idAlerte },
    });
    expect(enBase.isRead).toBe(false);
    const lectureParA = await request(app)
      .get(`/alerts/${idAlerte}`)
      .set("Cookie", cookieA);
    expect(lectureParA.status).toBe(200);
  });
});
