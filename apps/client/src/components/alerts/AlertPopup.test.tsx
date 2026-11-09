import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AlertPopup from "./AlertPopup";
import type { Alert } from "@/types/alert";

const alert: Alert = {
  id: 1,
  category: { id: 3, name: "Alimentation" },
  exceededAmount: 15,
  isRead: false,
  userId: 7,
  createdAt: "2026-11-09T10:00:00.000Z",
};

function renderPopup() {
  const onClose = vi.fn();
  const view = render(<AlertPopup alert={alert} onClose={onClose} />);
  return { onClose, ...view };
}

// La fenêtre ne bloque pas la page : boîte de dialogue non modale. À son apparition, le focus
// va sur « Fermer » (un utilisateur au clavier la ferme aussitôt), puis revient d'où il venait.
describe("AlertPopup : accessibilité", () => {
  it("est une boîte de dialogue nommée, décrite par son contenu", () => {
    renderPopup();

    const popup = screen.getByRole("dialog", { name: "Alerte" });
    expect(popup).not.toHaveAttribute("aria-modal");
    expect(popup).toHaveAccessibleDescription(/15,00 €.*Alimentation/);
  });

  it("donne le focus au bouton Fermer dès son apparition", () => {
    renderPopup();

    expect(
      screen.getByRole("button", { name: "Fermer l'alerte" }),
    ).toHaveFocus();
  });

  it("se ferme avec la touche Échap", () => {
    const { onClose } = renderPopup();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("se ferme avec le bouton Fermer, sans double appel", () => {
    const { onClose } = renderPopup();

    fireEvent.click(screen.getByRole("button", { name: "Fermer l'alerte" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rend le focus à l'élément d'origine quand elle disparaît", () => {
    const origin = document.createElement("button");
    origin.textContent = "Ajouter";
    document.body.appendChild(origin);
    origin.focus();

    const { unmount } = renderPopup();
    unmount();

    expect(origin).toHaveFocus();
    origin.remove();
  });
});
