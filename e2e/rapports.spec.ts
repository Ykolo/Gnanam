import { expect, test, type Page } from "@playwright/test";
import { login, logout, openModule } from "./helpers";

/**
 * Les rapports agrègent des données qui bougent à chaque exécution : on vérifie
 * la structure, la cohérence interne et le changement de période, pas des
 * montants figés.
 *
 * Les intitulés sont mis en majuscules par le CSS : le texte du DOM, lui, reste
 * en casse normale.
 */
const KPIS = [
  "Commandes",
  "CA HT",
  "Produits préparés",
  "Conformité",
  "Ruptures",
  "Délai moyen prépa",
];

/** Valeur numérique d'un indicateur, lue dans sa carte. */
async function valeurKpi(page: Page, label: string): Promise<number> {
  const texte = await page.getByTestId(`kpi-${label}`).innerText();
  // La carte empile intitulé, valeur puis tendance.
  return Number(texte.split("\n")[1].replace(/[^\d]/g, ""));
}

test.describe("Rapports", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin");
    await openModule(page, "Rapports");
    await expect(page.getByText(/^Journalier — /)).toBeVisible();
  });

  test("présente les six indicateurs de la période", async ({ page }) => {
    for (const label of KPIS) {
      await expect(page.getByTestId(`kpi-${label}`)).toBeVisible();
    }
  });

  test("le rapport journalier porte la date du jour", async ({ page }) => {
    const aujourdhui = new Date().toLocaleDateString("fr-FR", {
      timeZone: "Europe/Paris",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    await expect(page.getByText(new RegExp(`Journalier — .*${aujourdhui}`))).toBeVisible();
  });

  test("changer de période change la plage et le découpage du graphique", async ({ page }) => {
    await expect(page.getByText("Par tranche horaire")).toBeVisible();

    await page.getByRole("button", { name: "Hebdo", exact: true }).click();
    await expect(page.getByText(/^Hebdomadaire — semaine du/)).toBeVisible();
    await expect(page.getByText("Par jour", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Mensuel", exact: true }).click();
    await expect(page.getByText(/^Mensuel — /)).toBeVisible();
    await expect(page.getByText("Par semaine")).toBeVisible();

    await page.getByRole("button", { name: "Journalier", exact: true }).click();
    await expect(page.getByText(/^Journalier — /)).toBeVisible();
  });

  test("le mensuel agrège au moins autant de commandes que le journalier", async ({ page }) => {
    const jour = await valeurKpi(page, "Commandes");

    await page.getByRole("button", { name: "Mensuel", exact: true }).click();
    await expect(page.getByText(/^Mensuel — /)).toBeVisible();
    const mois = await valeurKpi(page, "Commandes");

    expect(mois).toBeGreaterThanOrEqual(jour);
  });

  test("les sections d'analyse sont présentes", async ({ page }) => {
    await expect(page.getByText("Chiffre d'affaires HT")).toBeVisible();
    await expect(page.getByText("Top produits")).toBeVisible();
    await expect(page.getByText("Écarts de préparation")).toBeVisible();
    await expect(page.getByText("Contrôles sortie")).toBeVisible();
  });

  test("le module reste hors de portée de l'entrepôt", async ({ page }) => {
    await logout(page);
    await login(page, "entrepot");

    await expect(page.getByRole("button", { name: /^Rapports/ })).toBeHidden();
  });
});
