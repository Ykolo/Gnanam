"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import type { RouterOutputs } from "@/lib/trpc/client";
import { LIV_STATUS } from "@/lib/gnanam/data";
import { zonesOf, plural } from "@/lib/gnanam/utils";
import { SETTINGS } from "@/lib/gnanam/settings";

type Order = RouterOutputs["orders"]["today"][number];

export function LivraisonList({ orders, isLoading }: { orders: Order[]; isLoading: boolean }) {
  const { dispatch } = useGnanamStore();

  const deliverable = orders.filter((o) => o.status === "ready" || o.status === "delivered");
  const inPrep = orders.filter((o) => o.status === "todo" || o.status === "picking");
  const stops = [...deliverable, ...inPrep];

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-[23px] font-extrabold tracking-tight">Tournée du jour</div>
          <div className="mt-0.5 text-[13.5px] text-[var(--gnanam-gray-600)]">
            Chauffeur : K. Sivarajah · Camion FR-482-QN
          </div>
        </div>
        <div className="rounded-full bg-[var(--gnanam-amber-bg)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--gnanam-amber)]">
          Bientôt synchronisé avec votre TMS
        </div>
      </div>

      <div className="mt-4.5 flex max-w-[680px] flex-col gap-3">
        {stops.map((o, i) => {
          const [statusLabel, statusBg, statusFg] = LIV_STATUS[o.status];
          const isDelivered = o.status === "delivered";
          const numBg = isDelivered ? "var(--gnanam-success)" : o.status === "ready" ? "var(--gnanam-teal-900)" : "var(--gnanam-border)";
          const numFg = o.status === "ready" || isDelivered ? "var(--gnanam-cream-text)" : "var(--gnanam-gray-600)";
          const canDeliver = o.status === "ready";
          return (
            <div
              key={o.id}
              data-testid={`commande-${o.seq}`}
              className="flex items-start gap-3.5 rounded-2xl bg-white p-4.5 shadow-[0_2px_10px_rgba(14,58,66,.05)]"
            >
              <div
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold"
                style={{ background: numBg, color: numFg }}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="text-base font-bold">{o.customer.name}</div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ background: statusBg, color: statusFg }}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-1 text-[13px] text-[var(--gnanam-gray-600)]">{o.address}</div>
                <div className="mt-0.5 text-[12.5px] text-[var(--gnanam-gray-400)]">
                  CMD-{o.seq} · {plural(zonesOf(o.lines, SETTINGS.groupByZone).length, "caddie")} · créneau {o.windowLabel}
                </div>
                {canDeliver && (
                  <button
                    onClick={() => dispatch({ type: "OPEN_STOP", id: o.id })}
                    className="mt-3 rounded-[11px] bg-[var(--gnanam-teal-900)] px-5 py-3 text-sm font-semibold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)]"
                  >
                    Démarrer la livraison
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!isLoading && stops.length === 0 && (
          <div className="rounded-2xl bg-white px-5 py-8 text-center text-[14.5px] text-[var(--gnanam-gray-400)]">
            Aucun arrêt sur la tournée du jour.
          </div>
        )}
      </div>
    </div>
  );
}
