import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    env: {
      // Suffit à construire les clients Prisma/Better Auth au chargement des
      // modules serveur : les tests injectent leur propre `ctx.prisma` mocké
      // et n'ouvrent donc jamais de vraie connexion.
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
  },
});
