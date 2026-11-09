import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import fc from "fast-check";
import app from "../../../src/app.ts";
import { prisma } from "../../../src/lib/prisma.ts";
import { createVerifiedUser, loginUser } from "../../helpers/auth.ts";

// Fuzzing de POST /transactions : des centaines de corps de requête générés au hasard, envoyés à
// l'API réelle (session valide, vraie base). Quelle que soit l'entrée : 201 ou 400, jamais 500,
// et rien n'est écrit sur un refus. Graine fixe : un échec se rejoue à l'identique.
const options = { seed: 20261110, numRuns: 200 };

let cookie: string;
let userId: number;
let categoryId: number;

beforeAll(async () => {
  const email = await createVerifiedUser("fuzz_transactions");
  cookie = await loginUser(email);
  ({ id: userId } = await prisma.user.findUniqueOrThrow({ where: { email } }));
  ({ id: categoryId } = await prisma.category.findFirstOrThrow({
    where: { type: "EXPENSE" },
  }));
});

// Valeurs piégées pour chaque champ : types inattendus, bornes, textes hostiles
const weird = fc.oneof(
  fc.anything(),
  fc.constantFrom(
    null,
    "",
    " ",
    "NaN",
    "Infinity",
    "1e400",
    "0x10",
    "' OR 1=1 --",
    "<script>alert(1)</script>",
    "{}",
    -0,
    1e308,
    -1e308,
    Number.MAX_SAFE_INTEGER,
    9_999_999_999.995,
    [],
    {},
    { $gt: 0 },
    { not: 0 },
  ),
  fc.string({ unit: "binary", maxLength: 300 }),
  fc.double(),
  fc.integer(),
);

// Un champ valide trois fois sur quatre, piégé une fois sur quatre : les requêtes atteignent
// ainsi le service et la base (catégorie inexistante, montant limite…), pas seulement Zod
const mostly = <T>(valid: fc.Arbitrary<T>) =>
  fc.oneof({ arbitrary: valid, weight: 3 }, { arbitrary: weird, weight: 1 });

// Corps de requête : une dépense dont des champs sont piégés, ou un objet quelconque
const payload = fc.oneof(
  {
    arbitrary: fc.record(
      {
        amount: mostly(
          fc.integer({ min: 1, max: 999_999_999_999 }).map((c) => c / 100),
        ),
        date: mostly(fc.constant(new Date().toISOString())),
        // catégories existantes et inexistantes (39 en base)
        idcategory: mostly(fc.integer({ min: 1, max: 80 })),
        description: fc.option(weird, { nil: undefined }),
        budgetId: fc.option(weird, { nil: undefined }),
        userId: fc.option(weird, { nil: undefined }), // vient de la session, jamais du corps
      },
      { requiredKeys: ["amount", "date", "idcategory"] },
    ),
    weight: 4,
  },
  { arbitrary: fc.dictionary(fc.string(), weird), weight: 1 },
);

describe("POST /transactions : fuzzing", () => {
  it("répond 201 ou 400, jamais 500, et n'écrit rien sur un refus", async () => {
    await fc.assert(
      fc.asyncProperty(payload, async (body) => {
        const before = await prisma.transaction.count({ where: { userId } });
        const res = await request(app)
          .post("/transactions")
          .set("Cookie", cookie)
          .send(body as object);
        const after = await prisma.transaction.count({ where: { userId } });

        expect([201, 400]).toContain(res.status);
        expect(after - before).toBe(res.status === 201 ? 1 : 0);
        if (res.status === 201) {
          // une dépense acceptée appartient toujours à l'utilisateur de la session
          const saved = await prisma.transaction.findUniqueOrThrow({
            where: { id: res.body.id },
          });
          expect(saved.userId).toBe(userId);
        }
      }),
      options,
    );
  });

  it("ignore les clés __proto__ et constructor d'un corps JSON brut", async () => {
    const res = await request(app)
      .post("/transactions")
      .set("Cookie", cookie)
      .set("Content-Type", "application/json")
      .send(
        `{"__proto__":{"isAdmin":true},"constructor":{"prototype":{"x":1}},` +
          `"amount":12.5,"date":"${new Date().toISOString()}","idcategory":${categoryId}}`,
      );

    expect(res.status).toBe(201);
    expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
});
