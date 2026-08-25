import { z } from "zod";
import { adminProcedure, router } from "@/server/trpc";
import { LineStatus } from "@/lib/generated/prisma/enums";
import {
  TZ,
  formatParisDate,
  formatParisTime,
  parisParts,
  parisWeekday,
  startOfParisDay,
  startOfParisMonth,
  startOfParisWeek,
} from "@/lib/gnanam/timezone";

type Period = "jour" | "semaine" | "mois";
type Trend = "up" | "down" | "flat";

/**
 * Toutes les bornes sont calculées à l'heure de Paris : sur Vercel le processus
 * tourne en UTC, et un rapport « journalier » qui bascule à 2 h du matin heure
 * française n'aurait aucun sens pour l'entrepôt.
 */
function rangeFor(period: Period, now: Date): { start: Date; end: Date } {
  if (period === "jour") return { start: startOfParisDay(now), end: now };
  if (period === "semaine") return { start: startOfParisWeek(now), end: now };
  return { start: startOfParisMonth(now), end: now };
}

/** Fenêtre de même durée immédiatement avant, pour donner un point de comparaison aux KPI. */
function previousRangeFor(start: Date, end: Date): { start: Date; end: Date } {
  const lengthMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(prevEnd.getTime() - lengthMs);
  return { start: prevStart, end: prevEnd };
}

function trendOf(current: number, previous: number): { label: string; direction: Trend } {
  const diff = current - previous;
  if (diff === 0) return { label: "stable vs période précédente", direction: "flat" };
  const sign = diff > 0 ? "+" : "−";
  return { label: `${sign}${Math.abs(diff)} vs période précédente`, direction: diff > 0 ? "up" : "down" };
}

function eur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function rangeLabel(period: Period, start: Date): string {
  if (period === "jour") {
    return `Journalier — ${formatParisDate(start, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
  }
  if (period === "semaine") {
    const end = new Date(start.getTime() + 6 * 86_400_000);
    const fmt = (d: Date) => formatParisDate(d, { day: "numeric", month: "long" });
    return `Hebdomadaire — semaine du ${fmt(start)} au ${fmt(end)} ${parisParts(end).year}`;
  }
  return `Mensuel — ${formatParisDate(start, { month: "long", year: "numeric" })}`;
}

function controlTime(period: Period, d: Date): string {
  if (period === "jour") return formatParisTime(d);
  if (period === "semaine") {
    const day = d.toLocaleDateString("fr-FR", { timeZone: TZ, weekday: "short" });
    return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${formatParisTime(d)}`;
  }
  return `${formatParisDate(d, { day: "2-digit", month: "2-digit" })} ${formatParisTime(d)}`;
}

