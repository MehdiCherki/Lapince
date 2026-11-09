// Test de charge : crée l'utilisateur vérifié du scénario dans la base jetable lapince_load_test.
// Lancé dans le conteneur api-load (compose.load.yml) : refuse toute autre base.
import argon2 from "argon2";

process.env.DATABASE_URL ??= process.env.DATABASE_URL_TEST?.replace(
  "/lapince_test",
  "/lapince_load_test",
);
if (!process.env.DATABASE_URL?.includes("lapince_load_test")) {
  throw new Error("Test de charge : la base doit être lapince_load_test");
}

// Import après le choix de la base : le client Prisma lit DATABASE_URL à son chargement
const { prisma } = await import("../../src/lib/prisma.ts");

const email = "charge@lapince.test";
await prisma.user.upsert({
  where: { email },
  update: {},
  create: {
    first_name: "Charge",
    last_name: "Test",
    email,
    password: await argon2.hash("Charge-1-test"),
    emailVerified: true,
  },
});
console.log("Utilisateur du test de charge prêt");
await prisma.$disconnect();
