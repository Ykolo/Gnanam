import { expect, test, type Page } from "@playwright/test";
import { login, logout, openModule, orderCard, orderSeqFrom } from "./helpers";

/**
 * Le parcours complet, celui qui a de la valeur : une commande créée par le
 * client traverse la préparation, le contrôle sortie et la livraison, puis
 * réapparaît « Livrée » dans son historique.
 *
 * Chaque test suit sa propre commande par son numéro, sans rien présumer des
 * autres commandes déjà présentes en base.
 */

async function passerCommande(page: Page, creneau: string): Promise<number> {
  await login(page, "client");
  await page.getByRole("button", { name: "Ajouter au panier" }).first().click();
  await page.getByRole("button", { name: /^Panier/ }).click();

  await page.getByRole("button", { name: creneau, exact: true }).click();
  await page.getByRole("button", { name: "Commander — livraison J+1" }).click();

  const confirmation = page.getByText(/a été transmise à l'entrepôt/);
  await expect(confirmation).toBeVisible();
  const seq = orderSeqFrom(await confirmation.textContent());

  // Le créneau choisi doit être celui affiché, pas le défaut.
  await expect(page.getByText(`créneau ${creneau}`)).toBeVisible();
  return seq;
}

async function preparerCommande(page: Page, seq: number) {
  await login(page, "entrepot");
  await orderCard(page, seq).getByRole("button", { name: /préparation/ }).click();

  const aValider = page.getByRole("button", { name: "Valider le produit" });
  await expect(aValider.first()).toBeVisible();
  const nbLignes = await aValider.count();
  expect(nbLignes).toBeGreaterThan(0);
  for (let i = 0; i < nbLignes; i++) {
    await aValider.nth(i).click();
  }

  await page.getByRole("button", { name: "Commande prête pour livraison" }).click();
  await expect(page.getByText("Préparation des commandes")).toBeVisible();
}

async function ouvrirControle(page: Page, seq: number) {
  await login(page, "securite");
  await page.getByPlaceholder("N° de commande ou client").fill(`CMD-${seq}`);
  await orderCard(page, seq).getByRole("button", { name: "Contrôler le caddie" }).click();
}

test("une commande parcourt la commande, la préparation, le contrôle et la livraison", async ({
  page,
}) => {
  const creneau = "14h – 17h";
  const seq = await passerCommande(page, creneau);
  await logout(page);

  await preparerCommande(page, seq);
  await logout(page);

  // --- Sécurité : visa de sortie conforme ---
  await ouvrirControle(page, seq);
  const aCocher = page.locator("button").filter({ hasText: /^\d+ × / });
  const nbACocher = await aCocher.count();
  for (let i = 0; i < nbACocher; i++) {
    await aCocher.nth(i).click();
  }
  await page.getByRole("button", { name: "Autoriser la sortie" }).click();
  await expect(orderCard(page, seq)).toContainText("Sortie autorisée");
  await logout(page);

  // --- Entrepôt : livraison ---
  await login(page, "entrepot");
  await openModule(page, "Livraison");
  await orderCard(page, seq).getByRole("button", { name: "Démarrer la livraison" }).click();

  await page.getByRole("button", { name: "Faire signer le client" }).click();
  await expect(page.getByText("✓ Signature client enregistrée")).toBeVisible();
  await page.getByRole("button", { name: "Confirmer la livraison" }).click();
  await expect(page.getByText("Tournée du jour")).toBeVisible();
  await expect(orderCard(page, seq)).toContainText("Livrée");
  await logout(page);

  // --- Client : la commande est bien livrée dans son historique ---
  await login(page, "client");
  await openModule(page, "Mes commandes");
  const carte = orderCard(page, seq);
  await expect(carte).toContainText("Livrée");
  await expect(carte).toContainText(creneau);
});

test("le poste sécurité peut laisser sortir un caddie en signalant un écart", async ({ page }) => {
  const seq = await passerCommande(page, "8h – 11h");
  await logout(page);

  await preparerCommande(page, seq);
  await logout(page);

  await ouvrirControle(page, seq);
  await page.getByRole("button", { name: "Signaler un écart" }).click();

  // Le motif est obligatoire : le bouton reste inerte tant qu'il est vide.
  const enregistrer = page.getByRole("button", { name: /Enregistrer l'écart/ });
  await expect(enregistrer).toBeDisabled();

  await page.getByLabel("Motif de l'écart").fill("1 carton de tilapia manquant au caddie 2");
  await expect(enregistrer).toBeEnabled();
  await enregistrer.click();

  await expect(orderCard(page, seq)).toContainText("Sortie autorisée");
});
