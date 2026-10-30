import { expect } from "vitest";
import request from "supertest";
import app from "../../src/app.ts";
import { prisma } from "../../src/lib/prisma.ts";

export const TEST_PASSWORD = "Motdepasse1@";

// Emails créés pendant un fichier de test : supprimés à la fin du fichier (tests/setup/integration.ts)
export const trackedEmails: string[] = [];

export function uniqueEmail(label: string): string {
  const email = `${label}_${Date.now()}@lapince.fr`;
  trackedEmails.push(email);
  return email;
}

// En-tête Cookie à renvoyer, construit à partir des Set-Cookie d'une réponse
export function extractCookieHeader(res: {
  headers: Record<string, unknown>;
}): string {
  const raw = (res.headers["set-cookie"] as string[] | undefined) ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

// Inscription puis vérification directe en base (l'email de vérification est simulé)
export async function createVerifiedUser(label: string): Promise<string> {
  const email = uniqueEmail(label);

  const res = await request(app).post("/auth/register").send({
    first_name: "Test",
    last_name: "User",
    email,
    password: TEST_PASSWORD,
  });
  expect(res.status).toBe(201);

  await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });
  return email;
}

// Connexion → en-tête Cookie de la session
export async function loginUser(
  email: string,
  password = TEST_PASSWORD,
): Promise<string> {
  const res = await request(app).post("/auth/login").send({
    email,
    password,
  });
  if (res.status !== 204) {
    console.log("Error body: ", res.body || res.text);
  }
  expect(res.status).toBe(204);
  return extractCookieHeader(res);
}
