import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RegisterForm from "./RegisterForm";

function fill(container: HTMLElement, values: Record<string, string>) {
  for (const [name, value] of Object.entries(values)) {
    fireEvent.change(container.querySelector(`[name="${name}"]`)!, {
      target: { value },
    });
  }
}

const valid = {
  first_name: "Test",
  last_name: "User",
  email: "test@lapince.fr",
  password: "Motdepasse1@",
};

describe("RegisterForm", () => {
  it("affiche une erreur qui ne concerne aucun champ (ex. trop de tentatives)", () => {
    render(
      <RegisterForm
        onSubmit={vi.fn()}
        isLoading={false}
        error={{
          error: "Trop de tentatives d'inscription, réessayez plus tard.",
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Trop de tentatives");
  });

  it("refuse une confirmation différente du mot de passe, sans rien envoyer", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <RegisterForm onSubmit={onSubmit} isLoading={false} error={null} />,
    );

    fill(container, { ...valid, confirm: "Autre1@mdp" });
    fireEvent.submit(container.querySelector("form")!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Les mots de passe ne correspondent pas",
    );
  });

  it("envoie le formulaire quand la confirmation est identique", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <RegisterForm onSubmit={onSubmit} isLoading={false} error={null} />,
    );

    fill(container, { ...valid, confirm: valid.password });
    fireEvent.submit(container.querySelector("form")!);

    expect(onSubmit).toHaveBeenCalledWith(valid);
  });
});
