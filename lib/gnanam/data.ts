import type { Role, RoleId, ModuleId } from "./types";
import { Category, Zone, OrderStatus, StockMoveKind } from "@/lib/generated/prisma/enums";

export const ROLES: Record<RoleId, Role> = {
  client: { label: "Client B2B", user: "Épicerie Mont Kailash", modules: ["commande", "historique"] },
  entrepot: { label: "Entrepôt", user: "Préparateur — Rungis", modules: ["preparation", "stock", "livraison"] },
  securite: { label: "Sécurité", user: "Agent sécurité — sortie A", modules: ["securite"] },
  admin: {
    label: "Admin",
    user: "Direction GNANAM EXO",
    modules: ["commande", "historique", "preparation", "securite", "livraison", "stock", "references", "rapports"],
  },
};

export const ROLE_IDS = Object.keys(ROLES) as RoleId[];

export const MODULE_LABELS: Record<ModuleId, string> = {
  commande: "Commander",
  historique: "Mes commandes",
  preparation: "Préparation",
  securite: "Contrôle sortie",
  livraison: "Livraison",
  stock: "Stock dépôt",
  references: "Références",
  rapports: "Rapports",
};

/** Libellés compacts pour la barre de navigation mobile. */
export const MODULE_SHORT_LABELS: Record<ModuleId, string> = {
  commande: "Commander",
  historique: "Commandes",
  preparation: "Prépa",
  securite: "Sortie",
  livraison: "Livraison",
  stock: "Stock",
  references: "Réfs",
  rapports: "Rapports",
};

/** Références mises en avant dans le catalogue, par SKU. */
export const PROMO_SKUS = ["p1", "p9", "p15"];

/**
 * Créneaux de livraison proposés au client. La liste est fermée : le serveur
 * refuse toute autre valeur, pour que les bons de préparation restent lisibles
 * par l'entrepôt.
 */
export const DELIVERY_WINDOWS = ["6h – 8h", "6h – 9h", "8h – 11h", "9h – 12h", "14h – 17h"] as const;

export type DeliveryWindow = (typeof DELIVERY_WINDOWS)[number];

export const DEFAULT_DELIVERY_WINDOW: DeliveryWindow = "8h – 11h";

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.FruitsLegumes]: "Fruits & Légumes",
  [Category.Epicerie]: "Épicerie",
  [Category.Surgeles]: "Surgelés",
  [Category.Boissons]: "Boissons",
};

export const CATEGORY_FILTERS: { id: "Tous" | Category; label: string }[] = [
  { id: "Tous", label: "Tous" },
  { id: Category.FruitsLegumes, label: CATEGORY_LABELS[Category.FruitsLegumes] },
  { id: Category.Epicerie, label: CATEGORY_LABELS[Category.Epicerie] },
  { id: Category.Surgeles, label: CATEGORY_LABELS[Category.Surgeles] },
  { id: Category.Boissons, label: CATEGORY_LABELS[Category.Boissons] },
];

export const CAT_COLORS: Record<Category, [string, string]> = {
  [Category.FruitsLegumes]: ["#EAF4EC", "#2E7D4F"],
  [Category.Epicerie]: ["#F6EEDA", "#8A6412"],
  [Category.Surgeles]: ["#E5EFF5", "#2C6E8A"],
  [Category.Boissons]: ["#F3E9E4", "#A05A2C"],
};

export const ZONE_COLORS: Record<Zone, [string, string]> = {
  [Zone.Sec]: ["#F6EEDA", "#8A6412"],
  [Zone.Frais]: ["#EAF4EC", "#2E7D4F"],
  [Zone.Surgele]: ["#E5EFF5", "#2C6E8A"],
};

export const ZONE_LABELS: Record<Zone, string> = {
  [Zone.Sec]: "Zone sec & boissons",
  [Zone.Frais]: "Zone fraîche",
  [Zone.Surgele]: "Chambre froide −18°C",
};

/** Libellé court, orthographié, pour les pastilles compactes (contrairement à l'enum brute). */
export const ZONE_SHORT_LABELS: Record<Zone, string> = {
  [Zone.Sec]: "Sec",
  [Zone.Frais]: "Frais",
  [Zone.Surgele]: "Surgelé",
};

export const STOCK_MOVE_LABELS: Record<StockMoveKind, string> = {
  [StockMoveKind.sortie]: "Sortie préparation",
  [StockMoveKind.reception]: "Réception fournisseur",
  [StockMoveKind.ajustement]: "Ajustement inventaire",
  [StockMoveKind.annulation]: "Retour en stock",
};

export const PREP_STATUS: Record<OrderStatus, [string, string, string]> = {
  [OrderStatus.todo]: ["À préparer", "#F6EEDA", "#8A6412"],
  [OrderStatus.picking]: ["En cours", "#E5EFF5", "#2C6E8A"],
  [OrderStatus.ready]: ["Prête", "#EAF4EC", "#2E7D4F"],
  [OrderStatus.delivered]: ["Livrée", "#EEE9DC", "#5B6E72"],
};

export const LIV_STATUS: Record<OrderStatus, [string, string, string]> = {
  [OrderStatus.ready]: ["À livrer", "#F6EEDA", "#8A6412"],
  [OrderStatus.delivered]: ["Livrée", "#EAF4EC", "#2E7D4F"],
  [OrderStatus.todo]: ["En préparation", "#EEE9DC", "#5B6E72"],
  [OrderStatus.picking]: ["En préparation", "#EEE9DC", "#5B6E72"],
};
