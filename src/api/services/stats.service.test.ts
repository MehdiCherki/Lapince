import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOverview } from "./stats.service.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    transaction: { findMany: vi.fn() },
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
