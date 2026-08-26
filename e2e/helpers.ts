import { expect, type Page } from "@playwright/test";

export type RoleId = "client" | "entrepot" | "securite" | "admin";

/** Comptes créés par `bun run db:seed`. */
export const DEMO_PASSWORD = "gnanam2026";
export const demoEmail = (role: RoleId) => `${role}@gnanam.test`;

/**
 * Les tests ne présument rien de l'état de la base au-delà de l'existence des
 * comptes de démonstration et du catalogue : chacun crée la commande dont il a
 * besoin puis la suit par sa référence. Un seed déjà entamé ne les fait donc
 * pas échouer.
 */
export async function login(page: Page, role: RoleId) {
  await page.goto("/");
  await page.getByLabel("Adresse e-mail professionnelle").fill(demoEmail(role));
  await page.getByLabel("Mot de passe").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // La barre latérale n'apparaît qu'une fois la session établie côté serveur.
  await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
}

/**
 * Bouton de navigation d'un module.
 *
 * Le nom accessible inclut la pastille de comptage — « Livraison 1 » — et
 * celle-ci n'apparaît qu'une fois les données chargées. Un match exact réussit
 * donc ou échoue selon l'instant où on l'évalue : on ancre sur le début du
 * libellé pour que le résultat ne dépende pas de ce hasard.
 */
export function moduleButton(page: Page, label: string) {
  return page.getByRole("button", { name: new RegExp(`^${label}(\\s|$)`) });
}

export async function openModule(page: Page, label: string) {
  await moduleButton(page, label).click();
}

/** Extrait le numéro de « CMD-1044 » dans un texte de confirmation. */
export function orderSeqFrom(text: string | null): number {
  const match = text?.match(/CMD-(\d+)/);
  if (!match) throw new Error(`Référence de commande introuvable dans : ${text}`);
  return Number(match[1]);
}

/**
 * Carte d'une commande, dans n'importe quelle liste qui l'affiche.
 *
 * Passe par `data-testid` plutôt que par le texte : filtrer des `div` sur leur
 * contenu retourne le nœud le plus profond, celui du libellé, qui ne contient
 * pas les boutons d'action de la carte.
 */
export function orderCard(page: Page, seq: number) {
  return page.getByTestId(`commande-${seq}`);
}
