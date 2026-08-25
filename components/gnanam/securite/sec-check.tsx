"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, ShieldCheck, X } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";
import { api } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/client";
import { zonesOf } from "@/lib/gnanam/utils";
import { ZONE_SHORT_LABELS } from "@/lib/gnanam/data";
import { SETTINGS } from "@/lib/gnanam/settings";
import { useIsDesktop } from "@/lib/gnanam/use-is-desktop";
import type { Zone } from "@/lib/generated/prisma/enums";

type Order = RouterOutputs["orders"]["today"][number];

export function SecCheck({ order }: { order: Order }) {
  const { state, dispatch } = useGnanamStore();
  const isDesktop = useIsDesktop();
  const utils = api.useUtils();
  const release = api.securite.release.useMutation({
    onSuccess: () => {
      utils.orders.today.invalidate();
      dispatch({ type: "BACK_TO_SEC_LIST" });
    },
  });

  /** Caddie de rattachement de chaque ligne, pour guider l'agent au poste. */
  const caddieOf: Record<number, string> = {};
  zonesOf(order.lines, SETTINGS.groupByZone).forEach((g, gi) => {
    g.idxs.forEach((i) => {
      caddieOf[i] = `Caddie ${gi + 1} · ${ZONE_SHORT_LABELS[g.zone as Zone] ?? g.zone}`;
    });
  });

  const total = order.lines.length;
  const done = order.lines.filter((l) => state.secChecked[l.id]).length;
  const pct = Math.round((done / total) * 100);
  const allOk = done === total && !order.clearance;

  /** Saisie du motif : un écart n'est enregistrable qu'accompagné d'une explication. */
  const [gapOpen, setGapOpen] = useState(false);
  const [note, setNote] = useState("");
  const noteTooShort = note.trim().length < 3;

  const submitGap = () => {
    if (noteTooShort) return;
    release.mutate({ orderId: order.id, conform: false, note: note.trim() });
  };

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
            <div className="text-[17px] font-bold">{order.customer.name}</div>
            <div className="text-[12.5px] text-[var(--gnanam-muted-teal)]">CMD-{order.seq} · contrôle sortie</div>
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
            const p = l.product;
            const isOk = !!state.secChecked[l.id];
            return (
              <button
                key={l.id}
                onClick={() => dispatch({ type: "TOGGLE_SEC_LINE", key: l.id })}
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

      {!order.clearance && (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center px-5"
          style={{ bottom: isDesktop ? 22 : 86 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto flex w-full max-w-[520px] flex-col gap-2.5"
          >
            {gapOpen ? (
              <div className="rounded-2xl bg-white p-4 shadow-[0_14px_34px_rgba(14,58,66,.22)]">
                <label
                  htmlFor="sec-gap-note"
                  className="mb-2 block text-[13px] font-extrabold tracking-wide text-[var(--gnanam-amber)] uppercase"
                >
                  Motif de l&apos;écart
                </label>
                <textarea
                  id="sec-gap-note"
                  autoFocus
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex. : 1 carton de tilapia manquant au caddie 2"
                  className="w-full resize-none rounded-xl border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3 py-2.5 text-[14.5px] outline-none focus:border-[var(--gnanam-amber)]"
                />
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setGapOpen(false);
                      setNote("");
                    }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-[var(--gnanam-border)] bg-white text-[var(--gnanam-gray-600)] hover:bg-[var(--gnanam-cream)]"
                    aria-label="Annuler le signalement"
                  >
                    <X size={18} strokeWidth={2.4} />
                  </button>
                  <button
                    onClick={submitGap}
                    disabled={noteTooShort || release.isPending}
                    className="flex min-h-12 flex-1 items-center justify-center gap-2.5 rounded-xl bg-[var(--warning)] px-4 text-[15px] font-bold text-white disabled:opacity-50"
                  >
                    <AlertTriangle size={19} strokeWidth={2.5} />
                    {release.isPending ? "Enregistrement…" : "Enregistrer l'écart et laisser sortir"}
                  </button>
                </div>
                {release.isError && (
                  <div className="mt-2 text-center text-[13px] font-semibold text-[var(--gnanam-error)]">
                    {release.error.message}
                  </div>
                )}
              </div>
            ) : (
              <>
                {allOk && (
                  <button
                    onClick={() => release.mutate({ orderId: order.id, conform: true })}
                    disabled={release.isPending}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--gnanam-success)] py-4.5 text-[16.5px] font-bold text-white shadow-[0_14px_34px_rgba(46,125,79,.4)] hover:bg-[var(--gnanam-success-hover)] disabled:opacity-70"
                  >
                    <ShieldCheck size={21} strokeWidth={2.6} />
                    Autoriser la sortie
                  </button>
                )}
                <button
                  onClick={() => setGapOpen(true)}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-[var(--gnanam-amber-border)] bg-[var(--gnanam-amber-bg)] py-3.5 text-[14.5px] font-bold text-[var(--gnanam-amber)] shadow-[0_8px_24px_rgba(14,58,66,.10)]"
                >
                  <AlertTriangle size={18} strokeWidth={2.4} />
                  Signaler un écart
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
