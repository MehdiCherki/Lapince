import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchBudgets, createBudget, updateBudget } from "./budgetApi";
import { apiFetch } from "./apiClient";

vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

// limit_amount est un DECIMAL(12, 2) en base : Prisma l'envoie en texte ("500.00")
describe("budgets reçus de l'API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("fetchBudgets convertit la limite en nombre", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      json([{ id: 1, limit_amount: "500.00" }]),
    );

    const budgets = await fetchBudgets();

    expect(budgets[0]?.limit_amount).toBe(500);
  });

  it("createBudget et updateBudget renvoient une limite numérique", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(json({ id: 2, limit_amount: "123.45" }, 201))
      .mockResolvedValueOnce(json({ id: 2, limit_amount: "200.10" }));

    const created = await createBudget({
      limit_amount: 123.45,
      period: "monthly",
      id_category: 16,
    });
    const updated = await updateBudget(2, { limit_amount: 200.1 });

    expect(created.limit_amount).toBe(123.45);
    expect(updated.limit_amount).toBe(200.1);
  });
});
