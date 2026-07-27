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
export type ModuleId = "commande" | "preparation" | "livraison";
export type PrepView = "list" | "pick";
export type LivView = "list" | "detail";

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

  orders: Order[];
}
