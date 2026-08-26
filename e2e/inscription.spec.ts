import { expect, test } from "@playwright/test";

/**
 * L'inscription se fait en deux temps : Better Auth crée le compte et pose la
 * session, puis `account.completeRegistration` rattache l'établissement B2B.
 * Chaque exécution utilise une adresse et un SIRET uniques.
 */
const suffixe = () => Date.now().toString().slice(-9);

test.describe("Inscription B2B", () => {
  test("crée un compte, le rattache à un établissement et ouvre la session", async ({ page }) => {
    const id = suffixe();
    const email = `epicerie.${id}@exemple.test`;
    const nom = `Épicerie Test ${id}`;

    await page.goto("/");
    await page.getByRole("button", { name: "Créer un compte" }).click();

    await page.getByLabel("Nom de l'établissement").fill(nom);
    await page.getByLabel("SIRET").fill(id.padStart(14, "1"));
    await page.getByLabel("Adresse de livraison").fill("12 rue de la Démo, 75010 Paris");
    await page.getByLabel("Adresse e-mail professionnelle").fill(email);
    await page.getByLabel("Mot de passe").fill("motdepasse-solide-2026");
    await page.getByRole("button", { name: "Créer mon compte pro" }).click();

    // Le nouveau compte arrive avec le rôle client : catalogue et historique.
    await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Commander/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Mes commandes/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Préparation/ })).toBeHidden();
    await expect(page.getByText(nom)).toBeVisible();

    // Le nom affiché vient du compte, pas de l'établissement : il serait visible
    // même sans rattachement. L'historique, lui, exige un `customerId`.
    await page.getByRole("button", { name: /^Mes commandes/ }).click();
    await expect(page.getByText("Aucune commande pour le moment.")).toBeVisible();
  });

  test("le nouvel établissement peut commander immédiatement", async ({ page }) => {
    const id = suffixe();

    await page.goto("/");
    await page.getByRole("button", { name: "Créer un compte" }).click();
    await page.getByLabel("Nom de l'établissement").fill(`Traiteur Test ${id}`);
    await page.getByLabel("SIRET").fill(id.padStart(14, "2"));
    await page.getByLabel("Adresse de livraison").fill("5 rue des Tests, 75011 Paris");
    await page.getByLabel("Adresse e-mail professionnelle").fill(`traiteur.${id}@exemple.test`);
    await page.getByLabel("Mot de passe").fill("motdepasse-solide-2026");
    await page.getByRole("button", { name: "Créer mon compte pro" }).click();
    await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible();

    await page.getByRole("button", { name: "Ajouter au panier" }).first().click();
    await page.getByRole("button", { name: /^Panier/ }).click();
    await page.getByRole("button", { name: "Commander — livraison J+1" }).click();

    await expect(page.getByText(/a été transmise à l'entrepôt/)).toBeVisible();
  });

  test("refuse un mot de passe trop court sans appeler le serveur", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Créer un compte" }).click();

    await page.getByLabel("Nom de l'établissement").fill("Trop court");
    await page.getByLabel("SIRET").fill("12345678900011");
    await page.getByLabel("Adresse de livraison").fill("1 rue Courte, 75001 Paris");
    await page.getByLabel("Adresse e-mail professionnelle").fill("court@exemple.test");
    await page.getByLabel("Mot de passe").fill("court");
    await page.getByRole("button", { name: "Créer mon compte pro" }).click();

    await expect(page.getByText("Le mot de passe doit faire au moins 8 caractères.")).toBeVisible();
  });

  test("exige tous les champs", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Créer un compte" }).click();
    await page.getByRole("button", { name: "Créer mon compte pro" }).click();

    await expect(page.getByText("Veuillez remplir tous les champs.")).toBeVisible();
  });
});
