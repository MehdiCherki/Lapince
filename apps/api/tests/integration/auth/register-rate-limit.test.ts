import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { transporter } from "../../../src/lib/mailer.ts";
import { uniqueEmail } from "../../helpers/auth.ts";

describe("POST /auth/register - rate limit", () => {
  it("bloque après 5 tentatives dans la fenêtre", async () => {
    let lastStatus = 0;

    for (let i = 0; i < 6; i++) {
      const email = uniqueEmail(`ratelimit_${i}`);

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
