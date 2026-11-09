import { Prisma } from "@prisma/client";

// Erreurs des contraintes de la base, reconnues pour être traduites en réponses HTTP
// plutôt qu'en erreur 500. Le code PostgreSQL d'origine est transmis par l'adaptateur (driver
// adapter) : dans meta.driverAdapterError.cause pour une erreur Prisma, dans cause sinon.

type AdapterCause = { originalCode?: string };

const postgresCode = (err: unknown): string | undefined => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const adapterError = err.meta?.driverAdapterError as
      { cause?: AdapterCause } | undefined;
    return adapterError?.cause?.originalCode;
  }
  if (err instanceof Error && err.name === "DriverAdapterError") {
    return (err.cause as AdapterCause | undefined)?.originalCode;
  }
  return undefined;
};

// Violation d'une contrainte d'unicité : par exemple deux requêtes simultanées qui ont toutes
// deux passé la vérification préalable « cet email est-il déjà utilisé ? »
export const isUniqueViolation = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

// Violation d'une contrainte CHECK (code PostgreSQL 23514)
export const isCheckViolation = (err: unknown): boolean =>
  postgresCode(err) === "23514";
