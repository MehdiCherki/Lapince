import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";

// Le formulaire saisit un jour (input date → minuit) : les transactions d'un même jour sont à égalité.
// Sans critère de départage, PostgreSQL renvoie l'ordre physique des lignes, qui change dès
// qu'une ligne est modifiée (même cause que l'ordre des catégories, #21).
describe("GET /transactions — ordre stable", () => {
  it("départage les transactions du même jour par id décroissant, même après une modification", async () => {
    const cookie = await loginUser(await createVerifiedUser("ordre_tx"));
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "EXPENSE" },
    });
    const sameDay = new Date("2026-10-30T00:00:00.000Z").toISOString();

    const ids: number[] = [];
    for (const amount of [10, 20, 30]) {
      const res = await request(app)
        .post("/transactions")
        .set("Cookie", cookie)
        .send({ amount, date: sameDay, idcategory: category.id });
      expect(res.status).toBe(201);
      ids.push(res.body.id);
    }

    // Modifier la plus ancienne la réécrit physiquement en fin de table
    const patch = await request(app)
      .patch(`/transactions/${ids[0]}`)
      .set("Cookie", cookie)
      .send({ amount: 15 });
    expect(patch.status).toBe(200);

    const list = await request(app).get("/transactions").set("Cookie", cookie);
    expect(list.status).toBe(200);
    expect(list.body.data.map((t: { id: number }) => t.id)).toEqual(
      [...ids].reverse(),
    );
  });
});
