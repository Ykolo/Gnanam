"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { NAV_ICONS } from "./nav-icons";
import type { ModuleId } from "@/lib/gnanam/types";

export function MobileNav() {
  const { state, dispatch } = useGnanamStore();

  const navItem = (id: ModuleId, label: string) => {
    const Icon = NAV_ICONS[id];
    const active = state.module === id;
    return (
      <button
        key={id}
        onClick={() => dispatch({ type: "SET_MODULE", module: id })}
        className={`flex min-h-[52px] flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[11.5px] font-semibold ${
          active ? "bg-[var(--gnanam-gold)] text-[var(--gnanam-teal-900)]" : "bg-transparent text-[var(--gnanam-muted-teal)]"
        }`}
      >
        <Icon size={21} strokeWidth={2} />
        {label}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex gap-1.5 bg-[var(--gnanam-teal-900)] px-2.5 pt-2"
      style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}
    >
      {navItem("commande", "Commander")}
      {navItem("preparation", "Préparation")}
      {navItem("livraison", "Livraison")}
      <button
        onClick={() => dispatch({ type: "LOGOUT" })}
        className="flex min-h-[52px] shrink-0 flex-col items-center gap-0.5 rounded-xl bg-transparent px-2.5 py-2 text-[11.5px] font-semibold text-[var(--gnanam-muted-teal)]"
      >
        <NAV_ICONS.logout size={21} strokeWidth={2} />
        Quitter
      </button>
    </div>
  );
}
