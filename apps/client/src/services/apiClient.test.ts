import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "./apiClient";
import { refreshSession } from "./authApi";

vi.mock("./authApi", () => ({ refreshSession: vi.fn() }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const ok = () => new Response("{}", { status: 200 });
const unauthorized = () => new Response(null, { status: 401 });

describe("apiFetch", () => {
  // resetAllMocks (et pas clearAllMocks) : vide aussi les mockResolvedValueOnce d'un test à l'autre
  beforeEach(() => vi.resetAllMocks());

  it("renvoie directement une réponse qui n'est pas un 401", async () => {
    fetchMock.mockResolvedValueOnce(ok());

    const res = await apiFetch("/api/budgets");

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith("/api/budgets", {
      credentials: "include",
    });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("sur un 401 : rafraîchit la session puis rejoue la requête une fois", async () => {
    fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(ok());
    vi.mocked(refreshSession).mockResolvedValue();

    const res = await apiFetch("/api/budgets");

    expect(res.status).toBe(200);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deux 401 simultanés ne déclenchent qu'un seul refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValue(ok());
    vi.mocked(refreshSession).mockResolvedValue();

    await Promise.all([apiFetch("/api/budgets"), apiFetch("/api/alerts")]);

    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it("si le refresh échoue : renvoie le 401 et prévient l'application", async () => {
    fetchMock.mockResolvedValueOnce(unauthorized());
    vi.mocked(refreshSession).mockRejectedValue(
      new Error("Refresh token invalide ou expiré"),
    );
    const onExpired = vi.fn();
    window.addEventListener("session-expired", onExpired);

    const res = await apiFetch("/api/budgets");

    expect(res.status).toBe(401);
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1); // pas de 2e essai sans session
    window.removeEventListener("session-expired", onExpired);
  });
});
