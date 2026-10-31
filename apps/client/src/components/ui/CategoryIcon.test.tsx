import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import CategoryIcon from "./CategoryIcon";

describe("CategoryIcon", () => {
  it("affiche l'icône d'une catégorie connue", () => {
    const { container } = render(<CategoryIcon name="PiggyBank" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("n'affiche rien pour une icône absente ou inconnue", () => {
    expect(
      render(<CategoryIcon name={null} />).container,
    ).toBeEmptyDOMElement();
    expect(
      render(<CategoryIcon name="IcôneInconnue" />).container,
    ).toBeEmptyDOMElement();
  });
});
