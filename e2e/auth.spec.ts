import { expect, test } from "@playwright/test";
import { login, logout, moduleButton } from "./helpers";

test.describe("Authentification et cloisonnement des rôles", () => {
  test("refuse un mot de passe incorrect", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Adresse e-mail professionnelle").fill("client@gnanam.test");
    await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeHidden();
  });

  test("le client ne voit que la commande et son historique", async ({ page }) => {
    await login(page, "client");

    await expect(moduleButton(page, "Commander")).toBeVisible();
    await expect(moduleButton(page, "Mes commandes")).toBeVisible();
    // Les postes internes doivent rester hors de portée.
    await expect(moduleButton(page, "Préparation")).toBeHidden();
    await expect(moduleButton(page, "Stock dépôt")).toBeHidden();
    await expect(moduleButton(page, "Références")).toBeHidden();
    await expect(moduleButton(page, "Rapports")).toBeHidden();
  });

  test("l'entrepôt voit la préparation, le stock et la livraison", async ({ page }) => {
    await login(page, "entrepot");

    await expect(moduleButton(page, "Préparation")).toBeVisible();
    await expect(moduleButton(page, "Stock dépôt")).toBeVisible();
    await expect(moduleButton(page, "Livraison")).toBeVisible();
    await expect(moduleButton(page, "Commander")).toBeHidden();
    await expect(moduleButton(page, "Rapports")).toBeHidden();
  });

  test("la sécurité n'a que le contrôle sortie", async ({ page }) => {
    await login(page, "securite");

    await expect(moduleButton(page, "Contrôle sortie")).toBeVisible();
    await expect(moduleButton(page, "Préparation")).toBeHidden();
    await expect(moduleButton(page, "Livraison")).toBeHidden();
  });

  test("l'admin traverse tous les postes", async ({ page }) => {
    await login(page, "admin");

    for (const label of [
      "Commander",
      "Mes commandes",
      "Préparation",
      "Contrôle sortie",
      "Livraison",
      "Stock dépôt",
      "Références",
      "Rapports",
    ]) {
      await expect(moduleButton(page, label)).toBeVisible();
    }
  });

  test("la déconnexion ramène à l'écran de connexion", async ({ page }) => {
    await login(page, "client");
    await logout(page);
    await expect(page.getByText("Comptes de démonstration")).toBeVisible();
  });
});
