"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PackageSearch } from "lucide-react";
import { api, LIVE } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/client";
import { PREP_STATUS } from "@/lib/gnanam/data";
import { eur, plural } from "@/lib/gnanam/utils";
import { formatParisDate, formatParisTime } from "@/lib/gnanam/timezone";
import { LineStatus } from "@/lib/generated/prisma/enums";

type Order = RouterOutputs["orders"]["mine"][number];

const LINE_STATUS_LABELS: Record<LineStatus, string | null> = {
  [LineStatus.pending]: null,
  [LineStatus.done]: null,
  [LineStatus.partial]: "Partiel",
  [LineStatus.missing]: "Manquant",
};

function totalCentsOf(order: Order): number {
  return order.lines.reduce((sum, l) => sum + l.qty * l.unitPriceCents, 0);
}

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [statusLabel, statusBg, statusFg] = PREP_STATUS[order.status];
  const gaps = order.lines.filter((l) => l.status === LineStatus.partial || l.status === LineStatus.missing);

  return (
    <div
      data-testid={`commande-${order.seq}`}
      className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(14,58,66,.05)]"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base font-bold">CMD-{order.seq}</span>
            <span
              className="rounded-full px-2.5 py-1 text-[12px] font-bold"
              style={{ background: statusBg, color: statusFg }}
            >
              {statusLabel}
            </span>
            {gaps.length > 0 && (
              <span className="rounded-full bg-[var(--gnanam-amber-bg)] px-2.5 py-1 text-[12px] font-bold text-[var(--gnanam-amber)]">
                {plural(gaps.length, "écart")}
              </span>
            )}
          </div>
          <div className="mt-1 text-[12.5px] text-[var(--gnanam-gray-400)]">
            {formatParisDate(order.createdAt, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
            {plural(order.lines.length, "ligne")} · créneau {order.windowLabel}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[15px] font-extrabold text-[var(--gnanam-teal-900)]">
            {eur(totalCentsOf(order) / 100)}
          </div>
          <div className="text-[11px] text-[var(--gnanam-gray-400)]">HT</div>
        </div>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-[var(--gnanam-gray-400)]" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-[var(--gnanam-gray-400)]" />
        )}
      </button>

      {open && (
        <div className="border-t border-[var(--gnanam-border-soft)] px-4.5 py-3.5">
          <div className="flex flex-col gap-1.5">
            {order.lines.map((l) => {
              const gap = LINE_STATUS_LABELS[l.status];
              return (
                <div key={l.id} className="flex items-center gap-3 text-[13.5px]">
                  <span className="min-w-0 flex-1 truncate">{l.product.name}</span>
                  {gap && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap"
                      style={{
                        background: l.status === LineStatus.partial ? "var(--gnanam-amber-bg)" : "var(--gnanam-error-bg)",
                        color: l.status === LineStatus.partial ? "var(--gnanam-amber)" : "var(--gnanam-error)",
                      }}
                    >
                      {gap} · {l.picked}/{l.qty}
                    </span>
                  )}
                  <span className="w-12 shrink-0 text-right font-semibold text-[var(--gnanam-gray-600)]">
                    ×{l.qty}
                  </span>
                  <span className="w-20 shrink-0 text-right font-bold whitespace-nowrap">
                    {eur((l.qty * l.unitPriceCents) / 100)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3.5 flex flex-col gap-1 border-t border-[var(--gnanam-border-soft)] pt-3 text-[12.5px] text-[var(--gnanam-gray-600)]">
            <div>Livré à : {order.address}</div>
            {order.deliveredAt && <div>Livraison confirmée le {formatParisDate(order.deliveredAt)} à {formatParisTime(order.deliveredAt)}</div>}
            {order.clearance && (
              <div>
                Contrôle sortie : {order.clearance.conform ? "conforme" : "écart signalé"}
                {order.clearance.note ? ` — ${order.clearance.note}` : ""}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoriqueModule() {
  const { data: orders, isLoading } = api.orders.mine.useQuery(undefined, LIVE);
  const list = orders ?? [];

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28">
      <div className="text-[23px] font-extrabold tracking-tight">Mes commandes</div>
      <div className="mt-0.5 mb-4.5 text-[13.5px] text-[var(--gnanam-gray-600)]">
        Historique de votre établissement — cliquez sur une commande pour voir le détail.
      </div>

      <div className="flex max-w-[680px] flex-col gap-3">
        {list.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}

        {!isLoading && list.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-5 py-12 text-center text-[var(--gnanam-gray-400)]">
            <PackageSearch size={40} strokeWidth={1.6} className="text-[var(--gnanam-neutral-border)]" />
            <div className="text-[14.5px]">
              Aucune commande pour le moment.
              <br />
              Vos commandes apparaîtront ici dès la première validation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
