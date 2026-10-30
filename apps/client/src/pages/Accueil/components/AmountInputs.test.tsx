import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DepenseCard from "./DepenseCard";
import RevenuCard from "./RevenuCard";
import BudgetCard from "./BudgetCard";

vi.mock("@/hooks/useCategories", () => ({ useCategories: () => [] }));

// Sans step, un champ number n'accepte que des entiers (pas de 1) : le navigateur bloque
// l'envoi du formulaire dès qu'on saisit des centimes. Les montants sont au centime près : step 0.01.
// (jsdom n'applique pas step lors de la validation : on vérifie donc l'attribut, que le navigateur applique.)
describe("Champs montant de l'accueil", () => {
  it.each([
    ["Dépense", DepenseCard],
    ["Revenu", RevenuCard],
    ["Budget", BudgetCard],
  ])("%s : saisie au centime près", (_, Card) => {
    render(<Card />);

    expect(screen.getByPlaceholderText("Montant")).toHaveAttribute(
      "step",
      "0.01",
    );
  });
});
