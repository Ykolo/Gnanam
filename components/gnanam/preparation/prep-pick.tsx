"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, ScanLine, Minus, Plus, MoreHorizontal } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";
import { findProduct, ZONE_COLORS, ZONE_LABELS } from "@/lib/gnanam/data";
import { zonesOf, eur } from "@/lib/gnanam/utils";
import { SETTINGS } from "@/lib/gnanam/settings";
import { useIsDesktop } from "@/lib/gnanam/use-is-desktop";
import type { Order, OrderLine, Zone } from "@/lib/gnanam/types";

function LineRow({ order, idx, line }: { order: Order; idx: number; line: OrderLine }) {
  const { state, dispatch } = useGnanamStore();
  const p = findProduct(line.pid);
  const key = order.id + "-" + idx;
  const isDone = line.status === "done";
  const isPartial = line.status === "partial";
  const isMissing = line.status === "missing";
  const flagOpen = state.flagOpen === key;

  const bg = isDone ? "#F0F7F1" : isPartial ? "#FDFAF0" : isMissing ? "#FDF3F1" : "#fff";
  const border = isDone ? "#BBDCC4" : isPartial ? "#EBD9A8" : isMissing ? "#EFC4BD" : "var(--gnanam-border-soft)";
  const checkBorder = isDone
    ? "var(--gnanam-success)"
    : isPartial
      ? "var(--warning)"
      : isMissing
        ? "#D96C5F"
        : "var(--gnanam-neutral-border)";

  return (
    <div
      className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] p-3 px-3.5 transition-colors"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center gap-3.5">
        <button
          onClick={() => dispatch({ type: "TOGGLE_LINE", orderId: order.id, idx })}
          aria-label="Valider le produit"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border-[2.5px] transition-all"
          style={{ borderColor: checkBorder, background: isDone ? "var(--gnanam-success)" : "#fff" }}
        >
          {isDone && <Check size={22} strokeWidth={3} className="text-white" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className={`text-[15px] leading-tight font-bold ${isMissing ? "text-[var(--gnanam-error)]" : ""}`}>
            {p.name}
          </div>
          <div className="mt-0.5 text-[13px] text-[var(--gnanam-gray-600)]">
            {line.qty} × {p.unit.toLowerCase()}
            {SETTINGS.showPricesInPrep && <> · {eur(p.price * line.qty)} HT</>}
          </div>
        </div>
        {(isPartial || isMissing) && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
            style={{
              background: isPartial ? "var(--gnanam-amber-bg)" : "var(--gnanam-error-bg)",
              color: isPartial ? "var(--gnanam-amber)" : "var(--gnanam-error)",
            }}
          >
            {isPartial ? "Partiel" : "Manquant"}
          </span>
        )}
        <button
          onClick={() => dispatch({ type: "TOGGLE_FLAG", key })}
          aria-label="Signaler un problème"
          className="flex h-11 w-[38px] shrink-0 items-center justify-center text-[var(--gnanam-gray-400)] hover:text-[var(--gnanam-teal-900)]"
        >
          <MoreHorizontal size={19} strokeWidth={2.5} />
        </button>
      </div>

      {flagOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-wrap gap-2"
        >
          <button
            onClick={() => dispatch({ type: "SET_LINE_PARTIAL", orderId: order.id, idx })}
            className="min-h-11 rounded-[10px] border-[1.5px] border-[var(--gnanam-amber-border)] bg-[var(--gnanam-amber-bg)] px-3.5 text-[13px] font-bold text-[var(--gnanam-amber)]"
          >
            Quantité partielle
          </button>
          <button
            onClick={() => dispatch({ type: "SET_LINE_MISSING", orderId: order.id, idx })}
            className="min-h-11 rounded-[10px] border-[1.5px] border-[var(--gnanam-error-border)] bg-[var(--gnanam-error-bg)] px-3.5 text-[13px] font-bold text-[var(--gnanam-error)]"
          >
            Produit manquant
          </button>
          <button
            onClick={() => dispatch({ type: "RESET_LINE", orderId: order.id, idx })}
            className="min-h-11 rounded-[10px] border-[1.5px] border-[var(--gnanam-border)] bg-white px-3.5 text-[13px] font-semibold text-[var(--gnanam-gray-600)]"
          >
            Annuler
          </button>
        </motion.div>
      )}

      {isPartial && (
        <div className="flex items-center gap-2.5 rounded-[10px] bg-[var(--gnanam-amber-bg)] px-3 py-2.5">
          <span className="text-[13px] font-semibold text-[var(--gnanam-amber)]">Quantité préparée :</span>
          <button
            onClick={() => dispatch({ type: "DEC_PICKED", orderId: order.id, idx })}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border-[1.5px] border-[var(--gnanam-amber-border)] bg-white font-extrabold text-[var(--gnanam-amber)]"
          >
            <Minus size={16} />
          </button>
          <span className="text-[15px] font-extrabold text-[var(--gnanam-amber)]">
            {line.picked} / {line.qty}
          </span>
          <button
            onClick={() => dispatch({ type: "INC_PICKED", orderId: order.id, idx })}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border-[1.5px] border-[var(--gnanam-amber-border)] bg-white font-extrabold text-[var(--gnanam-amber)]"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export function PrepPick() {
  const { state, dispatch } = useGnanamStore();
  const isDesktop = useIsDesktop();
  const order = state.orders.find((o) => o.id === state.activeOrderId);
  if (!order) return null;

  const groups = zonesOf(order, SETTINGS.groupByZone);
  const totalCount = order.lines.length;
  const doneCount = order.lines.filter((l) => l.status !== "pending").length;
  const progressPct = Math.round((doneCount / totalCount) * 100);
  const allResolved = doneCount === totalCount && order.status === "picking";

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="bg-[var(--gnanam-teal-900)] px-6 pt-4 pb-4.5 text-[#EDE6D6]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: "BACK_TO_PREP_LIST" })}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[var(--gnanam-teal-700)] text-[#EDE6D6] hover:bg-[var(--gnanam-teal-600)]"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-bold">{order.client}</div>
            <div className="text-[12.5px] text-[var(--gnanam-muted-teal)]">
              {order.id} · {groups.length} caddies à constituer
            </div>
          </div>
          {SETTINGS.scanEnabled && (
            <button className="flex min-h-11 items-center gap-2 rounded-[10px] bg-[var(--gnanam-gold)] px-3.5 text-[13.5px] font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-gold-light)]">
              <ScanLine size={17} strokeWidth={2.2} />
              Scanner
            </button>
          )}
        </div>
        <div className="mt-3.5 flex items-center gap-3">
          <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-[var(--gnanam-teal-700)]">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, var(--gnanam-gold), var(--gnanam-gold-text))" }}
            />
          </div>
          <div className="text-[13.5px] font-bold whitespace-nowrap text-[var(--gnanam-gold-text)]">
            {doneCount} / {totalCount} produits
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
        <div className="flex max-w-[680px] flex-col gap-4.5">
          {groups.map((g, gi) => {
            const [tagBg, tagFg] = ZONE_COLORS[g.zone as Zone] || ["#EEE9DC", "#5B6E72"];
            const zoneName = ZONE_LABELS[g.zone as Zone] || g.zone;
            return (
              <div key={g.zone}>
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className="rounded-[7px] px-2.5 py-1 text-xs font-extrabold tracking-wide uppercase"
                    style={{ background: tagBg, color: tagFg }}
                  >
                    Caddie {gi + 1}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--gnanam-gray-600)]">
                    {zoneName} · {g.idxs.length} produits
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {g.idxs.map((i) => (
                    <LineRow key={i} order={order} idx={i} line={order.lines[i]} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {allResolved && (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center px-5"
          style={{ bottom: isDesktop ? 22 : 86 }}
        >
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => dispatch({ type: "FINISH_ORDER" })}
            className="pointer-events-auto flex w-full max-w-[520px] items-center justify-center gap-3 rounded-2xl bg-[var(--gnanam-success)] py-4.5 text-base font-bold text-white shadow-[0_14px_34px_rgba(46,125,79,.4)] hover:bg-[var(--gnanam-success-hover)]"
          >
            <Check size={20} strokeWidth={3} />
            Commande prête pour livraison
          </motion.button>
        </div>
      )}
    </div>
  );
}
