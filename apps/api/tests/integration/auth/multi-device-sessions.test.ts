import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";

describe("Sessions multi-appareils", () => {
  it("deux appareils restent connectés en même temps", async () => {
    const email = await createVerifiedUser("multi");
    const cookieTelephone = await loginUser(email);
    // 1 s d'écart : deux logins dans la même seconde donneraient le même token (étape 0),
    // et le test passerait alors même avec l'ancien code
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const cookieLaptop = await loginUser(email); // ne doit PAS fermer la session du téléphone

    const refreshTel = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookieTelephone);
    const refreshLaptop = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookieLaptop);

    expect(refreshTel.status).toBe(204);
    expect(refreshLaptop.status).toBe(204);
  });

  it("deux logins simultanés ne plantent pas (double-clic)", async () => {
    const email = await createVerifiedUser("doubleclic");
    const [cookieA, cookieB] = await Promise.all([
      loginUser(email),
      loginUser(email),
    ]);
    expect(cookieA).not.toBe(cookieB); // chaque session a son propre refresh token
  });

  it("pose des cookies de session cohérents", async () => {
    const email = await createVerifiedUser("cookies");
    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: "Motdepasse1@" });
    expect(res.status).toBe(204);

    // Une ligne par cookie : le « . » des regex ne déborde pas d'un cookie sur l'autre
    const cookies = (res.headers["set-cookie"] as unknown as string[]).join(
      "\n",
    );

    // Le navigateur appelle toujours /api/auth/refresh (proxy Vite en dev, Nginx en prod)
    expect(cookies).toMatch(/refreshToken=[^;]+;.*Path=\/api\/auth\/refresh/);
    // L'indicateur de session vit aussi longtemps que le refresh token : 7 jours = 604800 s
    expect(cookies).toMatch(/sessionExists=1;.*Max-Age=604800/);
  });
});
