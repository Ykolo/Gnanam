"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";

export function OrderConfirmation() {
  const { state, dispatch } = useGnanamStore();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-[420px] rounded-[20px] bg-white px-9 pt-10 pb-9 text-center shadow-[0_12px_40px_rgba(14,58,66,.10)]"
      >
        <div className="mx-auto mb-4.5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gnanam-success)]">
          <Check size={30} strokeWidth={3} className="text-white" />
        </div>
        <div className="mb-2 text-[22px] font-bold">Commande envoyée</div>
        <div className="mb-1.5 text-[14.5px] leading-relaxed text-[var(--gnanam-gray-600)]">
          Votre commande <strong>{state.lastOrderId}</strong> a été transmise à l&apos;entrepôt GNANAM EXO.
        </div>
        <div className="mb-6 text-[13.5px] text-[var(--gnanam-gray-400)]">Livraison prévue demain, 6h – 12h.</div>
        <button
          onClick={() => dispatch({ type: "NEW_ORDER" })}
          className="rounded-xl bg-[var(--gnanam-teal-900)] px-6.5 py-3.5 text-[15px] font-semibold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)]"
        >
          Nouvelle commande
        </button>
      </motion.div>
    </div>
  );
}
