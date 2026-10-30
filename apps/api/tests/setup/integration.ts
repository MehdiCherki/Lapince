import { afterAll, vi } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { trackedEmails } from "../helpers/auth.ts";

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
