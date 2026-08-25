import type { Zone } from "@/lib/generated/prisma/enums";

export type CartMap = Record<string, number>;

export type AuthTab = "login" | "register";
export type ModuleId = "commande" | "preparation" | "securite" | "livraison" | "stock" | "rapports";
export type PrepView = "list" | "pick";
export type LivView = "list" | "detail";
export type SecView = "list" | "check";
export type RepPeriod = "jour" | "semaine" | "mois";

export type RoleId = "client" | "entrepot" | "securite" | "admin";

/** Profil de connexion : détermine l'identité affichée et les modules accessibles. */
export interface Role {
  label: string;
  user: string;
  modules: ModuleId[];
}

export type StockFilter = "all" | "alert" | Zone;
export type StockLevel = "rupture" | "critique" | "ok";

export interface AppSettings {
  scanEnabled: boolean;
  groupByZone: boolean;
  showPricesInPrep: boolean;
}

/**
 * État d'interface uniquement : l'identité vient de la session, commandes, stock
 * et rapports sont des requêtes tRPC. Ce qui reste ici ne survivrait pas à un
 * rechargement de toute façon (panier en cours, filtres, écran ouvert…).
 */
export interface AppState {
  module: ModuleId;
  cat: string;
  cart: CartMap;
  search: string;
  cartOpen: boolean;
  orderSent: boolean;
  lastOrderId: string | null;

  prepView: PrepView;
  activeOrderId: string | null;
  flagOpen: string | null;

  livView: LivView;
  activeStopId: string | null;
  signed: Record<string, boolean>;

  secView: SecView;
  secOrderId: string | null;
  /** Lignes cochées au contrôle sortie, indexées par id de ligne. */
  secChecked: Record<string, boolean>;
  secSearch: string;

  repPeriod: RepPeriod;

  stockSearch: string;
  stockFilter: StockFilter;
}
