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
  if (res.status !== 204) {
    console.log("Error body: ", res.body || res.text);
  }
  expect(res.status).toBe(204);
  return extractCookieHeader(res);
}

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
