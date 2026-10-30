import { describe, it, expect, afterAll, vi } from "vitest";
import request from "supertest";
import app from "./app.ts";
import { prisma } from "./lib/prisma.ts";
import { transporter } from "./lib/mailer.ts";

vi.mock("./lib/mailer.ts", () => ({
  transporter: { sendMail: vi.fn().mockResolvedValue({}) },
}));

const emails: string[] = [];

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
});

describe("POST /auth/register - rate limit", () => {
  it("bloque après 5 tentatives dans la fenêtre", async () => {
    let lastStatus = 0;

    for (let i = 0; i < 6; i++) {
      const email = `ratelimit_${Date.now()}_${i}@lapince.fr`;
      emails.push(email);

      const res = await request(app).post("/auth/register").send({
        first_name: "Test",
        last_name: "User",
        email,
        password: "Motdepasse1@",
      });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
    expect(transporter.sendMail).toHaveBeenCalledTimes(5);
  });
});
