import type { StockLevel } from "./types";

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
