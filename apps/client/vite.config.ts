import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // « @/ » = src/ : imports indépendants de la profondeur du fichier (même alias dans tsconfig.app.json)
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
  },
  server: {
    host: true, // Écoute sur 0.0.0.0 — indispensable pour être accessible depuis l'hôte via Docker
    watch: {
      usePolling: true, // Nécessaire sur Windows : Docker ne propage pas les événements inotify natifs
    },
    proxy: {
      "/api": {
        target: "http://api:3007", // 'api' est le nom du service dans docker-compose, pas besoin de localhost ou d'IP
        changeOrigin: true, // Modifie l'en-tête Host de la requête pour correspondre à la cible, ce qui est souvent nécessaire pour les API qui vérifient l'origine des requêtes
        rewrite: (path) => path.replace(/^\/api/, ""), // Supprime le préfixe /api avant de faire suivre la requête au back-end, car le serveur Express n'a pas de route /api, il a juste /auth, /users, etc.
      },
    },
  },
});
