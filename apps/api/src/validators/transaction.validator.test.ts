import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createTransactionSchema } from "./transaction.validator.ts";

// Fuzzing du schéma de création d'une dépense : des milliers d'entrées générées au hasard,
// rejouables (graine fixe, affichée en cas d'échec avec l'exemple minimal qui casse la règle).
const options = { seed: 20261110, numRuns: 2000 };

const MAX_CENTS = 999_999_999_999; // 9 999 999 999,99 €

// Une dépense valide : montant au centime, date ISO, catégorie positive, intitulé facultatif
const validTransaction = fc.record(
  {
    amount: fc.integer({ min: 1, max: MAX_CENTS }).map((cents) => cents / 100),
    date: fc
      .date({
        min: new Date("2000-01-01T00:00:00.000Z"),
        max: new Date("2100-01-01T00:00:00.000Z"),
        noInvalidDate: true,
      })
      .map((d) => d.toISOString()),
    idcategory: fc.integer({ min: 1, max: 2_147_483_647 }),
    description: fc.option(fc.string({ maxLength: 255 }), { nil: undefined }),
  },
  { requiredKeys: ["amount", "date", "idcategory"] },
);

describe("createTransactionSchema : fuzzing", () => {
  it("ne lève jamais d'exception, quelle que soit l'entrée", () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const result = createTransactionSchema.safeParse(input);
        expect(typeof result.success).toBe("boolean");
      }),
      options,
    );
  });

  it("accepte toute dépense valide, montant exact au centime", () => {
    fc.assert(
      fc.property(validTransaction, (input) => {
        const result = createTransactionSchema.safeParse(input);
        expect(result.success).toBe(true);
        expect(result.data?.amount).toBe(input.amount);
      }),
      options,
    );
  });

  it("refuse un montant à plus de deux décimales", () => {
    fc.assert(
      fc.property(
        validTransaction,
        fc.integer({ min: 1, max: 9 }),
        (input, millimes) => {
          // ajoute 0,001 à 0,009 € : le montant n'est plus un nombre entier de centimes
          const amount = Math.min(input.amount, 1_000_000) + millimes / 1000;
          expect(
            createTransactionSchema.safeParse({ ...input, amount }).success,
          ).toBe(false);
        },
      ),
      options,
    );
  });

  it("refuse un montant nul, négatif, non fini ou au-delà du maximum", () => {
    const invalidAmount = fc.oneof(
      fc.constantFrom(0, -0, Infinity, -Infinity, Number.NaN, 1e10, 1e308),
      fc.double({ max: 0, noNaN: true }),
      fc.double({ min: 1e10, noNaN: true }),
    );
    fc.assert(
      fc.property(validTransaction, invalidAmount, (input, amount) => {
        expect(
          createTransactionSchema.safeParse({ ...input, amount }).success,
        ).toBe(false);
      }),
      options,
    );
  });

  it("refuse une catégorie qui n'est pas un entier positif", () => {
    const invalidCategory = fc.oneof(
      fc.integer({ max: 0 }),
      fc.double({ noInteger: true }),
      fc.string(),
      fc.constantFrom(null, true, [], {}),
    );
    fc.assert(
      fc.property(validTransaction, invalidCategory, (input, idcategory) => {
        expect(
          createTransactionSchema.safeParse({ ...input, idcategory }).success,
        ).toBe(false);
      }),
      options,
    );
  });
});
