import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BudgetEditModal from "./BudgetEditModal";
import { coursesBudget as courses } from "@/test/fixtures";

function setLimit(value: string) {
  fireEvent.change(screen.getByLabelText("Limite (€)"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
}

describe("BudgetEditModal", () => {
  it("refuse une limite nulle sans appeler l'API", () => {
    const onSave = vi.fn();
    render(
      <BudgetEditModal budget={courses} onSave={onSave} onCancel={vi.fn()} />,
    );

    setLimit("0");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "La limite doit être un montant positif.",
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("envoie la nouvelle limite", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <BudgetEditModal budget={courses} onSave={onSave} onCancel={vi.fn()} />,
    );

    setLimit("450");

    expect(onSave).toHaveBeenCalledWith(450);
  });

  it("affiche le message de l'API si la modification échoue", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Budget introuvable"));
    render(
      <BudgetEditModal budget={courses} onSave={onSave} onCancel={vi.fn()} />,
    );

    setLimit("450");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Budget introuvable",
    );
  });
});
