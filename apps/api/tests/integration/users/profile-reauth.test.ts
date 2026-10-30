import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import {
  TEST_PASSWORD,
  createVerifiedUser,
  loginUser,
} from "../../helpers/auth.ts";

const NEW_PASSWORD = "Nouveau1@mdp";

// Le formulaire des paramètres renvoie toujours tous les champs, dont l'email inchangé
const updateProfile = (cookie: string, body: Record<string, unknown>) =>
  request(app).patch("/users/me").set("Cookie", cookie).send(body);

// Max 5 inscriptions par fichier (rate limit de l'inscription) : 5 utilisateurs ci-dessous
describe("PATCH /users/me — ré-authentification", () => {
  it("modifie le prénom sans mot de passe actuel quand l'email est inchangé", async () => {
    const email = await createVerifiedUser("profil_nom");
    const cookie = await loginUser(email);

    const res = await updateProfile(cookie, { first_name: "Nouveau", email });

    expect(res.status).toBe(200);
    expect(res.body.user.first_name).toBe("Nouveau");
  });

  it("refuse un nouveau mot de passe sans le mot de passe actuel", async () => {
    const email = await createVerifiedUser("profil_sans");
    const cookie = await loginUser(email);

    const res = await updateProfile(cookie, { email, password: NEW_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("currentPassword");
  });

  // 403 et non 401 : sur un 401, le client rafraîchit la session et rejoue la requête
  it("refuse un nouveau mot de passe avec un mauvais mot de passe actuel", async () => {
    const email = await createVerifiedUser("profil_faux");
    const cookie = await loginUser(email);

    const res = await updateProfile(cookie, {
      email,
      password: NEW_PASSWORD,
      currentPassword: "Mauvais1@mdp",
    });

    expect(res.status).toBe(403);
    expect(res.body.field).toBe("currentPassword");
  });

  it("refuse un changement d'email sans le mot de passe actuel", async () => {
    const email = await createVerifiedUser("profil_email");
    const cookie = await loginUser(email);

    const res = await updateProfile(cookie, {
      email: `autre_${Date.now()}@lapince.fr`,
    });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe("currentPassword");
  });

  it("change le mot de passe avec le bon mot de passe actuel et ferme toutes les sessions", async () => {
    const email = await createVerifiedUser("profil_ok");
    const cookie = await loginUser(email);

    const res = await updateProfile(cookie, {
      email,
      password: NEW_PASSWORD,
      currentPassword: TEST_PASSWORD,
    });
    expect(res.status).toBe(200);

    // Les sessions ouvertes avant le changement ne peuvent plus être prolongées
    const refresh = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookie);
    expect(refresh.status).toBe(401);

    // Ancien mot de passe refusé, nouveau accepté
    const oldLogin = await request(app)
      .post("/auth/login")
      .send({ email, password: TEST_PASSWORD });
    expect(oldLogin.status).toBe(401);
    await loginUser(email, NEW_PASSWORD);
  });
});
