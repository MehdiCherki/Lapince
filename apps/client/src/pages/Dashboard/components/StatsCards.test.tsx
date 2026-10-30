import { render, screen } from "@testing-library/react";
import { StatsCards } from "./StatsCards";

describe("StatsCards", () => {
  it("affiche les trois cartes avec les bons titres", () => {
    render(
      <StatsCards stats={{ income: 1200, expenses: 500, balance: 700 }} />,
    );

    expect(screen.getByText("Total Revenus")).toBeInTheDocument();
    expect(screen.getByText("Total Dépenses")).toBeInTheDocument();
    expect(screen.getByText("Balance Nette")).toBeInTheDocument();
  });

  it("affiche la balance en rouge quand elle est négative", () => {
    render(
      <StatsCards stats={{ income: 100, expenses: 500, balance: -400 }} />,
    );

    const balanceEl = screen.getByText(/-400/);
    expect(balanceEl).toHaveClass("text-red-600");
  });

  it("affiche la balance en bleu marine quand elle est positive", () => {
    render(
      <StatsCards stats={{ income: 1000, expenses: 200, balance: 800 }} />,
    );

    const balanceEl = screen.getByText(/800/);
    expect(balanceEl).toHaveClass("text-[#002b49]");
  });
});
