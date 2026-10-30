import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchAllTransactions,
  fetchTransactions,
  createTransaction,
} from "./transactionApi";
import { apiFetch } from "./apiClient";

vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));

// Une page de l'API (total omis : fetchAllTransactions ne se sert que de totalPages)
const pageResponse = (ids: number[], page: number, totalPages: number) =>
  new Response(
    JSON.stringify({ data: ids.map((id) => ({ id })), page, totalPages }),
    { status: 200 },
  );

describe("fetchAllTransactions", () => {
  beforeEach(() => vi.resetAllMocks());

  it("charge toutes les pages, par tranches de 100", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(pageResponse([1, 2], 1, 3))
      .mockResolvedValueOnce(pageResponse([3, 4], 2, 3))
      .mockResolvedValueOnce(pageResponse([5], 3, 3));

    const all = await fetchAllTransactions();

    expect(all.map((t) => t.id)).toEqual([1, 2, 3, 4, 5]);
    expect(apiFetch).toHaveBeenCalledTimes(3);
    expect(apiFetch).toHaveBeenLastCalledWith(
      expect.stringContaining("page=3&limit=100"),
      expect.anything(),
    );
  });

  it("convertit en nombre le montant envoyé en texte par l'API", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [{ id: 1, amount: "150" }],
          page: 1,
          totalPages: 1,
        }),
        { status: 200 },
      ),
    );

    const all = await fetchAllTransactions();

    expect(all[0]?.amount).toBe(150);
  });

  it("une seule requête quand l'utilisateur n'a aucune transaction", async () => {
    // L'API renvoie totalPages = Math.ceil(0 / 100) = 0
    vi.mocked(apiFetch).mockResolvedValueOnce(pageResponse([], 1, 0));

    const all = await fetchAllTransactions();

    expect(all).toEqual([]);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});

// Prisma envoie les Decimal en texte ("150") : chaque réponse est convertie à l'entrée
describe("montants reçus de l'API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("fetchTransactions renvoie des montants numériques", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [{ id: 1, amount: "12.5" }],
          page: 1,
          totalPages: 1,
        }),
        { status: 200 },
      ),
    );

    const page = await fetchTransactions();

    expect(page.data[0]?.amount).toBe(12.5);
  });

  it("createTransaction renvoie un montant numérique", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 2, amount: "40" }), { status: 201 }),
    );

    const created = await createTransaction({
      amount: 40,
      date: "2026-10-30T10:00:00.000Z",
      description: "",
      idcategory: 16,
    });

    expect(created.amount).toBe(40);
  });
});
