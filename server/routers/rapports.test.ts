import { afterEach, describe, expect, it, vi } from "vitest";
import { rapportsRouter } from "./rapports";
import { fakeContext, fakeUser } from "./test-utils";
import { LineStatus } from "@/lib/generated/prisma/enums";

function caller(prisma: Record<string, unknown>) {
  return rapportsRouter.createCaller(fakeContext(fakeUser("admin"), prisma));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("rapports.summary — période jour", () => {
  it("agrège commandes, CA, préparation, conformité et écarts sur la journée", async () => {
    // Mercredi 19 août 2026, 15h : la journée en cours va de minuit à maintenant.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T13:00:00Z")); // 15 h à Paris

    const orderA = {
      createdAt: new Date("2026-08-19T07:00:00Z"), // 09:00 à Paris
      readyAt: new Date("2026-08-19T07:20:00Z"), // 09:20 à Paris, soit 20 min de préparation
      lines: [
        {
          productId: "p1",
          qty: 2,
          picked: 2,
          unitPriceCents: 1000,
          status: LineStatus.done,
          product: { name: "Mangue Kent", unit: "Colis 6 kg" },
        },
      ],
    };
    const orderB = {
      createdAt: new Date("2026-08-19T08:30:00Z"), // 10:30 à Paris
      readyAt: null,
      lines: [
        {
          productId: "p2",
          qty: 1,
          picked: 0,
          unitPriceCents: 2000,
          status: LineStatus.missing,
          product: { name: "Riz basmati Pusa", unit: "Sac 20 kg" },
        },
        {
          productId: "p1",
          qty: 3,
          picked: 2,
          unitPriceCents: 500,
          status: LineStatus.partial,
          product: { name: "Mangue Kent", unit: "Colis 6 kg" },
        },
      ],
    };
    const clearanceRecent = {
      at: new Date("2026-08-19T09:00:00Z"), // 11:00 à Paris
      conform: false,
      order: { customer: { name: "Client B" } },
    };
    const clearanceEarlier = {
      at: new Date("2026-08-19T07:30:00Z"), // 09:30 à Paris
      conform: true,
      order: { customer: { name: "Client A" } },
    };

    const prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([orderA, orderB]),
        count: vi.fn().mockResolvedValue(5),
      },
      orderLine: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { picked: 10 } }),
      },
      securityClearance: {
        findMany: vi.fn().mockResolvedValue([clearanceRecent, clearanceEarlier]),
      },
    };

    const report = await caller(prisma).summary({ period: "jour" });

    expect(report.rangeLabel).toBe("Journalier — mercredi 19 août 2026");
    expect(report.chartSub).toBe("Par tranche horaire");

    expect(report.kpis).toEqual([
      { label: "Commandes", value: "2", trend: "−3 vs période précédente", direction: "down" },
      { label: "CA HT", value: "55,00 €", trend: "−3 vs période précédente", direction: "down" },
      { label: "Produits préparés", value: "4", trend: "−6 vs période précédente", direction: "down" },
      { label: "Conformité", value: "50,0 %", trend: "2 contrôles sur la période", direction: "flat" },
      { label: "Ruptures", value: "1", trend: "lignes manquantes sur la période", direction: "down" },
      { label: "Délai moyen prépa", value: "20 min", trend: "objectif 25 min", direction: "up" },
    ]);

    // 2 000 cts à 9h (2 × 1000), 3 500 cts à 10h (1 × 2000 + 3 × 500).
    expect(report.bars).toEqual([
      { label: "9h", value: 20 },
      { label: "10h", value: 35 },
    ]);

    expect(report.top).toEqual([
      { name: "Mangue Kent", qty: "5 × Colis 6 kg", value: 5 },
      { name: "Riz basmati Pusa", qty: "1 × Sac 20 kg", value: 1 },
    ]);

    expect(report.gaps).toEqual([
      { name: "Riz basmati Pusa", type: "Manquant", count: 1 },
      { name: "Mangue Kent", type: "Partiel", count: 1 },
    ]);

    expect(report.controls).toEqual([
      { time: "11:00", client: "Client B", result: "Écart signalé" },
      { time: "09:30", client: "Client A", result: "Conforme" },
    ]);
  });

  it("borne la journée sur Paris et non sur UTC", async () => {
    // 00:30 UTC le 20 août = 02:30 à Paris : on est déjà le 20 des deux côtés,
    // mais la journée parisienne a commencé à 22:00 UTC la veille, pas à minuit UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T00:30:00Z"));

    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      order: { findMany, count: vi.fn().mockResolvedValue(0) },
      orderLine: { aggregate: vi.fn().mockResolvedValue({ _sum: { picked: null } }) },
      securityClearance: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const report = await caller(prisma).summary({ period: "jour" });

    expect(report.rangeLabel).toBe("Journalier — jeudi 20 août 2026");
    expect(findMany.mock.calls[0][0].where.createdAt.gte.toISOString()).toBe("2026-08-19T22:00:00.000Z");
  });

  it("affiche des tirets plutôt qu'une division par zéro sans donnée", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T13:00:00Z")); // 15 h à Paris

    const prisma = {
      order: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
      orderLine: { aggregate: vi.fn().mockResolvedValue({ _sum: { picked: null } }) },
      securityClearance: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const report = await caller(prisma).summary({ period: "jour" });

    expect(report.kpis.find((k) => k.label === "Conformité")?.value).toBe("—");
    expect(report.kpis.find((k) => k.label === "Délai moyen prépa")?.value).toBe("—");
    expect(report.bars).toEqual([]);
    expect(report.top).toEqual([]);
    expect(report.gaps).toEqual([]);
    expect(report.controls).toEqual([]);
  });
});

describe("rapports.summary — périodes semaine et mois", () => {
  const emptyPrisma = {
    order: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    orderLine: { aggregate: vi.fn().mockResolvedValue({ _sum: { picked: null } }) },
    securityClearance: { findMany: vi.fn().mockResolvedValue([]) },
  };

  it("bascule le sous-titre du graphe et le libellé de plage sur la semaine", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T13:00:00Z")); // 15 h à Paris

    const report = await caller(emptyPrisma).summary({ period: "semaine" });

    expect(report.chartSub).toBe("Par jour");
    expect(report.rangeLabel).toMatch(/^Hebdomadaire — semaine du/);
  });

  it("bascule le sous-titre du graphe et le libellé de plage sur le mois", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T13:00:00Z")); // 15 h à Paris

    const report = await caller(emptyPrisma).summary({ period: "mois" });

    expect(report.chartSub).toBe("Par semaine");
    expect(report.rangeLabel).toBe("Mensuel — août 2026");
  });
});
