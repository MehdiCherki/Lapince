import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAlerts } from "./alertApi";
import { apiFetch } from "./apiClient";

vi.mock("./apiClient", () => ({ apiFetch: vi.fn() }));

describe("fetchAlerts", () => {
  beforeEach(() => vi.resetAllMocks());

  it("convertit en nombre le dépassement envoyé en texte par l'API", async () => {
    // exceededAmount est un Decimal en base : Prisma l'envoie en texte
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1, exceededAmount: "50" }]), {
        status: 200,
      }),
    );

    const alerts = await fetchAlerts();

    expect(alerts[0]?.exceededAmount).toBe(50);
  });
});
