"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, PackagePlus, Check, X } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";
import { findProduct, ZONE_COLORS } from "@/lib/gnanam/data";
import { LEVEL_STYLES, type StockRow as StockRowData } from "@/lib/gnanam/stock";

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="min-w-[74px] flex-1 rounded-[10px] bg-[var(--gnanam-cream-card)] px-2.5 py-2 text-center">
      <div className="text-[10.5px] font-bold tracking-wide text-[var(--gnanam-gray-400)] uppercase">{label}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="text-[17px] font-extrabold"
        style={{ color: color ?? "var(--gnanam-teal-900)" }}
      >
        {value}
      </motion.div>
    </div>
  );
}

export function StockRow({ row }: { row: StockRowData }) {
  const { dispatch } = useGnanamStore();
  const [receiving, setReceiving] = useState(false);
  const [input, setInput] = useState("");

  const p = findProduct(row.pid);
  const [zoneBg, zoneFg] = ZONE_COLORS[p.zone];
  const level = LEVEL_STYLES[row.level];
  // 100 % de la barre = deux fois le seuil de réappro, soit un stock confortable.
  const pct = Math.max(0, Math.min(100, Math.round((row.available / Math.max(1, row.min * 2)) * 100)));

  const confirmReception = () => {
    const qty = parseInt(input, 10);
    if (Number.isFinite(qty) && qty > 0) dispatch({ type: "RECEIVE_STOCK", pid: row.pid, qty });
    setInput("");
    setReceiving(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--gnanam-border-softer)] bg-white p-3.5 shadow-[0_2px_10px_rgba(14,58,66,.05)]">
      <div className="flex flex-wrap items-start gap-2.5">
        <div className="min-w-[150px] flex-1">
          <div className="text-[14.5px] leading-tight font-bold">{p.name}</div>
          <div className="mt-0.5 text-[12.5px] text-[var(--gnanam-gray-400)]">
            {p.unit} · réf. {p.id.toUpperCase().replace("P", "GE-10")}
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide uppercase"
          style={{ background: zoneBg, color: zoneFg }}
        >
          {p.zone}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap"
          style={{ background: level.bg, color: level.fg }}
        >
          {level.label}
        </span>
      </div>

      <div className="flex gap-2">
        <Stat label="Physique" value={row.qty} />
        <Stat label="Réservé" value={row.reserved} color="var(--gnanam-gray-600)" />
        <Stat label="Disponible" value={row.available} color={level.fg} />
      </div>

      <div>
        <div className="h-[7px] overflow-hidden rounded-full bg-[var(--gnanam-border-soft)]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${pct}%`, background: level.bar }}
          />
        </div>
        <div className="mt-1.5 text-[11.5px] text-[var(--gnanam-gray-400)]">
          Seuil de réappro : {row.min} colis
          {row.available < row.min && (
            <span className="font-bold" style={{ color: level.fg }}>
              {" "}
              · commander {row.min * 2 - row.available} colis
            </span>
          )}
        </div>
      </div>

      {receiving ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2"
        >
          <input
            autoFocus
            type="number"
            min={1}
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmReception();
              if (e.key === "Escape") setReceiving(false);
            }}
            placeholder="Colis reçus"
            aria-label={`Colis reçus pour ${p.name}`}
            className="min-h-11 min-w-0 flex-1 rounded-[10px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3 text-sm font-semibold outline-none focus:border-[var(--gnanam-gold)]"
          />
          <button
            onClick={confirmReception}
            aria-label="Valider la réception"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--gnanam-success)] text-white hover:bg-[var(--gnanam-success-hover)]"
          >
            <Check size={18} strokeWidth={2.6} />
          </button>
          <button
            onClick={() => setReceiving(false)}
            aria-label="Annuler la réception"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[var(--gnanam-border)] bg-white text-[var(--gnanam-gray-600)] hover:bg-[var(--gnanam-cream)]"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </motion.div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: "ADJUST_STOCK", pid: row.pid, delta: -1 })}
            disabled={row.qty === 0}
            aria-label={`Retirer un colis de ${p.name}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[var(--gnanam-border)] bg-white font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-cream)] disabled:opacity-40"
          >
            <Minus size={16} strokeWidth={2.6} />
          </button>
          <button
            onClick={() => dispatch({ type: "ADJUST_STOCK", pid: row.pid, delta: 1 })}
            aria-label={`Ajouter un colis à ${p.name}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[var(--gnanam-border)] bg-white font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-cream)]"
          >
            <Plus size={16} strokeWidth={2.6} />
          </button>
          <button
            onClick={() => setReceiving(true)}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[var(--gnanam-teal-900)] px-3 text-[13.5px] font-bold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)]"
          >
            <PackagePlus size={17} strokeWidth={2.2} />
            Réception
          </button>
        </div>
      )}
    </div>
  );
}
