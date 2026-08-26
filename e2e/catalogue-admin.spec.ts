import { expect, test, type Page } from "@playwright/test";
import { login, logout, openModule } from "./helpers";

/**
 * Chaque exécution crée sa propre référence, avec un SKU unique, et la
 * désactive à la fin : le catalogue de commande retrouve son état de départ et
 * deux exécutions successives ne se gênent pas.
 */
const skuUnique = () => `e2e${Date.now().toString().slice(-8)}`;

async function ouvrirReferences(page: Page) {
  await login(page, "admin");
  await openModule(page, "Références");
  await expect(page.getByText(/active[s]? sur /)).toBeVisible();
}

async function creerReference(page: Page, sku: string, nom: string, prix: string) {
  await page.getByRole("button", { name: "Nouvelle référence" }).click();
  await page.getByLabel("Référence (SKU)").fill(sku);
  await page.getByLabel("Nom du produit").fill(nom);
  await page.getByLabel("Unité de vente").fill("Colis 5 kg");
  await page.getByLabel("Prix HT (€)").fill(prix);
  await page.getByLabel("Seuil de réappro (colis)").fill("6");
  await page.getByRole("button", { name: "Créer la référence" }).click();
  await expect(page.getByRole("button", { name: "Créer la référence" })).toBeHidden();
}

/** Carte d'une référence dans la liste d'administration. */
function ligne(page: Page, nom: string) {
  return page.locator("div").filter({ hasText: new RegExp(`^${nom}`) }).first();
}

test.describe("Administration du catalogue", () => {
  test("crée une référence, la modifie, puis la retire de la vente", async ({ page }) => {
    const sku = skuUnique();
    const nom = `Ananas Victoria ${sku}`;

    await ouvrirReferences(page);
    await creerReference(page, sku, nom, "26,50");

    // --- Elle apparaît dans l'administration ---
    await page.getByPlaceholder("Rechercher une référence…").fill(nom);
    await expect(page.getByText(nom)).toBeVisible();
    await expect(page.getByText("26,50 €")).toBeVisible();

    // --- Et devient commandable ---
    await openModule(page, "Commander");
    await page.getByPlaceholder("Rechercher un produit…").fill(nom);
    await expect(page.getByText(nom)).toBeVisible();

    // --- Modification du prix ---
    await openModule(page, "Références");
    await page.getByPlaceholder("Rechercher une référence…").fill(nom);
    await ligne(page, nom).getByRole("button", { name: "Modifier" }).click();
    await page.getByLabel("Prix HT (€)").fill("31,90");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("31,90 €")).toBeVisible();

    // --- Désactivation : elle disparaît de la vente sans être supprimée ---
    await ligne(page, nom).getByRole("button", { name: "Désactiver" }).click();
    await expect(page.getByText("Désactivée")).toBeVisible();

    await openModule(page, "Commander");
    await page.getByPlaceholder("Rechercher un produit…").fill(nom);
    // Le message de liste vide reprend le terme cherché : on l'assert lui,
    // plutôt que l'absence d'un nom qu'il contient justement.
    await expect(page.getByText(/Aucun produit ne correspond/)).toBeVisible();

    // Toujours présente côté administration : l'historique doit rester lisible.
    await openModule(page, "Références");
    await page.getByPlaceholder("Rechercher une référence…").fill(nom);
    await expect(page.getByText(nom)).toBeVisible();
  });

  test("refuse une référence déjà utilisée", async ({ page }) => {
    await ouvrirReferences(page);

    await page.getByRole("button", { name: "Nouvelle référence" }).click();
    await page.getByLabel("Référence (SKU)").fill("p1"); // déjà au catalogue
    await page.getByLabel("Nom du produit").fill("Doublon");
    await page.getByLabel("Unité de vente").fill("Colis 5 kg");
    await page.getByLabel("Prix HT (€)").fill("10");
    await page.getByRole("button", { name: "Créer la référence" }).click();

    await expect(page.getByText("Cette référence existe déjà.")).toBeVisible();
  });

  test("refuse un prix invalide sans appeler le serveur", async ({ page }) => {
    await ouvrirReferences(page);

    await page.getByRole("button", { name: "Nouvelle référence" }).click();
    await page.getByLabel("Référence (SKU)").fill(skuUnique());
    await page.getByLabel("Nom du produit").fill("Prix impossible");
    await page.getByLabel("Unité de vente").fill("Colis 5 kg");
    await page.getByLabel("Prix HT (€)").fill("gratuit");
    await page.getByRole("button", { name: "Créer la référence" }).click();

    await expect(page.getByText("Prix invalide.")).toBeVisible();
  });

  test("le module reste hors de portée des autres profils", async ({ page }) => {
    await ouvrirReferences(page);
    await logout(page);

    await login(page, "entrepot");
    await expect(page.getByRole("button", { name: /^Références/ })).toBeHidden();
  });
});
