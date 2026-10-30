import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";

// Intitulé facultatif (décision du 30/10) : absent, vide ou fait d'espaces → null en base,
// et l'affichage montre alors le nom de la catégorie. Jamais de texte vide enregistré.
describe("Transactions — intitulé facultatif", () => {
  it("enregistre null pour un intitulé absent, vide ou fait d'espaces, à la création comme à la modification", async () => {
    const cookie = await loginUser(await createVerifiedUser("intitule"));
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "EXPENSE" },
    });
    const create = (description?: string) =>
      request(app)
        .post("/transactions")
        .set("Cookie", cookie)
        .send({
          amount: 10,
          date: new Date().toISOString(),
          idcategory: category.id,
          ...(description !== undefined ? { description } : {}),
        });

    const absent = await create();
    expect(absent.status).toBe(201);
    expect(absent.body.description).toBeNull();

    const spaces = await create("   ");
    expect(spaces.status).toBe(201);
    expect(spaces.body.description).toBeNull();

    const named = await create("  Courses  ");
    expect(named.status).toBe(201);
    expect(named.body.description).toBe("Courses");

    // Vider l'intitulé d'une transaction existante
    const cleared = await request(app)
      .patch(`/transactions/${named.body.id}`)
      .set("Cookie", cookie)
      .send({ description: "" });
    expect(cleared.status).toBe(200);
    expect(cleared.body.description).toBeNull();
  });
});
