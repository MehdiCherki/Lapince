import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";

// Une dépense avant, une pendant et une après le mois d'octobre 2026
const DATES = {
  septembre: "2026-09-15T00:00:00.000Z",
  octobre: "2026-10-15T00:00:00.000Z",
  novembre: "2026-11-15T00:00:00.000Z",
};
const DEBUT_OCTOBRE = "2026-10-01T00:00:00.000Z";
const FIN_OCTOBRE = "2026-10-31T23:59:59.999Z";

describe("GET /transactions — filtre par dates", () => {
  let cookie: string;

  beforeAll(async () => {
    cookie = await loginUser(await createVerifiedUser("filtre_dates"));
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "EXPENSE" },
    });
    for (const date of Object.values(DATES)) {
      const res = await request(app)
        .post("/transactions")
        .set("Cookie", cookie)
        .send({ amount: 10, date, idcategory: category.id });
      expect(res.status).toBe(201);
    }
  });

  const datesOf = async (query: Record<string, string>) => {
    const res = await request(app)
      .get("/transactions")
      .query(query)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    return (res.body.data as { date: string }[]).map((t) => t.date).sort();
  };

  it("avec un début et une fin, ne renvoie que la période", async () => {
    expect(
      await datesOf({ startDate: DEBUT_OCTOBRE, endDate: FIN_OCTOBRE }),
    ).toEqual([DATES.octobre]);
  });

  it("avec un début seulement, renvoie tout ce qui suit", async () => {
    expect(await datesOf({ startDate: DEBUT_OCTOBRE })).toEqual([
      DATES.octobre,
      DATES.novembre,
    ]);
  });

  it("avec une fin seulement, renvoie tout ce qui précède", async () => {
    expect(await datesOf({ endDate: FIN_OCTOBRE })).toEqual([
      DATES.septembre,
      DATES.octobre,
    ]);
  });
});
