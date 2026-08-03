import type { Product, Order, Category, Zone, StockMove, StockMoveKind } from "./types";

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Mangue Kent", unit: "Colis 6 kg", price: 24.0, cat: "Fruits & Légumes", zone: "Frais" },
  { id: "p2", name: "Banane plantain", unit: "Carton 18 kg", price: 29.5, cat: "Fruits & Légumes", zone: "Frais" },
  { id: "p3", name: "Igname du Ghana", unit: "Sac 20 kg", price: 38.0, cat: "Fruits & Légumes", zone: "Frais" },
  { id: "p4", name: "Manioc frais", unit: "Carton 10 kg", price: 21.0, cat: "Fruits & Légumes", zone: "Frais" },
  { id: "p5", name: "Patate douce rouge", unit: "Colis 6 kg", price: 14.5, cat: "Fruits & Légumes", zone: "Frais" },
  { id: "p6", name: "Piment antillais", unit: "Colis 3 kg", price: 26.0, cat: "Fruits & Légumes", zone: "Frais" },
  { id: "p7", name: "Gombo frais", unit: "Colis 4 kg", price: 22.0, cat: "Fruits & Légumes", zone: "Frais" },
  { id: "p8", name: "Fruit de la passion", unit: "Colis 3 kg", price: 19.8, cat: "Fruits & Légumes", zone: "Frais" },
  { id: "p9", name: "Riz basmati Pusa", unit: "Sac 20 kg", price: 33.0, cat: "Épicerie", zone: "Sec" },
  { id: "p10", name: "Lait de coco 400 ml", unit: "Carton ×24", price: 28.8, cat: "Épicerie", zone: "Sec" },
  { id: "p11", name: "Farine de manioc Gari", unit: "Sac 10 kg", price: 18.5, cat: "Épicerie", zone: "Sec" },
  { id: "p12", name: "Curry de Madras", unit: "Carton ×12", price: 21.6, cat: "Épicerie", zone: "Sec" },
  { id: "p13", name: "Dattes Deglet Nour", unit: "Carton 5 kg", price: 17.0, cat: "Épicerie", zone: "Sec" },
  { id: "p14", name: "Litchis surgelés", unit: "Carton 10 kg", price: 31.0, cat: "Surgelés", zone: "Surgelé" },
  { id: "p15", name: "Tilapia entier surgelé", unit: "Carton 10 kg", price: 42.0, cat: "Surgelés", zone: "Surgelé" },
  { id: "p16", name: "Feuilles de manioc", unit: "Carton 8 kg", price: 27.2, cat: "Surgelés", zone: "Surgelé" },
  { id: "p17", name: "Jus tropical mangue", unit: "Pack ×12", price: 15.6, cat: "Boissons", zone: "Sec" },
  { id: "p18", name: "Ginger beer", unit: "Pack ×24", price: 19.2, cat: "Boissons", zone: "Sec" },
];

export const PROMO_IDS = ["p1", "p9", "p15"];

export const CATEGORY_NAMES: string[] = ["Tous", "Fruits & Légumes", "Épicerie", "Surgelés", "Boissons"];

export const CAT_COLORS: Record<Category, [string, string]> = {
  "Fruits & Légumes": ["#EAF4EC", "#2E7D4F"],
  "Épicerie": ["#F6EEDA", "#8A6412"],
  "Surgelés": ["#E5EFF5", "#2C6E8A"],
  "Boissons": ["#F3E9E4", "#A05A2C"],
};

export const ZONE_COLORS: Record<Zone, [string, string]> = {
  Sec: ["#F6EEDA", "#8A6412"],
  Frais: ["#EAF4EC", "#2E7D4F"],
  "Surgelé": ["#E5EFF5", "#2C6E8A"],
};

export const ZONE_LABELS: Record<Zone, string> = {
  Sec: "Zone sec & boissons",
  Frais: "Zone fraîche",
  "Surgelé": "Chambre froide −18°C",
};

