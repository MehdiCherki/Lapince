import { describe, it, expect } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";

// C7 : comptes PostgreSQL séparés (db/roles.sql). L'API, et donc ces tests, se connectent avec
// lapince_app, qui lit et écrit les données mais ne peut ni créer, ni modifier, ni supprimer une
// table, ni lire l'historique des migrations (réservé au propriétaire du schéma, lapince_owner).

type AdapterError = {
  meta?: { driverAdapterError?: { cause?: { originalCode?: string } } };
};

// Résultat d'une requête : "acceptée", ou le code d'erreur PostgreSQL. Elle s'exécute dans une
// transaction toujours annulée : même acceptée par un rôle trop puissant (test rouge), elle ne
// modifierait rien dans la base de test.
const outcome = async (sql: string): Promise<string> => {
  const rollback = new Error("annulation");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(sql);
      throw rollback;
    });
  } catch (err) {
    if (err === rollback) return "acceptée";
    return (
      (err as AdapterError).meta?.driverAdapterError?.cause?.originalCode ??
      "autre erreur"
    );
  }
  return "acceptée";
};

describe("Compte PostgreSQL de l'API : moindre privilège", () => {
  it("se connecte avec lapince_app, sans aucun attribut d'administration", async () => {
    const [role] = await prisma.$queryRaw<
      {
        name: string;
        superuser: boolean;
        createdb: boolean;
        createrole: boolean;
        bypassrls: boolean;
      }[]
    >`SELECT rolname AS name, rolsuper AS superuser, rolcreatedb AS createdb,
        rolcreaterole AS createrole, rolbypassrls AS bypassrls
      FROM pg_roles WHERE rolname = current_user`;

    expect(role).toEqual({
      name: "lapince_app",
      superuser: false,
      createdb: false,
      createrole: false,
      bypassrls: false,
    });
  });

  // 42501 : insufficient_privilege
  it.each([
    "CREATE TABLE intrus (id int)",
    "ALTER TABLE users ADD COLUMN intrus int",
    "DROP TABLE users",
    "TRUNCATE users",
  ])("%s : refusé (42501)", async (sql) => {
    expect(await outcome(sql)).toBe("42501");
  });

  it("ne lit pas l'historique des migrations (42501)", async () => {
    expect(await outcome('SELECT count(*) FROM "_prisma_migrations"')).toBe(
      "42501",
    );
  });

  it("lit et écrit les données (requête courante de l'API)", async () => {
    expect(await outcome("UPDATE users SET updated_at = updated_at")).toBe(
      "acceptée",
    );
  });
});
