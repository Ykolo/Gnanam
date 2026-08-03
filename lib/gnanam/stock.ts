import type { Order, OrderLine, StockLevel } from "./types";
import { PRODUCTS, findProduct, stockMin } from "./data";

/**
 * Quantité déjà sortie physiquement du dépôt pour une ligne : tant que la ligne
 * est « pending » la marchandise est encore en rayon, elle est seulement réservée.
 */
export function consumedOf(line: OrderLine): number {
  return line.status === "pending" ? 0 : line.picked;
}

/** Quantités réservées par les commandes en cours, par référence. */
export function reservedMap(orders: Order[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const o of orders) {
    if (o.status === "delivered") continue;
    for (const l of o.lines) {
      if (l.status !== "pending") continue;
      map[l.pid] = (map[l.pid] || 0) + l.qty;
    }
  }
  return map;
}

export function levelOf(available: number, min: number): StockLevel {
  if (available <= 0) return "rupture";
  if (available < min) return "critique";
  return "ok";
}

export const LEVEL_STYLES: Record<StockLevel, { label: string; bg: string; fg: string; bar: string }> = {
  rupture: { label: "Rupture", bg: "var(--gnanam-error-bg)", fg: "var(--gnanam-error)", bar: "#D96C5F" },
  critique: { label: "Sous le seuil", bg: "var(--gnanam-amber-bg)", fg: "var(--gnanam-amber)", bar: "var(--warning)" },
  ok: { label: "Disponible", bg: "var(--gnanam-success-bg)", fg: "var(--gnanam-success)", bar: "var(--gnanam-success)" },
};

export interface StockRow {
  pid: string;
  qty: number;
  reserved: number;
  available: number;
  min: number;
  level: StockLevel;
}

/** Vue complète du stock dépôt, référence par référence. */
export function stockRows(stock: Record<string, number>, orders: Order[]): StockRow[] {
  const reserved = reservedMap(orders);
  return PRODUCTS.map((p) => {
    const qty = stock[p.id] ?? 0;
    const res = reserved[p.id] || 0;
    const available = qty - res;
    const min = stockMin(p.id);
    return { pid: p.id, qty, reserved: res, available, min, level: levelOf(available, min) };
  });
}

export function stockValue(stock: Record<string, number>): number {
  return Object.entries(stock).reduce((total, [pid, qty]) => total + findProduct(pid).price * qty, 0);
}
