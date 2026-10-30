import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";

describe("Limite de sessions par utilisateur", () => {
  it("garde au plus 5 sessions et ferme la plus ancienne", async () => {
    const email = await createVerifiedUser("max");
    const cookies: string[] = [];
    for (let i = 0; i < 7; i++) cookies.push(await loginUser(email));

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(
      await prisma.refreshToken.count({ where: { userId: user.id } }),
    ).toBe(5);

    expect(
      (await request(app).post("/auth/refresh").set("Cookie", cookies[0]!))
        .status,
    ).toBe(401);
    expect(
      (await request(app).post("/auth/refresh").set("Cookie", cookies[6]!))
        .status,
    ).toBe(204);
  });
});
