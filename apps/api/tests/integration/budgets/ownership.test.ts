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

async function createBudget(cookie: string): Promise<number> {
  const category = await prisma.category.findFirstOrThrow({
    where: { type: "EXPENSE" },
  });
  const res = await request(app).post("/budgets").set("Cookie", cookie).send({
    limit_amount: 500,
    period: "monthly",
    id_category: category.id,
  });
  expect(res.status).toBe(201);
  return res.body.id;
}

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

    const budgetIdA = await createBudget(cookieA);
    const budgetIdB = await createBudget(cookieB);

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
