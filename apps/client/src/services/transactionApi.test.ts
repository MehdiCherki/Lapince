import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAllTransactions } from "./transactionApi";
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

  it("une seule requête quand l'utilisateur n'a aucune transaction", async () => {
    // L'API renvoie totalPages = Math.ceil(0 / 100) = 0
    vi.mocked(apiFetch).mockResolvedValueOnce(pageResponse([], 1, 0));

    const all = await fetchAllTransactions();

    expect(all).toEqual([]);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
