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

export default defineConfig({
  testDir: "./e2e",
  // Les specs partagent une seule base : les faire tourner en parallèle les
  // ferait se marcher dessus (une commande préparée par un autre test, etc.).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: `bun run dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { BETTER_AUTH_URL: BASE_URL },
  },
});
