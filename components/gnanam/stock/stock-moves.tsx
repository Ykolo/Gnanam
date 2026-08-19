"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { api, LIVE } from "@/lib/trpc/client";
import { STOCK_MOVE_LABELS } from "@/lib/gnanam/data";
import { useLiveClock } from "@/lib/gnanam/use-live-clock";

export function StockMoves() {
  const { data: moves } = api.stock.moves.useQuery(undefined, LIVE);
  const clock = useLiveClock();

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--gnanam-border-softer)] bg-white shadow-[0_2px_10px_rgba(14,58,66,.05)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--gnanam-border-soft)] px-4 py-3.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--gnanam-success)] opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--gnanam-success)]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-bold">Mouvements en direct</div>
          <div className="text-[11.5px] text-[var(--gnanam-gray-400)]">
            Flux du dépôt {clock && <>· {clock}</>}
          </div>
        </div>
      </div>

      <div className="max-h-[460px] flex-1 overflow-y-auto p-2.5">
        <AnimatePresence initial={false}>
          {(moves ?? []).map((m) => {
            const isIn = m.delta > 0;
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 rounded-[12px] px-2 py-2.5"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                  style={{
                    background: isIn ? "var(--gnanam-success-bg)" : "var(--gnanam-error-bg)",
                    color: isIn ? "var(--gnanam-success)" : "var(--gnanam-error)",
                  }}
                >
                  {isIn ? <ArrowDownLeft size={17} strokeWidth={2.4} /> : <ArrowUpRight size={17} strokeWidth={2.4} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] leading-tight font-bold">{m.product.name}</div>
                  <div className="truncate text-[11.5px] text-[var(--gnanam-gray-400)]">
                    {STOCK_MOVE_LABELS[m.kind]} · {m.label}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className="text-[14px] font-extrabold"
                    style={{ color: isIn ? "var(--gnanam-success)" : "var(--gnanam-error)" }}
                  >
                    {isIn ? "+" : "−"}
                    {Math.abs(m.delta)}
                  </div>
                  <div className="text-[11px] text-[var(--gnanam-gray-400)]">
                    {m.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {(moves ?? []).length === 0 && (
          <div className="px-3 py-10 text-center text-[13.5px] text-[var(--gnanam-gray-400)]">
            Aucun mouvement enregistré aujourd&apos;hui.
          </div>
        )}
      </div>
    </div>
  );
}
