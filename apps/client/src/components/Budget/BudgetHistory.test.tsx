import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BudgetHistory from "./BudgetHistory";
import type { Budget } from "../../types/budget";

const courses: Budget = {
  id: 1,
  limit_amount: 300,
  period: "monthly",
  id_category: 3,
  userId: 7,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  category: { id: 3, name: "Courses", type: "EXPENSE" },
};

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
