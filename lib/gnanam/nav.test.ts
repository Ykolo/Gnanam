import { describe, expect, it } from "vitest";
import { OrderStatus } from "@/lib/generated/prisma/enums";
import type { RouterOutputs } from "@/lib/trpc/client";
import { moduleBadge, modulesOf } from "./nav";

type Orders = RouterOutputs["orders"]["today"];
type StockRows = RouterOutputs["stock"]["list"];

function order(status: OrderStatus, clearance: unknown = null) {
  return { status, clearance } as Orders[number];
}

function stockRow(level: "rupture" | "critique" | "ok") {
  return { level } as StockRows[number];
}

describe("modulesOf", () => {
  it("limite le client au module commande", () => {
    expect(modulesOf("client")).toEqual(["commande"]);
  });

  it("donne à l'entrepôt préparation, stock et livraison", () => {
    expect(modulesOf("entrepot")).toEqual(["preparation", "stock", "livraison"]);
  });

  it("donne à l'admin tous les modules", () => {
    expect(modulesOf("admin")).toEqual([
      "commande",
      "preparation",
      "securite",
      "livraison",
      "stock",
      "rapports",
    ]);
  });
});

describe("moduleBadge", () => {
  const orders: Orders = [
    order(OrderStatus.todo),
    order(OrderStatus.picking),
    order(OrderStatus.ready),
    order(OrderStatus.ready, { id: "clr1" }),
    order(OrderStatus.delivered),
  ];
  const stock: StockRows = [stockRow("ok"), stockRow("critique"), stockRow("rupture")];

  it("compte les commandes à préparer (todo + picking)", () => {
    expect(moduleBadge("preparation", orders, undefined)).toBe(2);
  });

  it("compte les commandes prêtes non contrôlées pour la sécurité", () => {
    expect(moduleBadge("securite", orders, undefined)).toBe(1);
  });

  it("compte toutes les commandes prêtes pour la livraison", () => {
    expect(moduleBadge("livraison", orders, undefined)).toBe(2);
  });

  it("compte les références hors niveau OK pour le stock", () => {
    expect(moduleBadge("stock", undefined, stock)).toBe(2);
  });

  it("renvoie 0 pour un module sans pastille", () => {
    expect(moduleBadge("commande", orders, stock)).toBe(0);
    expect(moduleBadge("rapports", orders, stock)).toBe(0);
  });

  it("renvoie 0 quand les données ne sont pas encore chargées", () => {
    expect(moduleBadge("preparation", undefined, undefined)).toBe(0);
    expect(moduleBadge("stock", undefined, undefined)).toBe(0);
  });
});
