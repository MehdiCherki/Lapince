import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CategorySelect from "./CategorySelect";
import type { Category } from "@/types/category";

const categories = [
  { id: 1, name: "Alimentation", icon: "ShoppingCart", type: "EXPENSE" },
  { id: 2, name: "Logement", icon: "House", type: "EXPENSE" },
] as unknown as Category[];

function renderSelect() {
  const onChange = vi.fn();
  render(
    <CategorySelect categories={categories} value="" onChange={onChange} />,
  );
  const toggle = screen.getByRole("button", { name: /Catégorie/ });
  const list = document.getElementById(toggle.getAttribute("aria-controls")!)!;
  return { onChange, toggle, list };
}

// Liste fermée : invisible, donc hors d'atteinte du clavier (sinon Tab parcourt ses 39 catégories
// sans rien montrer). Ouverte : atteignable, et Échap la referme en rendant le focus au sélecteur.
describe("CategorySelect : clavier", () => {
  it("fermé : liste hors d'atteinte du clavier, état annoncé", () => {
    const { toggle, list } = renderSelect();

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(list).toHaveAttribute("inert");
  });

  it("ouvert : liste atteignable, état annoncé", () => {
    const { toggle, list } = renderSelect();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(list).not.toHaveAttribute("inert");
  });

  it("Échap referme la liste et rend le focus au sélecteur", () => {
    const { toggle, list } = renderSelect();
    fireEvent.click(toggle);
    const option = screen.getByRole("button", { name: /Logement/ });
    option.focus();

    fireEvent.keyDown(option, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(list).toHaveAttribute("inert");
    expect(toggle).toHaveFocus();
  });
});
