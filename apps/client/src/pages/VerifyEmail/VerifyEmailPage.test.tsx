import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VerifyEmailPage from "./VerifyEmailPage";

vi.mock("@/components/layout/Logo", () => ({ default: () => null }));
vi.mock("@/components/layout/Footer", () => ({ default: () => null }));

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <VerifyEmailPage />
    </MemoryRouter>,
  );
}

describe("VerifyEmailPage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lien sans jeton : erreur affichée, aucun appel à l'API", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderAt("/verify-email");

    expect(screen.getByText(/lien est invalide/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("lien avec jeton : un seul appel à l'API, succès affiché", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    renderAt("/verify-email?token=abc123");

    expect(await screen.findByText(/bien été confirmée/)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("token=abc123");
  });

  it("jeton refusé par l'API : erreur affichée", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 400 }),
    );

    renderAt("/verify-email?token=perime");

    expect(await screen.findByText(/lien est invalide/)).toBeInTheDocument();
  });
});
