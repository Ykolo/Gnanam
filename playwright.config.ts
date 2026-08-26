import { defineConfig, devices } from "@playwright/test";

/**
 * Les tests end-to-end tournent contre l'application réelle et sa base.
 *
 * Le port est volontairement différent de celui du développement : sans ça,
 * `reuseExistingServer` réutiliserait n'importe quel serveur déjà sur 3000, y
 * compris celui d'un autre projet. `BETTER_AUTH_URL` suit, sinon la protection
 * CSRF de Better Auth rejetterait les connexions.
 */
const PORT = 3210;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  // Les specs partagent une seule base : les faire tourner en parallèle les
  // ferait se marcher dessus (une commande préparée par un autre test, etc.).
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Le rapport HTML est ce que la CI archive en cas d'échec : sans lui, l'étape
  // d'upload réussit en n'envoyant rien.
  reporter: isCI ? [["github"], ["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // En CI, l'application est compilée au préalable et servie en mode
    // production : `next dev` recompile à chaque route visitée, ce qui suffit à
    // faire dépasser le délai des tests sur un runner partagé.
    command: isCI ? `bun run start --port ${PORT}` : `bun run dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      BETTER_AUTH_URL: BASE_URL,
      // La suite enchaîne les connexions de quatre profils : la limite de trois
      // tentatives de Better Auth la bloquerait dès le quatrième login.
      // Cantonné à ce serveur de test — voir lib/auth.ts.
      AUTH_RATE_LIMIT_DISABLED: "1",
    },
  },
});
