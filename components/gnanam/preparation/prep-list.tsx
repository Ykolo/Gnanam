"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { api } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/client";
import { PREP_STATUS } from "@/lib/gnanam/data";
import { zonesOf, todayLabel, plural } from "@/lib/gnanam/utils";
import { SETTINGS } from "@/lib/gnanam/settings";
import { LineStatus } from "@/lib/generated/prisma/enums";

type Order = RouterOutputs["orders"]["today"][number];

export function PrepList({ orders, isLoading }: { orders: Order[]; isLoading: boolean }) {
  const { dispatch } = useGnanamStore();
  const utils = api.useUtils();
  const start = api.preparation.start.useMutation({ onSuccess: () => utils.orders.today.invalidate() });

  const list = orders.filter((o) => o.status !== "delivered");

  const openOrder = (id: string) => {
    dispatch({ type: "OPEN_PREP_ORDER", id });
    start.mutate({ orderId: id });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28">
      <div className="text-[23px] font-extrabold tracking-tight">Préparation des commandes</div>
      <div className="mt-0.5 mb-4.5 text-[13.5px] text-[var(--gnanam-gray-600)]">
        Entrepôt Rungis — {todayLabel()}
      </div>
      <div className="flex max-w-[680px] flex-col gap-3">
        {list.map((o) => {
          const [statusLabel, statusBg, statusFg] = PREP_STATUS[o.status];
          const done = o.lines.filter((l) => l.status !== LineStatus.pending).length;
          const pct = Math.round((done / o.lines.length) * 100);
          const canStart = o.status !== "ready";
          const ctaLabel = o.status === "picking" ? "Reprendre la préparation" : "Commencer la préparation";
          return (
            <div
              key={o.id}
              className="flex flex-col gap-3 rounded-2xl bg-white p-4.5 shadow-[0_2px_10px_rgba(14,58,66,.05)]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[160px] flex-1">
                  <div className="text-base font-bold">{o.customer.name}</div>
                  <div className="mt-0.5 text-[12.5px] text-[var(--gnanam-gray-400)]">
                    CMD-{o.seq} · {plural(o.lines.length, "ligne")} ·{" "}
                    {plural(zonesOf(o.lines, SETTINGS.groupByZone).length, "caddie")}
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1.5 text-[12.5px] font-bold"
                  style={{ background: statusBg, color: statusFg }}
                >
                  {statusLabel}
                </span>
              </div>
              {o.status === "picking" && (
                <div className="h-[7px] overflow-hidden rounded-full bg-[var(--gnanam-border-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--gnanam-gold)] transition-[width]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              {canStart && (
                <button
                  onClick={() => openOrder(o.id)}
                  className="self-start rounded-[11px] bg-[var(--gnanam-teal-900)] px-5 py-3 text-sm font-semibold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)]"
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          );
        })}
        {!isLoading && list.length === 0 && (
          <div className="rounded-2xl bg-white px-5 py-8 text-center text-[14.5px] text-[var(--gnanam-gray-400)]">
            Aucune commande à préparer aujourd&apos;hui.
          </div>
        )}
      </div>
    </div>
  );
}
