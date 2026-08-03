export type Category = "Fruits & Légumes" | "Épicerie" | "Surgelés" | "Boissons";
export type Zone = "Frais" | "Sec" | "Surgelé";

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  cat: Category;
  zone: Zone;
}

export type CartMap = Record<string, number>;

export type LineStatus = "pending" | "done" | "partial" | "missing";

export interface OrderLine {
  pid: string;
  qty: number;
  status: LineStatus;
  picked: number;
}

export type OrderStatus = "todo" | "picking" | "ready" | "delivered";

export interface Order {
  id: string;
  client: string;
  address: string;
  window: string;
  status: OrderStatus;
  lines: OrderLine[];
}

export type AuthTab = "login" | "register";
export type ModuleId = "commande" | "preparation" | "livraison" | "stock";
export type PrepView = "list" | "pick";
export type LivView = "list" | "detail";

/** Mouvement de stock du dépôt, horodaté au fil de l'eau. */
export type StockMoveKind = "sortie" | "reception" | "ajustement" | "annulation";

export interface StockMove {
  id: string;
  pid: string;
  /** Signé : négatif = sortie de stock, positif = entrée. */
  delta: number;
  kind: StockMoveKind;
  label: string;
  /** Heure locale « HH:MM » figée au moment du mouvement. */
  time: string;
}

export type StockFilter = "all" | "alert" | Zone;
export type StockLevel = "rupture" | "critique" | "ok";

export interface AppSettings {
  scanEnabled: boolean;
  groupByZone: boolean;
  showPricesInPrep: boolean;
}

export interface AppState {
  authed: boolean;
  authTab: AuthTab;
  authEmail: string;
  authPass: string;
  regName: string;
  regSiret: string;
  regEmail: string;
  regPass: string;
  authError: string | null;
  userName: string;

  module: ModuleId;
  cat: string;
  cart: CartMap;
  search: string;
  cartOpen: boolean;
  orderSent: boolean;
  lastOrderId: string | null;
  nextNum: number;

  prepView: PrepView;
  activeOrderId: string | null;
  flagOpen: string | null;

  livView: LivView;
  activeStopId: string | null;
  signed: Record<string, boolean>;

  stockSearch: string;
  stockFilter: StockFilter;
  /** Stock physique du dépôt, en colis, par référence produit. */
  stock: Record<string, number>;
  stockMoves: StockMove[];
  moveSeq: number;

  orders: Order[];
}
