"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";
import { findProduct } from "@/lib/gnanam/data";
import { zonesOf } from "@/lib/gnanam/utils";
import { SETTINGS } from "@/lib/gnanam/settings";
import { useIsDesktop } from "@/lib/gnanam/use-is-desktop";

export function SecCheck() {
  const { state, dispatch } = useGnanamStore();
  const isDesktop = useIsDesktop();
  const order = state.orders.find((o) => o.id === state.secOrderId);
  if (!order) return null;

  /** Caddie de rattachement de chaque ligne, pour guider l'agent au poste. */
  const caddieOf: Record<number, string> = {};
  zonesOf(order, SETTINGS.groupByZone).forEach((g, gi) => {
    g.idxs.forEach((i) => {
      caddieOf[i] = `Caddie ${gi + 1} · ${g.zone}`;
    });
  });

  const total = order.lines.length;
  const done = order.lines.filter((_, i) => state.secChecked[`${order.id}-${i}`]).length;
  const pct = Math.round((done / total) * 100);
  const allOk = done === total && !order.security;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="bg-[var(--gnanam-teal-900)] px-6 pt-4 pb-4.5 text-[#EDE6D6]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: "BACK_TO_SEC_LIST" })}
            aria-label="Retour"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[var(--gnanam-teal-700)] text-[#EDE6D6] hover:bg-[var(--gnanam-teal-600)]"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-bold">{order.client}</div>
            <div className="text-[12.5px] text-[var(--gnanam-muted-teal)]">{order.id} · contrôle sortie</div>
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-3">
          <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-[var(--gnanam-teal-700)]">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--gnanam-gold), var(--gnanam-gold-text))",
              }}
            />
          </div>
          <div className="text-[13.5px] font-bold whitespace-nowrap text-[var(--gnanam-gold-text)]">
            {done} / {total} vérifiés
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
        <div className="flex max-w-[680px] flex-col gap-2">
          {order.lines.map((l, i) => {
            const p = findProduct(l.pid);
            const key = `${order.id}-${i}`;
            const isOk = !!state.secChecked[key];
            return (
              <button
                key={key}
                onClick={() => dispatch({ type: "TOGGLE_SEC_LINE", key })}
                className="flex w-full items-center gap-4 rounded-[14px] border-[1.5px] px-4 py-3.5 text-left transition-colors"
                style={{
                  background: isOk ? "#F0F7F1" : "#fff",
                  borderColor: isOk ? "var(--gnanam-success-border)" : "var(--gnanam-border-soft)",
                }}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[2.5px]"
                  style={{
                    borderColor: isOk ? "var(--gnanam-success)" : "var(--gnanam-neutral-border)",
                    background: isOk ? "var(--gnanam-success)" : "#fff",
                  }}
                >
                  {isOk && <Check size={24} strokeWidth={3} className="text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[19px] leading-tight font-extrabold tracking-tight">
                    {l.picked} × {p.name}
                  </span>
                  <span className="mt-0.5 block text-[13.5px] text-[var(--gnanam-gray-600)]">
                    {p.unit} · {caddieOf[i] ?? "—"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {allOk && (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center px-5"
          style={{ bottom: isDesktop ? 22 : 86 }}
        >
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => dispatch({ type: "RELEASE_SEC_ORDER" })}
            className="pointer-events-auto flex w-full max-w-[520px] items-center justify-center gap-3 rounded-2xl bg-[var(--gnanam-success)] py-4.5 text-[16.5px] font-bold text-white shadow-[0_14px_34px_rgba(46,125,79,.4)] hover:bg-[var(--gnanam-success-hover)]"
          >
            <ShieldCheck size={21} strokeWidth={2.6} />
            Autoriser la sortie
          </motion.button>
        </div>
      )}
    </div>
  );
}
