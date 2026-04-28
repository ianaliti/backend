import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Utiliser l'environnement Node.js au lieu du navigateur
    environment: "node",

    // Reporters pour afficher les résultats des tests
    reporters: ["verbose"],

    // Chemins d'alias pour faciliter les imports
    alias: {
      "@": path.resolve(__dirname, "./"),
    },

    // Couverture de code
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "dist/",
        "generated/",
      ],
    },

    // Configuration de la base de données pour les tests
    // Les tests reçoivent une DATABASE_URL pointant vers une BD de test
    setupFiles: ["./__tests__/setup.ts"],

    globals: true,

    // Isolation entre les tests
    isolate: true,

    // Timeout par défaut pour les tests asynchrones
    testTimeout: 30000,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
