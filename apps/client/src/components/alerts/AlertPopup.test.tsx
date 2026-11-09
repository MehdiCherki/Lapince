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
  render(<AlertPopup alert={alert} onClose={onClose} />);
  return onClose;
}

// La fenêtre ne bloque pas la page : c'est une alerte (zone annoncée aussitôt par les lecteurs
// d'écran), pas une boîte de dialogue modale. Elle se ferme au clavier comme à la souris.
describe("AlertPopup : accessibilité", () => {
  it("est annoncée comme une alerte, avec un nom et son contenu", () => {
    renderPopup();

    const popup = screen.getByRole("alert", { name: "Alerte" });
    expect(popup).toHaveTextContent("15,00 €");
    expect(popup).toHaveTextContent("Alimentation");
  });

  it("se ferme avec la touche Échap", () => {
    const onClose = renderPopup();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("propose un vrai bouton Fermer, atteignable au clavier", () => {
    const onClose = renderPopup();

    const button = screen.getByRole("button", { name: "Fermer l'alerte" });
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
