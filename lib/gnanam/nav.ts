import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { OrderStatus } from "@/lib/generated/prisma/enums";
import type { ModuleId, RoleId } from "./types";
import { ROLES } from "./data";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Orders = RouterOutputs["orders"]["today"];
type StockRows = RouterOutputs["stock"]["list"];

/** Modules accessibles au profil connecté, dans l'ordre du menu. */
export function modulesOf(role: RoleId): ModuleId[] {
  return ROLES[role].modules;
}

/** Pastille du menu : nombre d'éléments en attente pour le module. */
export function moduleBadge(module: ModuleId, orders: Orders | undefined, stock: StockRows | undefined): number {
  switch (module) {
    case "preparation":
      return (orders ?? []).filter((o) => o.status === OrderStatus.todo || o.status === OrderStatus.picking).length;
    case "securite":
      return (orders ?? []).filter((o) => o.status === OrderStatus.ready && !o.clearance).length;
    case "livraison":
      return (orders ?? []).filter((o) => o.status === OrderStatus.ready).length;
    case "stock":
      return (stock ?? []).filter((r) => r.level !== "ok").length;
    default:
      return 0;
  }
}
