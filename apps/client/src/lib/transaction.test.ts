import { describe, it, expect } from "vitest";
import { transactionLabel } from "./transaction";

const category = {
  id: 16,
  name: "Alimentation",
  type: "EXPENSE" as const,
  icon: null,
};

describe("transactionLabel", () => {
  it("affiche l'intitulé quand il existe", () => {
    expect(transactionLabel({ description: "Courses", category })).toBe(
      "Courses",
    );
  });

  it("affiche la catégorie quand l'intitulé est absent, vide ou fait d'espaces", () => {
    expect(transactionLabel({ description: null, category })).toBe(
      "Alimentation",
    );
    expect(transactionLabel({ description: "", category })).toBe(
      "Alimentation",
    );
    expect(transactionLabel({ description: "   ", category })).toBe(
      "Alimentation",
    );
  });
});
