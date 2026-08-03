"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { stockRows } from "@/lib/gnanam/stock";
import { initialsOf } from "@/lib/gnanam/utils";
import { NAV_ICONS } from "./nav-icons";
import type { ModuleId } from "@/lib/gnanam/types";

export function Sidebar() {
  const { state, dispatch } = useGnanamStore();

  const prepBadge = state.orders.filter((o) => o.status === "todo" || o.status === "picking").length;
  const livBadge = state.orders.filter((o) => o.status === "ready").length;
  const stockBadge = stockRows(state.stock, state.orders).filter((r) => r.level !== "ok").length;

  const navItem = (id: ModuleId, label: string, badge: number) => {
    const Icon = NAV_ICONS[id];
    const active = state.module === id;
    return (
      <button
        key={id}
        onClick={() => dispatch({ type: "SET_MODULE", module: id })}
        className={`flex items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[14.5px] font-semibold transition-colors hover:bg-[var(--gnanam-teal-700)] hover:text-[var(--gnanam-cream-text)] ${
          active ? "bg-[var(--gnanam-gold)] text-[var(--gnanam-teal-900)]" : "bg-transparent text-[var(--gnanam-muted-teal)]"
        }`}
      >
        <Icon size={20} strokeWidth={2} />
        {label}
        {badge > 0 && (
          <span className="ml-auto rounded-full bg-[var(--gnanam-gold)] px-2 py-0.5 text-xs font-bold text-[var(--gnanam-teal-900)]">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex w-[230px] shrink-0 flex-col gap-1.5 bg-[var(--gnanam-teal-900)] p-3.5 px-3.5 text-[#EDE6D6]">
      <div className="flex items-center gap-3 px-2 pt-1.5 pb-5.5">
        <div
          className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-[22px] font-extrabold text-[var(--gnanam-teal-900)]"
          style={{ background: "linear-gradient(135deg, var(--gnanam-gold-light), var(--gnanam-gold-dark))" }}
        >
          G
        </div>
        <div>
          <div className="text-sm font-bold tracking-[3px] text-[var(--gnanam-gold-text)]">GNANAM</div>
          <div className="text-[11px] font-medium tracking-[5px] text-[var(--gnanam-muted-teal)]">EXO</div>
        </div>
      </div>

      {navItem("commande", "Commander", 0)}
      {navItem("preparation", "Préparation", prepBadge)}
      {navItem("livraison", "Livraison", livBadge)}
      {navItem("stock", "Stock dépôt", stockBadge)}

      <div className="mt-auto flex flex-col gap-2.5">
        <div className="rounded-[10px] bg-[var(--gnanam-teal-800)] p-3 text-xs leading-relaxed text-[var(--gnanam-muted-teal)]">
          <div className="mb-1 font-bold text-[var(--gnanam-gold-text)]">PWA B2B — maquette</div>
          Livraison bientôt connectée à votre TMS.
        </div>
        <div className="flex items-center gap-2.5 rounded-[10px] bg-[var(--gnanam-teal-800)] px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gnanam-gold)] text-[13px] font-extrabold text-[var(--gnanam-teal-900)]">
            {initialsOf(state.userName)}
          </div>
          <div className="min-w-0 flex-1 text-xs leading-tight">
            <div className="truncate font-bold text-[#EDE6D6]">{state.userName}</div>
            <div className="text-[var(--gnanam-muted-teal)]">Connecté</div>
          </div>
          <button
            onClick={() => dispatch({ type: "LOGOUT" })}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--gnanam-teal-700)] text-[#EDE6D6] transition-colors hover:bg-[var(--gnanam-error)] hover:text-white"
          >
            <NAV_ICONS.logout size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
