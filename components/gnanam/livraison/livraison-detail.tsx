"use client";

import { ArrowLeft } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";
import { ZONE_COLORS } from "@/lib/gnanam/data";
import { zonesOf } from "@/lib/gnanam/utils";
import { SETTINGS } from "@/lib/gnanam/settings";
import type { Zone } from "@/lib/gnanam/types";

export function LivraisonDetail() {
  const { state, dispatch } = useGnanamStore();
  const stop = state.orders.find((o) => o.id === state.activeStopId);
  if (!stop) return null;

  const signed = !!state.signed[stop.id];
  const caddies = zonesOf(stop, SETTINGS.groupByZone);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 bg-[var(--gnanam-teal-900)] px-6 pt-4 pb-4.5 text-[#EDE6D6]">
        <button
          onClick={() => dispatch({ type: "BACK_TO_STOPS" })}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[var(--gnanam-teal-700)] text-[#EDE6D6] hover:bg-[var(--gnanam-teal-600)]"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div>
          <div className="text-[17px] font-bold">{stop.client}</div>
          <div className="text-[12.5px] text-[var(--gnanam-muted-teal)]">{stop.address}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-10">
        <div className="flex max-w-[560px] flex-col gap-3.5">
          <div className="rounded-2xl bg-white p-4.5 shadow-[0_2px_10px_rgba(14,58,66,.05)]">
            <div className="mb-3 text-[13px] font-extrabold tracking-wide text-[var(--gnanam-gray-400)] uppercase">
              Caddies à remettre
            </div>
            <div className="flex flex-col gap-2">
              {caddies.map((g, gi) => {
                const [tagBg, tagFg] = ZONE_COLORS[g.zone as Zone] || ["#EEE9DC", "#5B6E72"];
                return (
                  <div
                    key={g.zone}
                    className="flex items-center gap-3 rounded-xl border-[1.5px] border-[var(--gnanam-border-soft)] px-3.5 py-3"
                  >
                    <span
                      className="rounded-[7px] px-2.5 py-1 text-xs font-extrabold tracking-wide uppercase"
                      style={{ background: tagBg, color: tagFg }}
                    >
                      Caddie {gi + 1}
                    </span>
                    <span className="text-sm font-semibold">{g.zone}</span>
                    <span className="ml-auto text-[13px] text-[var(--gnanam-gray-600)]">{g.idxs.length} produits</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4.5 shadow-[0_2px_10px_rgba(14,58,66,.05)]">
            <div className="mb-3 text-[13px] font-extrabold tracking-wide text-[var(--gnanam-gray-400)] uppercase">
              Preuve de livraison
            </div>
            <button
              onClick={() => dispatch({ type: "TOGGLE_SIGN" })}
              className="min-h-20 w-full rounded-xl border-2 border-dashed px-5 py-5.5 text-[14.5px] font-semibold"
              style={{
                borderColor: signed ? "var(--gnanam-success)" : "var(--gnanam-border)",
                background: signed ? "var(--gnanam-success-bg)" : "var(--gnanam-cream-card)",
                color: signed ? "var(--gnanam-success)" : "var(--gnanam-gray-600)",
              }}
            >
              {signed ? "✓ Signature client enregistrée" : "Faire signer le client"}
            </button>
          </div>

          <button
            onClick={() => dispatch({ type: "CONFIRM_DELIVERY" })}
            disabled={!signed}
            className="rounded-2xl py-4.5 text-base font-bold"
            style={{
              background: signed ? "var(--gnanam-success)" : "var(--gnanam-border)",
              color: signed ? "#fff" : "var(--gnanam-gray-400)",
              cursor: signed ? "pointer" : "not-allowed",
            }}
          >
            Confirmer la livraison
          </button>
        </div>
      </div>
    </div>
  );
}
