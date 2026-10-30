import { describe, it, expect, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";

vi.mock("../../../src/lib/mailer.ts", () => ({
  transporter: { sendMail: vi.fn().mockResolvedValue({}) },
}));

const emails: string[] = [];

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
});

function extractCookieHeader(res: {
  headers: Record<string, unknown>;
}): string {
  const raw = (res.headers["set-cookie"] as string[] | undefined) ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function createVerifiedUser(label: string): Promise<string> {
  const email = `${label}_${Date.now()}@lapince.fr`;
  emails.push(email);

  const res = await request(app).post("/auth/register").send({
    first_name: "Test",
    last_name: "User",
    email,
    password: "Motdepasse1@",
  });
  expect(res.status).toBe(201);

  await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });
  return email;
}

async function loginUser(
  email: string,
  password = "Motdepasse1@",
): Promise<string> {
  const res = await request(app).post("/auth/login").send({
    email,
    password,
  });
  expect(res.status).toBe(204);
  return extractCookieHeader(res);
}

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
