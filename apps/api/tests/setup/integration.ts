import { afterAll, vi } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { trackedEmails } from "../helpers/auth.ts";

// Garde-fou : les tests créent et suppriment des utilisateurs, jamais dans la base de dev.
// Les imports ci-dessus ne font aucune requête : ce contrôle passe avant le premier accès à la base.
// Témoin : lancer avec DATABASE_URL_TEST vide doit échouer avec ce message.
if (!process.env.DATABASE_URL?.includes("_test")) {
  throw new Error(
    "Tests d'intégration : DATABASE_URL doit pointer sur une base *_test",
  );
}

// Aucun email réel pendant les tests : le transporter Brevo est remplacé dans tous les fichiers.
// Témoin : tests/integration/auth/register.test.ts vérifie l'appel à sendMail.
vi.mock("../../src/lib/mailer.ts", () => ({
  transporter: { sendMail: vi.fn().mockResolvedValue({}) },
}));

// Supprime les utilisateurs créés par le fichier de test (leurs données suivent en cascade)
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: trackedEmails } } });
  await prisma.$disconnect();
});
