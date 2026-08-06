import type { Order } from "./types";
import { findProduct } from "./data";

export function eur(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

/** « 1 caddie » / « 3 caddies » — accord simple du nom qui suit le compte. */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function kgMatch(unit: string): number | null {
  const m = unit.match(/([\d,.]+)\s*kg/i);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

export function packMatch(unit: string): number | null {
  const m = unit.match(/×\s*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function unitPriceLabel(unit: string, price: number): string {
  const kg = kgMatch(unit);
  if (kg) return eur(price / kg) + " / kg";
  const pack = packMatch(unit);
  if (pack) return eur(price / pack) + " / unité";
  return "le colis";
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export interface ZoneGroup {
  zone: string;
  idxs: number[];
}

export function zonesOf(order: Order, groupByZone: boolean): ZoneGroup[] {
  if (!groupByZone) {
    return [{ zone: "Tous produits", idxs: order.lines.map((_, i) => i) }];
  }
  const order3 = ["Sec", "Frais", "Surgelé"];
  return order3
    .map((zone) => ({
      zone,
      idxs: order.lines
        .map((l, i) => (findProduct(l.pid).zone === zone ? i : -1))
        .filter((i) => i >= 0),
    }))
    .filter((g) => g.idxs.length > 0);
}

export function todayLabel(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
