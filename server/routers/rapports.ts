import { z } from "zod";
import { adminProcedure, router } from "@/server/trpc";
import { LineStatus } from "@/lib/generated/prisma/enums";

type Period = "jour" | "semaine" | "mois";
type Trend = "up" | "down" | "flat";

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d);
  const day = c.getDay();
  c.setDate(c.getDate() + (day === 0 ? -6 : 1 - day));
  return c;
}

function startOfMonth(d: Date): Date {
  const c = startOfDay(d);
  c.setDate(1);
  return c;
}

function rangeFor(period: Period, now: Date): { start: Date; end: Date } {
  if (period === "jour") return { start: startOfDay(now), end: now };
  if (period === "semaine") return { start: startOfWeek(now), end: now };
  return { start: startOfMonth(now), end: now };
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
    return `Journalier — ${start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
  }
  if (period === "semaine") {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    return `Hebdomadaire — semaine du ${fmt(start)} au ${fmt(end)} ${end.getFullYear()}`;
  }
  return `Mensuel — ${start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
}

function controlTime(period: Period, d: Date): string {
  if (period === "jour") return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (period === "semaine") {
    const day = d.toLocaleDateString("fr-FR", { weekday: "short" });
    return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
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
    if (input.period === "jour") {
      const byHour = new Map<number, number>();
      for (const o of orders) {
        const h = o.createdAt.getHours();
        byHour.set(h, (byHour.get(h) ?? 0) + o.lines.reduce((s, l) => s + l.qty * l.unitPriceCents, 0));
      }
      for (const h of [...byHour.keys()].sort((a, b) => a - b)) bars.push({ label: `${h}h`, value: Math.round((byHour.get(h) ?? 0) / 100) });
    } else if (input.period === "semaine") {
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      const byDay = new Map<number, number>();
      for (const o of orders) {
        const d = o.createdAt.getDay();
        byDay.set(d, (byDay.get(d) ?? 0) + o.lines.reduce((s, l) => s + l.qty * l.unitPriceCents, 0));
      }
      for (const d of [1, 2, 3, 4, 5, 6, 0]) {
        if (byDay.has(d)) bars.push({ label: days[d], value: Math.round((byDay.get(d) ?? 0) / 100) });
      }
    } else {
      const byWeek = new Map<number, number>();
      for (const o of orders) {
        const w = Math.floor((o.createdAt.getDate() - 1) / 7);
        byWeek.set(w, (byWeek.get(w) ?? 0) + o.lines.reduce((s, l) => s + l.qty * l.unitPriceCents, 0));
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
