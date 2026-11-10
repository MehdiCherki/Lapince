import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node ./prisma/seed.ts",
  },
  // Commandes de Prisma (migrations, seed, Studio) : rôle propriétaire du schéma, lapince_owner.
  // L'API en fonctionnement se connecte avec DATABASE_URL (rôle lapince_app) : src/lib/prisma.ts
  datasource: {
    url: process.env.MIGRATION_DATABASE_URL!,
    // Développement seulement : prisma migrate dev rejoue les migrations dans une base « shadow ».
    // lapince_owner ne peut pas créer de base (pas de CREATEDB) : on lui en fournit une, dont il
    // est propriétaire (lapince_shadow). Inutile pour migrate deploy (production, CI).
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
