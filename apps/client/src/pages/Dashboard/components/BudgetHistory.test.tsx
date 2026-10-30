import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BudgetHistory from "./BudgetHistory";
import { coursesBudget as courses } from "@/test/fixtures";

describe("BudgetHistory", () => {
  it("signale le budget à modifier", () => {
    const onEdit = vi.fn();
    render(
      <BudgetHistory budgets={[courses]} onEdit={onEdit} onDelete={vi.fn()} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Modifier le budget Courses" }),
    );

    expect(onEdit).toHaveBeenCalledWith(courses);
  });

  it("signale le budget à supprimer", () => {
    const onDelete = vi.fn();
    render(
      <BudgetHistory
        budgets={[courses]}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer le budget Courses" }),
    );

    expect(onDelete).toHaveBeenCalledWith(courses);
  });
});
