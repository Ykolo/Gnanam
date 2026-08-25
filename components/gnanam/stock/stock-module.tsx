"use client";

import { useMemo } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";
import { api, LIVE } from "@/lib/trpc/client";
import { CATEGORY_LABELS } from "@/lib/gnanam/data";
import { normalize, eur, todayLabel } from "@/lib/gnanam/utils";
import { useLiveClock } from "@/lib/gnanam/use-live-clock";
import { Zone } from "@/lib/generated/prisma/enums";
import type { StockFilter, StockLevel } from "@/lib/gnanam/types";
import { StockRow } from "./stock-row";
import { StockMoves } from "./stock-moves";

const FILTERS: { id: StockFilter; label: string }[] = [
  { id: "all", label: "Toutes les références" },
  { id: "alert", label: "Alertes" },
  { id: Zone.Frais, label: "Frais" },
  { id: Zone.Sec, label: "Sec" },
  { id: Zone.Surgele, label: "Surgelé" },
];

const LEVEL_RANK: Record<StockLevel, number> = { rupture: 0, critique: 1, ok: 2 };

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--gnanam-border-softer)] bg-white px-3.5 py-3 shadow-[0_2px_10px_rgba(14,58,66,.05)]">
      <div className="text-[11px] font-bold tracking-wide text-[var(--gnanam-gray-400)] uppercase">{label}</div>
      <div className="mt-1 text-[20px] font-extrabold" style={{ color: tone ?? "var(--gnanam-teal-900)" }}>
        {value}
      </div>
    </div>
  );
}

export function StockModule() {
  const { state, dispatch } = useGnanamStore();
  const clock = useLiveClock();
  const { data: rows } = api.stock.list.useQuery(undefined, LIVE);

  const all = useMemo(() => rows ?? [], [rows]);
  const ruptures = all.filter((r) => r.level === "rupture").length;
  const critiques = all.filter((r) => r.level === "critique").length;
  const value = useMemo(() => all.reduce((total, r) => total + (r.priceCents * r.quantity) / 100, 0), [all]);

  const visible = useMemo(() => {
    const q = normalize(state.stockSearch.trim());
    return all
      .filter((r) => {
        if (state.stockFilter === "alert" && r.level === "ok") return false;
        if (state.stockFilter !== "all" && state.stockFilter !== "alert" && r.zone !== state.stockFilter) return false;
        return !q || normalize(r.name).includes(q) || normalize(CATEGORY_LABELS[r.category]).includes(q);
      })
      .sort((a, b) => {
        const rank = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
        return rank !== 0 ? rank : a.name.localeCompare(b.name, "fr");
      });
  }, [all, state.stockFilter, state.stockSearch]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3.5 border-b border-[var(--gnanam-border-soft)] bg-white px-6 py-3.5 shadow-[0_1px_0_rgba(14,58,66,.04)]">
        <div className="shrink-0">
          <div className="text-[19px] font-extrabold tracking-tight text-[var(--gnanam-teal-900)]">Stock du dépôt</div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--gnanam-gray-400)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--gnanam-success)] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--gnanam-success)]" />
            </span>
            Temps réel {clock ? <>· mis à jour à {clock}</> : <>· Entrepôt Rungis</>}
          </div>
        </div>
        <div className="flex min-w-[180px] flex-1 items-center gap-2.5 rounded-xl border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 focus-within:border-[var(--gnanam-gold)]">
          <Search size={17} className="text-[var(--gnanam-gray-400)]" strokeWidth={2.2} />
          <input
            value={state.stockSearch}
            onChange={(e) => dispatch({ type: "SET_STOCK_SEARCH", value: e.target.value })}
            type="text"
            placeholder="Rechercher une référence…"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--gnanam-ink)] outline-none placeholder:text-[var(--gnanam-gray-400)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-28">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Kpi label="Références" value={String(all.length)} />
          <Kpi label="Valeur stock" value={eur(value)} />
          <Kpi
            label="Sous le seuil"
            value={String(critiques)}
            tone={critiques > 0 ? "var(--gnanam-amber)" : undefined}
          />
          <Kpi label="Ruptures" value={String(ruptures)} tone={ruptures > 0 ? "var(--gnanam-error)" : undefined} />
        </div>

        {(ruptures > 0 || critiques > 0) && (
          <button
            onClick={() => dispatch({ type: "SET_STOCK_FILTER", filter: "alert" })}
            className="mt-3 flex w-full items-center gap-2.5 rounded-[12px] border-[1.5px] border-[var(--gnanam-amber-border)] bg-[var(--gnanam-amber-bg)] px-3.5 py-3 text-left text-[13.5px] font-semibold text-[var(--gnanam-amber)] hover:brightness-[0.98]"
          >
            <AlertTriangle size={18} strokeWidth={2.3} className="shrink-0" />
            {ruptures + critiques} référence{ruptures + critiques > 1 ? "s" : ""} à réapprovisionner — voir les alertes
          </button>
        )}

        <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const active = state.stockFilter === f.id;
            const badge = f.id === "alert" ? ruptures + critiques : 0;
            return (
              <button
                key={f.id}
                onClick={() => dispatch({ type: "SET_STOCK_FILTER", filter: f.id })}
                className={`shrink-0 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap ${
                  active
                    ? "border-[var(--gnanam-teal-900)] bg-[var(--gnanam-teal-900)] text-[var(--gnanam-cream-text)]"
                    : "border-[var(--gnanam-border)] bg-white text-[#40565B]"
                }`}
              >
                {f.label}
                {badge > 0 && ` (${badge})`}
              </button>
            );
          })}
        </div>

        <div className="mt-2.5 mb-2.5 text-[12.5px] text-[var(--gnanam-gray-400)]">
          {visible.length} référence{visible.length > 1 ? "s" : ""} · Entrepôt Rungis — {todayLabel()}
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {visible.map((row) => (
              <StockRow key={row.id} row={row} />
            ))}
            {visible.length === 0 && (
              <div className="py-12 text-center text-[14.5px] text-[var(--gnanam-gray-400)]">
                Aucune référence ne correspond à ce filtre.
              </div>
            )}
          </div>

          <div className="xl:sticky xl:top-0">
            <StockMoves />
          </div>
        </div>
      </div>
    </div>
  );
}
