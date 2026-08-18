"use client";

import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import type { Product } from "@/lib/gnanam/types";
import { CAT_COLORS, PROMO_IDS } from "@/lib/gnanam/data";
import { eur, unitPriceLabel } from "@/lib/gnanam/utils";
import { ProductImage } from "@/components/gnanam/product-image";
import { useGnanamStore } from "@/lib/gnanam/store";

export function ProductCard({ product }: { product: Product }) {
  const { state, dispatch } = useGnanamStore();
  const qty = state.cart[product.id] || 0;
  const [, tileFg] = CAT_COLORS[product.cat];
  const isPromo = PROMO_IDS.includes(product.id);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--gnanam-border-softer)] bg-white shadow-[0_2px_10px_rgba(14,58,66,.05)]">
      <div className="relative h-[120px]">
        <ProductImage
          product={product}
          sizes="(min-width: 1024px) 240px, 50vw"
          className="h-full w-full"
        />
        <span
          className="absolute top-2.5 left-2.5 rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide uppercase"
          style={{ color: tileFg }}
        >
          {product.cat}
        </span>
        {isPromo && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-[var(--gnanam-error)] px-2.5 py-1 text-[10.5px] font-extrabold text-white">
            PROMO
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5 pb-3.5">
        <div className="text-[14.5px] leading-tight font-bold">{product.name}</div>
        <div className="text-[12.5px] text-[var(--gnanam-gray-400)]">
          {product.unit} · réf. {product.id.toUpperCase().replace("P", "GE-10")}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <div className="text-[17px] font-extrabold text-[var(--gnanam-teal-900)]">{eur(product.price)}</div>
          <div className="text-[11px] text-[var(--gnanam-gray-400)]">HT · {unitPriceLabel(product.unit, product.price)}</div>
        </div>
        <div className="mt-2.5">
          {qty > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => dispatch({ type: "SUB_FROM_CART", pid: product.id })}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px] border-[var(--gnanam-border)] bg-white font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-cream)]"
              >
                <Minus size={16} />
              </button>
              <div className="flex-1 text-center text-[15px] font-extrabold">{qty}</div>
              <button
                onClick={() => dispatch({ type: "ADD_TO_CART", pid: product.id })}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[var(--gnanam-gold)] font-extrabold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-gold-light)]"
              >
                <Plus size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => dispatch({ type: "ADD_TO_CART", pid: product.id })}
              className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--gnanam-teal-900)] text-[13.5px] font-bold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)]"
            >
              <Plus size={16} strokeWidth={2.5} />
              Ajouter au panier
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
