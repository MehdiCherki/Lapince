import { describe, it, expect, afterEach, vi } from "vitest";
import request from "supertest";
import app from "../../../src/app.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";
import { addExpense, createBudget } from "../../helpers/budgets.ts";

// Un budget mensuel porte sur le mois en cours : les dépenses des mois précédents ne comptent pas.
// Seule la date est simulée (timers réels) : la base, les transactions et les jetons fonctionnent normalement.
function setToday(iso: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

async function alerts(cookie: string) {
  const res = await request(app).get("/alerts").set("Cookie", cookie);
  expect(res.status).toBe(200);
  return res.body as { exceededAmount: string }[];
}

describe("Budget mensuel : calcul sur le mois en cours", () => {
  afterEach(() => vi.useRealTimers());

  it("ignore les dépenses du mois précédent", async () => {
    setToday("2026-10-15T12:00:00Z");
    const cookie = await loginUser(await createVerifiedUser("periode_mois"));
    const { categoryId } = await createBudget(cookie, { limit: 100 });

    await addExpense(cookie, categoryId, 80, new Date("2026-09-20T00:00:00Z"));
    await addExpense(cookie, categoryId, 30, new Date("2026-10-10T00:00:00Z"));

    // 30 € en octobre < 100 € : pas d'alerte (avant : 80 + 30 = 110 → dépassement de 10 €)
    expect(await alerts(cookie)).toHaveLength(0);
  });

  it("au changement de mois, l'alerte du mois précédent disparaît", async () => {
    setToday("2026-10-15T12:00:00Z");
    const email = await createVerifiedUser("periode_bascule");
    let cookie = await loginUser(email);
    const { categoryId } = await createBudget(cookie, { limit: 50 });
    await addExpense(cookie, categoryId, 60, new Date("2026-10-10T00:00:00Z"));
    const october = await alerts(cookie);
    expect(october).toHaveLength(1);
    expect(Number(october[0]?.exceededAmount)).toBe(10);

    // 2 novembre : aucune dépense en novembre, rien n'a été écrit depuis octobre
    setToday("2026-11-02T12:00:00Z");
    cookie = await loginUser(email);

    expect(await alerts(cookie)).toHaveLength(0);
  });

  it("la lecture des alertes ne réactive pas une alerte déjà lue", async () => {
    const cookie = await loginUser(await createVerifiedUser("periode_lue"));
    const { categoryId } = await createBudget(cookie, { limit: 50 });
    await addExpense(cookie, categoryId, 60);
    const [alert] = (await request(app).get("/alerts").set("Cookie", cookie))
      .body as { id: number }[];
    await request(app)
      .patch(`/alerts/${alert?.id}/read`)
      .set("Cookie", cookie)
      .expect(200);

    const res = await request(app).get("/alerts").set("Cookie", cookie);

    expect(res.body[0].isRead).toBe(true);
  });

  it("refuse la période « custom », qui n'a pas de dates (400)", async () => {
    const cookie = await loginUser(await createVerifiedUser("periode_custom"));
    const created = await request(app)
      .post("/budgets")
      .set("Cookie", cookie)
      .send({ limit_amount: 100, period: "custom", id_category: 1 });
    const { budgetId } = await createBudget(cookie);
    const updated = await request(app)
      .patch(`/budgets/${budgetId}`)
      .set("Cookie", cookie)
      .send({ period: "custom" });

    expect([created.status, created.body.field]).toEqual([400, "period"]);
    expect([updated.status, updated.body.field]).toEqual([400, "period"]);
  });
});
