import { describe, it, expect } from "vitest";
import { newestFirst } from "./sort";
import type { Transaction } from "@/types/transaction";

const tx = (id: number, date: string) => ({ id, date }) as Transaction;

describe("newestFirst", () => {
  it("trie par date, la plus récente d'abord", () => {
    const sorted = [tx(1, "2026-10-01"), tx(2, "2026-10-30")].sort(newestFirst);

    expect(sorted.map((t) => t.id)).toEqual([2, 1]);
  });

  it("départage un même jour par id décroissant, quel que soit l'ordre reçu", () => {
    const day = "2026-10-30T00:00:00.000Z";

    const sorted = [tx(35, day), tx(36, day), tx(34, day)].sort(newestFirst);

    expect(sorted.map((t) => t.id)).toEqual([36, 35, 34]);
  });
});
