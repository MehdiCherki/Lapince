import { defineConfig } from "vitest/config";

// Deux projets lançables séparément :
//   npm run test:unit          → tests unitaires, à côté du code (aucune base)
//   npm run test:integration   → tests d'intégration (supertest + base de données)
export default defineConfig({
  test: {
    projects: [
      { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"] } },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/setup/integration.ts"],
        },
      },
    ],
  },
});
