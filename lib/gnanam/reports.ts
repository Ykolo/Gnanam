import type { RepPeriod } from "./types";

export const REPORT_TABS: { period: RepPeriod; label: string }[] = [
  { period: "jour", label: "Journalier" },
  { period: "semaine", label: "Hebdo" },
  { period: "mois", label: "Mensuel" },
];

export type GapType = "Partiel" | "Manquant";
export type ControlResult = "Conforme" | "Écart signalé";
export type Trend = "up" | "down" | "flat";

export const GAP_STYLES: Record<GapType, { bg: string; fg: string }> = {
  Manquant: { bg: "var(--gnanam-error-bg)", fg: "var(--gnanam-error)" },
  Partiel: { bg: "var(--gnanam-amber-bg)", fg: "var(--gnanam-amber)" },
};

export const CONTROL_STYLES: Record<ControlResult, { bg: string; fg: string }> = {
  Conforme: { bg: "var(--gnanam-success-bg)", fg: "var(--gnanam-success)" },
  "Écart signalé": { bg: "var(--gnanam-amber-bg)", fg: "var(--gnanam-amber)" },
};

export const TREND_COLORS: Record<Trend, string> = {
  up: "var(--gnanam-success)",
  down: "var(--gnanam-error)",
  flat: "var(--gnanam-gray-400)",
};
