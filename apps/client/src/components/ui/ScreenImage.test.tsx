import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ScreenImage from "./ScreenImage";

function renderImage(screen: "mobile" | "desktop" | "large") {
  const { container } = render(
    <ScreenImage
      screen={screen}
      src="/WEBP/Mobile/image.webp"
      className="w-full"
      alt=""
    />,
  );
  return {
    source: container.querySelector("picture > source")!,
    img: container.querySelector("picture > img")!,
  };
}

describe("ScreenImage", () => {
  it("ne propose l'image qu'à sa plage d'écran, jamais dans src (téléchargé quoi qu'il arrive)", () => {
    const { source, img } = renderImage("mobile");

    expect(source).toHaveAttribute("srcset", "/WEBP/Mobile/image.webp");
    expect(source).toHaveAttribute("media", "not all and (min-width: 48rem)");
    expect(img.getAttribute("src")).toMatch(/^data:image\/gif;base64,/);
    expect(img).toHaveAttribute("class", "w-full");
    expect(img).toHaveAttribute("alt", "");
  });

  it("aligne les plages sur les points de rupture md et lg de Tailwind", () => {
    expect(renderImage("desktop").source).toHaveAttribute(
      "media",
      "(min-width: 48rem)",
    );
    expect(renderImage("large").source).toHaveAttribute(
      "media",
      "(min-width: 64rem)",
    );
  });
});
