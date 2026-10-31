import { describe, it, expect } from "vitest";
import { periodBounds } from "./period.ts";

const iso = (d: Date | undefined) => d?.toISOString();

describe("periodBounds", () => {
  it("mensuel : du 1er du mois au 1er du mois suivant", () => {
    const bounds = periodBounds("monthly", new Date("2026-10-15T12:00:00Z"));

    expect(iso(bounds?.start)).toBe("2026-10-01T00:00:00.000Z");
    expect(iso(bounds?.end)).toBe("2026-11-01T00:00:00.000Z");
  });

  it("mensuel : décembre se termine le 1er janvier de l'année suivante", () => {
    const bounds = periodBounds("monthly", new Date("2026-12-20T12:00:00Z"));

    expect(iso(bounds?.end)).toBe("2027-01-01T00:00:00.000Z");
  });

  it("le mois courant est celui de Paris : 31/10 23 h 30 UTC = 1er novembre 0 h 30 à Paris", () => {
    const bounds = periodBounds("monthly", new Date("2026-10-31T23:30:00Z"));

    expect(iso(bounds?.start)).toBe("2026-11-01T00:00:00.000Z");
  });

  it("hebdomadaire : du lundi au lundi suivant", () => {
    // Mercredi 28/10/2026
    const bounds = periodBounds("weekly", new Date("2026-10-28T12:00:00Z"));

    expect(iso(bounds?.start)).toBe("2026-10-26T00:00:00.000Z");
    expect(iso(bounds?.end)).toBe("2026-11-02T00:00:00.000Z");
  });

  it("hebdomadaire : le dimanche appartient à la semaine commencée le lundi précédent", () => {
    const bounds = periodBounds("weekly", new Date("2026-11-01T10:00:00Z"));

    expect(iso(bounds?.start)).toBe("2026-10-26T00:00:00.000Z");
  });

  it("hebdomadaire : le lundi commence une nouvelle semaine", () => {
    const bounds = periodBounds("weekly", new Date("2026-11-02T08:00:00Z"));

    expect(iso(bounds?.start)).toBe("2026-11-02T00:00:00.000Z");
  });

  it("« custom » : aucune borne (pas de dates enregistrées pour cette période)", () => {
    expect(periodBounds("custom", new Date())).toBeNull();
  });
});
