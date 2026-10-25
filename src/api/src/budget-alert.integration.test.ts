import { describe, it, expect, afterAll, vi } from "vitest";
import request from "supertest";
import app from "./index.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/mailer.js", () => ({
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

describe("Alerte de budget — cycle de vie", () => {
  it("l'alerte disparaît quand on supprime la dépense qui faisait dépasser", async () => {
    // 1. Un utilisateur vérifié + son cookie
    const email = await createVerifiedUser("alert");
    const cookie = await loginUser(email);

    // 2. Budget de 100 € sur une catégorie de dépenses
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "EXPENSE" },
    });
    const budgetRes = await request(app)
      .post("/budgets")
      .set("Cookie", cookie)
      .send({
        limit_amount: 100,
        period: "monthly",
        id_category: category.id,
      });
    expect(budgetRes.status).toBe(201);

    // 3. Dépense de 150 € dans la même catégorie → dépassement de 50 €
    // ⚠️ idcategory sans underscore (≠ id_category des budgets)
    const transactionRes = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .send({
        amount: 150,
        date: new Date().toISOString(),
        idcategory: category.id,
      });
    expect(transactionRes.status).toBe(201);
    const transactionId = transactionRes.body.id;

    // 4. Le dépassement a créé une alerte
    const alertsBefore = await request(app).get("/alerts").set("Cookie", cookie);
    expect(alertsBefore.status).toBe(200);
    expect(alertsBefore.body).toHaveLength(1);

    // 5. On supprime la dépense qui faisait dépasser
    const deleteRes = await request(app)
      .delete(`/transactions/${transactionId}`)
      .set("Cookie", cookie);
    expect(deleteRes.status).toBe(204);

    // 6. Plus de dépassement → l'alerte a disparu
    const alertsAfter = await request(app).get("/alerts").set("Cookie", cookie);
    expect(alertsAfter.status).toBe(200);
    expect(alertsAfter.body).toHaveLength(0);
  });
});