export const rapportsRouter = router({
  summary: adminProcedure.input(z.object({ period: z.enum(["jour", "semaine", "mois"]) })).query(async ({ ctx, input }) => {
    const now = new Date();
    const { start, end } = rangeFor(input.period, now);
    const prev = previousRangeFor(start, end);

    const [orders, prevOrderCount, prevLineAgg, clearances] = await Promise.all([
      ctx.prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { lines: { include: { product: { select: { name: true, unit: true } } } } },
      }),
      ctx.prisma.order.count({ where: { createdAt: { gte: prev.start, lt: prev.end } } }),
      ctx.prisma.orderLine.aggregate({
        where: { order: { createdAt: { gte: prev.start, lt: prev.end } } },
        _sum: { picked: true },
      }),
      ctx.prisma.securityClearance.findMany({
        where: { at: { gte: start, lte: end } },
        include: { order: { include: { customer: { select: { name: true } } } } },
        orderBy: { at: "desc" },
      }),
    ]);

    const allLines = orders.flatMap((o) => o.lines);
    const caCents = allLines.reduce((sum, l) => sum + l.qty * l.unitPriceCents, 0);
    const produitsPreparés = allLines.filter((l) => l.status !== LineStatus.pending).reduce((sum, l) => sum + l.picked, 0);
    const ruptures = allLines.filter((l) => l.status === LineStatus.missing).length;

    const readyDurations = orders.filter((o) => o.readyAt).map((o) => (o.readyAt!.getTime() - o.createdAt.getTime()) / 60_000);
    const delaiMoyen = readyDurations.length
      ? Math.round(readyDurations.reduce((a, b) => a + b, 0) / readyDurations.length)
      : null;

    const conformCount = clearances.filter((c) => c.conform).length;
    const conformite = clearances.length ? Math.round((conformCount / clearances.length) * 1000) / 10 : null;

    const commandesTrend = trendOf(orders.length, prevOrderCount);
    const produitsTrend = trendOf(produitsPreparés, prevLineAgg._sum.picked ?? 0);

    const kpis: { label: string; value: string; trend: string; direction: Trend }[] = [
      { label: "Commandes", value: String(orders.length), trend: commandesTrend.label, direction: commandesTrend.direction },
      { label: "CA HT", value: eur(caCents), trend: commandesTrend.label, direction: commandesTrend.direction },
      { label: "Produits préparés", value: String(produitsPreparés), trend: produitsTrend.label, direction: produitsTrend.direction },
      {
        label: "Conformité",
        value: conformite === null ? "—" : `${conformite.toFixed(1).replace(".", ",")} %`,
        trend: `${clearances.length} contrôle${clearances.length > 1 ? "s" : ""} sur la période`,
        direction: "flat",
      },
      { label: "Ruptures", value: String(ruptures), trend: "lignes manquantes sur la période", direction: ruptures > 0 ? "down" : "flat" },
      {
        label: "Délai moyen prépa",
        value: delaiMoyen === null ? "—" : `${delaiMoyen} min`,
        trend: "objectif 25 min",
        direction: delaiMoyen === null ? "flat" : delaiMoyen <= 25 ? "up" : "down",
      },
    ];

    const bars: { label: string; value: number }[] = [];
    const caOf = (o: (typeof orders)[number]) => o.lines.reduce((s, l) => s + l.qty * l.unitPriceCents, 0);

    if (input.period === "jour") {
      const byHour = new Map<number, number>();
      for (const o of orders) {
        const h = parisParts(o.createdAt).hour;
        byHour.set(h, (byHour.get(h) ?? 0) + caOf(o));
      }
      for (const h of [...byHour.keys()].sort((a, b) => a - b)) bars.push({ label: `${h}h`, value: Math.round((byHour.get(h) ?? 0) / 100) });
    } else if (input.period === "semaine") {
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      const byDay = new Map<number, number>();
      for (const o of orders) {
        const d = parisWeekday(o.createdAt);
        byDay.set(d, (byDay.get(d) ?? 0) + caOf(o));
      }
      for (const d of [1, 2, 3, 4, 5, 6, 0]) {
        if (byDay.has(d)) bars.push({ label: days[d], value: Math.round((byDay.get(d) ?? 0) / 100) });
      }
    } else {
      const byWeek = new Map<number, number>();
      for (const o of orders) {
        const w = Math.floor((parisParts(o.createdAt).day - 1) / 7);
        byWeek.set(w, (byWeek.get(w) ?? 0) + caOf(o));
      }
      for (const w of [...byWeek.keys()].sort((a, b) => a - b)) bars.push({ label: `Sem. ${w + 1}`, value: Math.round((byWeek.get(w) ?? 0) / 100) });
    }

    const topMap = new Map<string, { name: string; unit: string; qty: number }>();
    for (const l of allLines) {
      const entry = topMap.get(l.productId) ?? { name: l.product.name, unit: l.product.unit, qty: 0 };
      entry.qty += l.qty;
      topMap.set(l.productId, entry);
    }
    const top = [...topMap.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((t) => ({ name: t.name, qty: `${t.qty} × ${t.unit}`, value: t.qty }));

    const gapMap = new Map<string, { name: string; type: "Partiel" | "Manquant"; count: number }>();
    for (const l of allLines) {
      if (l.status !== LineStatus.partial && l.status !== LineStatus.missing) continue;
      const type = l.status === LineStatus.partial ? "Partiel" : "Manquant";
      const key = `${l.productId}-${type}`;
      const entry = gapMap.get(key) ?? { name: l.product.name, type, count: 0 };
      entry.count += 1;
      gapMap.set(key, entry);
    }
    const gaps = [...gapMap.values()].sort((a, b) => b.count - a.count).slice(0, 6);

    const controls = clearances.slice(0, 6).map((c) => ({
      time: controlTime(input.period, c.at),
      client: c.order.customer.name,
      result: c.conform ? ("Conforme" as const) : ("Écart signalé" as const),
    }));

    return { rangeLabel: rangeLabel(input.period, start), chartSub: input.period === "jour" ? "Par tranche horaire" : input.period === "semaine" ? "Par jour" : "Par semaine", kpis, bars, top, gaps, controls };
  }),
});
