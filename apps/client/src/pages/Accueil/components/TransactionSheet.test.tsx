import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TransactionSheet from "./TransactionSheet";

function renderSheet() {
  render(
    <TransactionSheet
      transactions={[]}
      footerHeight={60}
      onDeleteRequest={vi.fn()}
      onUpdateRequest={vi.fn()}
    />,
  );
  const toggle = screen.getByRole("button", {
    name: /Toutes mes transactions/,
  });
  const content = document.getElementById(
    toggle.getAttribute("aria-controls")!,
  )!;
  return { toggle, content };
}

// La feuille fermée est glissée hors de l'écran : son contenu doit être hors d'atteinte du clavier.
// Son en-tête s'ouvre au clavier (Entrée ou Espace), pas seulement à la souris ou au doigt.
describe("TransactionSheet : clavier", () => {
  it("fermée : en-tête atteignable, état annoncé, contenu hors d'atteinte", () => {
    const { toggle, content } = renderSheet();

    expect(toggle).toHaveAttribute("tabindex", "0");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(content).toHaveAttribute("inert");
  });

  it("s'ouvre et se ferme avec Entrée et Espace", () => {
    const { toggle, content } = renderSheet();

    fireEvent.keyDown(toggle, { key: "Enter" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(content).not.toHaveAttribute("inert");

    fireEvent.keyDown(toggle, { key: " " });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
