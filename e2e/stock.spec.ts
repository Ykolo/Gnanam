import { expect, test, type Page } from "@playwright/test";
import { login, openModule } from "./helpers";

/**
 * Les assertions sont relatives : on lit la valeur avant l'action et on vérifie
 * l'écart. Une base déjà entamée par un autre parcours ne les fait donc pas
 * échouer.
 */

const carteStock = (page: Page, sku: string) => page.getByTestId(`stock-${sku}`);

async function physique(page: Page, sku: string): Promise<number> {
  return Number(await carteStock(page, sku).getByTestId("stat-physique").innerText());
}

async function ouvrirStock(page: Page, recherche?: string) {
  await login(page, "entrepot");
  await openModule(page, "Stock dépôt");
  if (recherche) await page.getByPlaceholder("Rechercher une référence…").fill(recherche);
}

test.describe("Stock du dépôt", () => {
  test("affiche les indicateurs et le journal des mouvements", async ({ page }) => {
    await ouvrirStock(page);

    await expect(page.getByText("Stock du dépôt")).toBeVisible();
    // Les intitulés sont mis en majuscules par le CSS : le DOM garde la casse
    // normale. « Sous le seuil » sert aussi de badge sur les cartes, d'où `first`.
    await expect(page.getByText("Références", { exact: true })).toBeVisible();
    await expect(page.getByText("Valeur stock", { exact: true })).toBeVisible();
    await expect(page.getByText("Sous le seuil", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Ruptures", { exact: true })).toBeVisible();
    await expect(page.getByText("Mouvements en direct")).toBeVisible();
  });

  test("physique, réservé et disponible sont cohérents entre eux", async ({ page }) => {
    await ouvrirStock(page, "Ginger beer");
    const carte = carteStock(page, "p18");
    await expect(carte).toBeVisible();

    const [q, reserve, dispo] = await Promise.all([
      carte.getByTestId("stat-physique").innerText(),
      carte.getByTestId("stat-reserve").innerText(),
      carte.getByTestId("stat-disponible").innerText(),
    ]);

    expect(Number(dispo)).toBe(Number(q) - Number(reserve));
  });

  test("une réception augmente le stock physique et alimente le journal", async ({ page }) => {
    await ouvrirStock(page, "Ginger beer");
    const carte = carteStock(page, "p18");
    await expect(carte).toBeVisible();
    const avant = await physique(page, "p18");

    await carte.getByRole("button", { name: /Réception/ }).click();
    await page.getByLabel("Colis reçus pour Ginger beer").fill("7");
    await page.getByRole("button", { name: "Valider la réception" }).click();

    await expect.poll(() => physique(page, "p18"), { timeout: 15_000 }).toBe(avant + 7);
    await expect(page.getByText(/Réception fournisseur/).first()).toBeVisible();
  });

  test("un ajustement d'un colis se répercute puis s'annule", async ({ page }) => {
    await ouvrirStock(page, "Curry de Madras");
    await expect(carteStock(page, "p12")).toBeVisible();
    const avant = await physique(page, "p12");

    await page.getByRole("button", { name: "Ajouter un colis à Curry de Madras" }).click();
    await expect.poll(() => physique(page, "p12"), { timeout: 15_000 }).toBe(avant + 1);

    await page.getByRole("button", { name: "Retirer un colis de Curry de Madras" }).click();
    await expect.poll(() => physique(page, "p12"), { timeout: 15_000 }).toBe(avant);
  });

  test("le filtre Alertes ne garde que les références à réapprovisionner", async ({ page }) => {
    await ouvrirStock(page);
    await page.getByRole("button", { name: /^Alertes/ }).click();

    // Compté dans les cartes seulement : « Sous le seuil » est aussi un
    // indicateur en haut de page.
    const cartes = page.locator("[data-testid^='stock-']");
    const badges = cartes.getByText(/^(Rupture|Sous le seuil)$/);

    await expect(badges.first()).toBeVisible();
    expect(await badges.count()).toBe(await cartes.count());
  });
});
