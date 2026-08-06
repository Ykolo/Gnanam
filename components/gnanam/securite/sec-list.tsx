"use client";

import { Search, ScanLine } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";
import { zonesOf, normalize, plural } from "@/lib/gnanam/utils";
import { SETTINGS } from "@/lib/gnanam/settings";

export function SecList() {
  const { state, dispatch } = useGnanamStore();

  const q = normalize(state.secSearch.trim());
  const list = state.orders.filter(
    (o) =>
      (o.status === "ready" || o.status === "delivered") &&
      (!q || normalize(o.id).includes(q) || normalize(o.client).includes(q))
  );

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28">
      <div className="text-[23px] font-extrabold tracking-tight">Contrôle sortie</div>
      <div className="mt-0.5 mb-4 text-[13.5px] text-[var(--gnanam-gray-600)]">
        Poste sécurité — validez le caddie avant la sortie, sans repasser en caisse.
      </div>

      <div className="flex max-w-[680px] flex-col gap-3.5">
        <div className="flex flex-wrap gap-2.5">
          <div className="flex min-w-[180px] flex-1 items-center gap-2.5 rounded-xl border-[1.5px] border-[var(--gnanam-border-strong)] bg-white px-3.5">
            <Search size={17} strokeWidth={2.2} className="shrink-0 text-[var(--gnanam-gray-400)]" />
            <input
              value={state.secSearch}
              onChange={(e) => dispatch({ type: "SET_SEC_SEARCH", value: e.target.value })}
              type="text"
              placeholder="N° de commande ou client"
              className="min-w-0 flex-1 border-none bg-transparent py-3.5 text-[14.5px] outline-none"
            />
          </div>
          <button className="flex min-h-12 items-center gap-2 rounded-xl bg-[var(--gnanam-gold)] px-4.5 text-sm font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-gold-light)]">
            <ScanLine size={18} strokeWidth={2.2} />
            Scanner le caddie
          </button>
        </div>

        {list.map((o) => {
          const controlled = !!o.security;
          return (
            <div
              key={o.id}
              className="flex flex-col gap-3 rounded-2xl bg-white p-4.5 shadow-[0_2px_10px_rgba(14,58,66,.05)]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[160px] flex-1">
                  <div className="text-base font-bold">{o.client}</div>
                  <div className="mt-0.5 text-[12.5px] text-[var(--gnanam-gray-400)]">
                    {o.id} · {plural(o.lines.length, "produit")} ·{" "}
                    {plural(zonesOf(o, SETTINGS.groupByZone).length, "caddie")}
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1.5 text-[12.5px] font-bold"
                  style={{
                    background: controlled ? "var(--gnanam-success-bg)" : "var(--gnanam-amber-bg)",
                    color: controlled ? "var(--gnanam-success)" : "var(--gnanam-amber)",
                  }}
                >
                  {controlled ? `Sortie autorisée · ${o.security!.at}` : "À contrôler"}
                </span>
              </div>
              {!controlled && (
                <button
                  onClick={() => dispatch({ type: "OPEN_SEC_ORDER", id: o.id })}
                  className="min-h-12 self-start rounded-[11px] bg-[var(--gnanam-teal-900)] px-5 text-[14.5px] font-bold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)]"
                >
                  Contrôler le caddie
                </button>
              )}
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="rounded-2xl bg-white px-5 py-8 text-center text-[14.5px] text-[var(--gnanam-gray-400)]">
            Aucun caddie en attente de contrôle.
          </div>
        )}
      </div>
    </div>
  );
}
