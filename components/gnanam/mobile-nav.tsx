"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { useSession } from "@/lib/gnanam/session";
import { useLogout } from "@/lib/gnanam/use-logout";
import { MODULE_SHORT_LABELS } from "@/lib/gnanam/data";
import { modulesOf } from "@/lib/gnanam/nav";
import { NAV_ICONS } from "./nav-icons";
import type { ModuleId } from "@/lib/gnanam/types";

export function MobileNav() {
  const { state, dispatch } = useGnanamStore();
  const session = useSession();
  const { logout, pending } = useLogout();

  const navItem = (id: ModuleId) => {
    const Icon = NAV_ICONS[id];
    const active = state.module === id;
    return (
      <button
        key={id}
        onClick={() => dispatch({ type: "SET_MODULE", module: id })}
        className={`flex min-h-[52px] flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-2 text-[11px] font-semibold whitespace-nowrap ${
          active ? "bg-[var(--gnanam-gold)] text-[var(--gnanam-teal-900)]" : "bg-transparent text-[var(--gnanam-muted-teal)]"
        }`}
      >
        <Icon size={21} strokeWidth={2} className="shrink-0" />
        {MODULE_SHORT_LABELS[id]}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex gap-1.5 bg-[var(--gnanam-teal-900)] px-2.5 pt-2"
      style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}
    >
      {modulesOf(session.role).map(navItem)}
      <button
        onClick={logout}
        disabled={pending}
        className="flex min-h-[52px] shrink-0 flex-col items-center gap-0.5 rounded-xl bg-transparent px-1.5 py-2 text-[11px] font-semibold whitespace-nowrap text-[var(--gnanam-muted-teal)]"
      >
        <NAV_ICONS.logout size={21} strokeWidth={2} />
        Quitter
      </button>
    </div>
  );
}
