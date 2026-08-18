import type { AppState, ModuleId, RoleId } from "./types";
import { ROLES } from "./data";
import { stockRows } from "./stock";

/** Modules accessibles au profil connecté, dans l'ordre du menu. */
export function modulesOf(role: RoleId): ModuleId[] {
  return ROLES[role].modules;
}

/** Pastille du menu : nombre d'éléments en attente pour le module. */
export function moduleBadge(state: AppState, module: ModuleId): number {
  switch (module) {
    case "preparation":
      return state.orders.filter((o) => o.status === "todo" || o.status === "picking").length;
    case "securite":
      return state.orders.filter((o) => o.status === "ready" && !o.security).length;
    case "livraison":
      return state.orders.filter((o) => o.status === "ready").length;
    case "stock":
      return stockRows(state.stock, state.orders).filter((r) => r.level !== "ok").length;
    default:
      return 0;
  }
}
