import type { RepPeriod } from "./types";

export interface ReportKpi {
  label: string;
  value: string;
  trend: string;
  trendColor: string;
}

export interface ReportBar {
  label: string;
  value: number;
}

export interface ReportTopProduct {
  name: string;
  qty: string;
  value: number;
}

export type GapType = "Partiel" | "Manquant";

export interface ReportGap {
  name: string;
  type: GapType;
  count: number;
}

export type ControlResult = "Conforme" | "Écart signalé";

export interface ReportControl {
  time: string;
  client: string;
  result: ControlResult;
}

export interface Report {
  chartSub: string;
  kpis: ReportKpi[];
  bars: ReportBar[];
  top: ReportTopProduct[];
  gaps: ReportGap[];
  controls: ReportControl[];
}

const UP = "var(--gnanam-success)";
const DOWN = "var(--gnanam-error)";
const FLAT = "var(--gnanam-gray-400)";

export const REPORT_TABS: { period: RepPeriod; label: string }[] = [
  { period: "jour", label: "Journalier" },
  { period: "semaine", label: "Hebdo" },
  { period: "mois", label: "Mensuel" },
];

export const REPORTS: Record<RepPeriod, Report> = {
  jour: {
    chartSub: "Par tranche horaire",
    kpis: [
      { label: "Commandes", value: "14", trend: "+3 vs hier", trendColor: UP },
      { label: "CA HT", value: "4 820 €", trend: "+8,4 %", trendColor: UP },
      { label: "Produits préparés", value: "186", trend: "12 caddies", trendColor: FLAT },
      { label: "Conformité", value: "97,3 %", trend: "+1,2 pt", trendColor: UP },
      { label: "Ruptures", value: "5", trend: "−2 vs hier", trendColor: UP },
      { label: "Délai moyen prépa", value: "23 min", trend: "objectif 25 min", trendColor: FLAT },
    ],
    bars: [
      { label: "8h", value: 410 },
      { label: "9h", value: 730 },
      { label: "10h", value: 980 },
      { label: "11h", value: 620 },
      { label: "12h", value: 350 },
      { label: "14h", value: 840 },
      { label: "15h", value: 560 },
      { label: "16h", value: 330 },
    ],
    top: [
      { name: "Riz basmati Pusa", qty: "18 sacs", value: 18 },
      { name: "Banane plantain", qty: "14 cartons", value: 14 },
      { name: "Mangue Kent", qty: "12 colis", value: 12 },
      { name: "Lait de coco 400 ml", qty: "9 cartons", value: 9 },
      { name: "Tilapia surgelé", qty: "6 cartons", value: 6 },
    ],
    gaps: [
      { name: "Piment antillais", type: "Partiel", count: 3 },
      { name: "Tilapia entier surgelé", type: "Manquant", count: 2 },
      { name: "Gombo frais", type: "Partiel", count: 1 },
    ],
    controls: [
      { time: "11:42", client: "Restaurant Le Baobab", result: "Conforme" },
      { time: "10:18", client: "Épicerie Mont Kailash", result: "Conforme" },
      { time: "09:55", client: "Traiteur Saveurs Lankaises", result: "Écart signalé" },
      { time: "08:37", client: "Supermarché Exo Plus", result: "Conforme" },
    ],
  },
  semaine: {
    chartSub: "Par jour ouvré",
    kpis: [
      { label: "Commandes", value: "78", trend: "+11 vs S31", trendColor: UP },
      { label: "CA HT", value: "26 141 €", trend: "+6,1 %", trendColor: UP },
      { label: "Produits préparés", value: "1 042", trend: "71 caddies", trendColor: FLAT },
      { label: "Conformité", value: "96,1 %", trend: "−0,4 pt", trendColor: DOWN },
      { label: "Ruptures", value: "31", trend: "+4 vs S31", trendColor: DOWN },
      { label: "Délai moyen prépa", value: "26 min", trend: "objectif 25 min", trendColor: DOWN },
    ],
    bars: [
      { label: "Lun", value: 4120 },
      { label: "Mar", value: 5380 },
      { label: "Mer", value: 4820 },
      { label: "Jeu", value: 5910 },
      { label: "Ven", value: 4390 },
      { label: "Sam", value: 1520 },
    ],
    top: [
      { name: "Riz basmati Pusa", qty: "96 sacs", value: 96 },
      { name: "Banane plantain", qty: "81 cartons", value: 81 },
      { name: "Mangue Kent", qty: "64 colis", value: 64 },
      { name: "Igname du Ghana", qty: "52 sacs", value: 52 },
      { name: "Ginger beer", qty: "44 packs", value: 44 },
    ],
    gaps: [
      { name: "Tilapia entier surgelé", type: "Manquant", count: 11 },
      { name: "Piment antillais", type: "Partiel", count: 9 },
      { name: "Fruit de la passion", type: "Manquant", count: 6 },
      { name: "Gombo frais", type: "Partiel", count: 5 },
    ],
    controls: [
      { time: "Ven 17:20", client: "Supermarché Exo Plus", result: "Conforme" },
      { time: "Jeu 11:05", client: "Restaurant Le Baobab", result: "Écart signalé" },
      { time: "Mer 10:18", client: "Épicerie Mont Kailash", result: "Conforme" },
      { time: "Mar 09:12", client: "Traiteur Saveurs Lankaises", result: "Conforme" },
    ],
  },
  mois: {
    chartSub: "Par semaine",
    kpis: [
      { label: "Commandes", value: "312", trend: "+27 vs juin", trendColor: UP },
      { label: "CA HT", value: "104 920 €", trend: "+9,3 %", trendColor: UP },
      { label: "Produits préparés", value: "4 188", trend: "296 caddies", trendColor: FLAT },
      { label: "Conformité", value: "95,4 %", trend: "−1,1 pt", trendColor: DOWN },
      { label: "Ruptures", value: "142", trend: "+18 vs juin", trendColor: DOWN },
      { label: "Délai moyen prépa", value: "28 min", trend: "objectif 25 min", trendColor: DOWN },
    ],
    bars: [
      { label: "S27", value: 22400 },
      { label: "S28", value: 25100 },
      { label: "S29", value: 19800 },
      { label: "S30", value: 24600 },
      { label: "S31", value: 13020 },
    ],
    top: [
      { name: "Riz basmati Pusa", qty: "384 sacs", value: 384 },
      { name: "Banane plantain", qty: "331 cartons", value: 331 },
      { name: "Mangue Kent", qty: "268 colis", value: 268 },
      { name: "Lait de coco 400 ml", qty: "215 cartons", value: 215 },
      { name: "Igname du Ghana", qty: "198 sacs", value: 198 },
    ],
    gaps: [
      { name: "Tilapia entier surgelé", type: "Manquant", count: 41 },
      { name: "Piment antillais", type: "Partiel", count: 33 },
      { name: "Litchis surgelés", type: "Manquant", count: 24 },
      { name: "Gombo frais", type: "Partiel", count: 19 },
    ],
    controls: [
      { time: "31/07 16:40", client: "Supermarché Exo Plus", result: "Conforme" },
      { time: "29/07 12:10", client: "Épicerie Mont Kailash", result: "Écart signalé" },
      { time: "24/07 08:50", client: "Restaurant Le Baobab", result: "Conforme" },
      { time: "18/07 09:30", client: "Traiteur Saveurs Lankaises", result: "Conforme" },
    ],
  },
};

/** Le rapport journalier porte la date du jour, les autres une période figée. */
export function reportRange(period: RepPeriod): string {
  if (period === "jour") {
    const date = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `Journalier — ${date}`;
  }
  return period === "semaine" ? "Hebdomadaire — semaine 32 (3 au 8 août 2026)" : "Mensuel — juillet 2026";
}

export const GAP_STYLES: Record<GapType, { bg: string; fg: string }> = {
  Manquant: { bg: "var(--gnanam-error-bg)", fg: "var(--gnanam-error)" },
  Partiel: { bg: "var(--gnanam-amber-bg)", fg: "var(--gnanam-amber)" },
};

export const CONTROL_STYLES: Record<ControlResult, { bg: string; fg: string }> = {
  Conforme: { bg: "var(--gnanam-success-bg)", fg: "var(--gnanam-success)" },
  "Écart signalé": { bg: "var(--gnanam-amber-bg)", fg: "var(--gnanam-amber)" },
};
