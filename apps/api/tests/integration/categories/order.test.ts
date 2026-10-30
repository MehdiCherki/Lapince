import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";

describe("Catégories — ordre de la liste", () => {
  // Sans ORDER BY, PostgreSQL renvoie l'ordre physique des lignes, qui change dès qu'une ligne est modifiée
  it("renvoie les catégories triées par id, dans l'ordre du seed", async () => {
    const cookie = await loginUser(await createVerifiedUser("categories"));

    const res = await request(app).get("/categories").set("Cookie", cookie);

    expect(res.status).toBe(200);
    const ids = (res.body as { id: number }[]).map((c) => c.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });
});