function makeLines(entries: [string, number][]) {
  return entries.map(([pid, qty]) => ({ pid, qty, status: "done" as const, picked: qty }));
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: "CMD-1041",
    client: "Restaurant Le Baobab",
    address: "12 rue des Pyramides, 75001 Paris",
    window: "6h – 9h",
    status: "ready",
    lines: makeLines([["p2", 3], ["p9", 2], ["p15", 1], ["p10", 1]]),
  },
  {
    id: "CMD-1042",
    client: "Épicerie Mont Kailash",
    address: "48 rue du Faubourg St-Denis, 75010 Paris",
    window: "8h – 11h",
    status: "todo",
    lines: [["p1", 4], ["p2", 2], ["p6", 1], ["p9", 3], ["p10", 2], ["p12", 1], ["p14", 2], ["p15", 1]].map(
      ([pid, qty]) => ({ pid: pid as string, qty: qty as number, status: "pending" as const, picked: qty as number })
    ),
  },
  {
    id: "CMD-1043",
    client: "Supermarché Exo Plus",
    address: "7 av. de la République, 93300 Aubervilliers",
    window: "9h – 12h",
    status: "todo",
    lines: [["p3", 2], ["p5", 3], ["p11", 2], ["p13", 1], ["p17", 4], ["p16", 1]].map(
      ([pid, qty]) => ({ pid: pid as string, qty: qty as number, status: "pending" as const, picked: qty as number })
    ),
  },
  {
    id: "CMD-1040",
    client: "Traiteur Saveurs Lankaises",
    address: "23 rue Cail, 75010 Paris",
    window: "6h – 8h",
    status: "delivered",
    lines: makeLines([["p9", 1], ["p12", 2], ["p10", 1]]),
  },
];

/** Stock physique du dépôt (en colis) et seuil de réappro par référence. */
export const STOCK_SEED: Record<string, { qty: number; min: number }> = {
  p1: { qty: 46, min: 12 },
  p2: { qty: 31, min: 10 },
  p3: { qty: 18, min: 8 },
  p4: { qty: 24, min: 8 },
  p5: { qty: 9, min: 10 },
  p6: { qty: 4, min: 8 },
  p7: { qty: 15, min: 6 },
  p8: { qty: 21, min: 6 },
  p9: { qty: 62, min: 20 },
  p10: { qty: 48, min: 18 },
  p11: { qty: 27, min: 10 },
  p12: { qty: 33, min: 12 },
  p13: { qty: 7, min: 10 },
  p14: { qty: 19, min: 8 },
  p15: { qty: 12, min: 10 },
  p16: { qty: 0, min: 6 },
  p17: { qty: 41, min: 15 },
  p18: { qty: 36, min: 15 },
};

export const INITIAL_STOCK: Record<string, number> = Object.fromEntries(
  Object.entries(STOCK_SEED).map(([pid, s]) => [pid, s.qty])
);

export function stockMin(pid: string): number {
  return STOCK_SEED[pid]?.min ?? 0;
}

export const STOCK_MOVE_LABELS: Record<StockMoveKind, string> = {
  sortie: "Sortie préparation",
  reception: "Réception fournisseur",
  ajustement: "Ajustement inventaire",
  annulation: "Retour en stock",
};

/** Historique du début de journée — heures figées pour rester stable au rendu serveur. */
export const INITIAL_MOVES: StockMove[] = [
  { id: "m3", pid: "p9", delta: -1, kind: "sortie", time: "07:42", label: "Traiteur Saveurs Lankaises · CMD-1040" },
  { id: "m2", pid: "p15", delta: -1, kind: "sortie", time: "07:38", label: "Restaurant Le Baobab · CMD-1041" },
  { id: "m1", pid: "p10", delta: 24, kind: "reception", time: "06:15", label: "Palette fournisseur · BL-8842" },
];

export function findProduct(pid: string): Product {
  const p = PRODUCTS.find((p) => p.id === pid);
  if (!p) throw new Error(`Unknown product ${pid}`);
  return p;
}

export const PREP_STATUS: Record<string, [string, string, string]> = {
  todo: ["À préparer", "#F6EEDA", "#8A6412"],
  picking: ["En cours", "#E5EFF5", "#2C6E8A"],
  ready: ["Prête", "#EAF4EC", "#2E7D4F"],
  delivered: ["Livrée", "#EEE9DC", "#5B6E72"],
};

export const LIV_STATUS: Record<string, [string, string, string]> = {
  ready: ["À livrer", "#F6EEDA", "#8A6412"],
  delivered: ["Livrée", "#EAF4EC", "#2E7D4F"],
  todo: ["En préparation", "#EEE9DC", "#5B6E72"],
  picking: ["En préparation", "#EEE9DC", "#5B6E72"],
};
