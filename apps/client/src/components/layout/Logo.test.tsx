import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Logo from "./Logo";
import { AuthContext, type AuthContextType } from "@/context/auth";

function renderLogo(isAuthenticated: boolean) {
  const auth: AuthContextType = {
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated,
    isInitializing: false,
  };
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <Logo variant="desktop" className="w-16" />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return screen.getByRole("link", { name: /retour à l'accueil/ });
}

describe("Logo", () => {
  it("ramène à l'accueil connecté quand l'utilisateur est connecté", () => {
    expect(renderLogo(true)).toHaveAttribute("href", "/accueil");
  });

  it("ramène à l'accueil public sinon", () => {
    expect(renderLogo(false)).toHaveAttribute("href", "/");
  });
});
