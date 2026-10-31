import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBudgetStats, getOverview } from "./stats.service.ts";
import { prisma } from "../lib/prisma.ts";

vi.mock("../lib/prisma.ts", () => ({
  prisma: {
    transaction: { findMany: vi.fn() },
    budget: { findMany: vi.fn() },
  },
}));

describe("getOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcule income, expenses et balance correctement", async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { amount: 1000, category: { type: "INCOME" } },
      { amount: 300, category: { type: "EXPENSE" } },
      { amount: 200, category: { type: "EXPENSE" } },
    ] as any);

    const result = await getOverview(1);

    expect(result.income).toBe(1000);
    expect(result.expenses).toBe(500);
    expect(result.balance).toBe(500);
  });

  it("retourne des zéros si aucune transaction", async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);

    const result = await getOverview(1);

    expect(result).toEqual({ income: 0, expenses: 0, balance: 0 });
  });
});

describe("getBudgetStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("budget mensuel : dépenses du mois en cours seulement, au centime près", async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      {
        id: 1,
        id_category: 3,
        limit_amount: "0.30",
        period: "monthly",
        category: { name: "Courses" },
      },
    ] as any);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { categoryId: 3, amount: "0.10", date: new Date("2026-10-02") },
      { categoryId: 3, amount: "0.20", date: new Date("2026-10-14") },
      { categoryId: 3, amount: "50.00", date: new Date("2026-09-30") }, // mois précédent
    ] as any);

    const [stats] = await getBudgetStats(7);

    expect(stats).toMatchObject({
      limit: 0.3,
      spent: 0.3,
      remaining: 0,
      percent: 100,
    });
  });
});
