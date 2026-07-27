"use client";

import { useMemo } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useGnanamStore } from "@/lib/gnanam/store";
import { PRODUCTS, CATEGORY_NAMES } from "@/lib/gnanam/data";
import { normalize } from "@/lib/gnanam/utils";
import { ProductCard } from "./product-card";

export function Catalog() {
  const { state, dispatch } = useGnanamStore();

  const cartCount = Object.values(state.cart).reduce((a, q) => a + q, 0);

  const products = useMemo(() => {
    const q = normalize(state.search.trim());
    return PRODUCTS.filter(
      (p) =>
        (state.cat === "Tous" || p.cat === state.cat) &&
        (!q || normalize(p.name).includes(q) || normalize(p.cat).includes(q))
    );
  }, [state.cat, state.search]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3.5 border-b border-[var(--gnanam-border-soft)] bg-white px-6 py-3.5 shadow-[0_1px_0_rgba(14,58,66,.04)]">
        <div className="shrink-0">
          <div className="text-[19px] font-extrabold tracking-tight text-[var(--gnanam-teal-900)]">Catalogue</div>
          <div className="text-xs text-[var(--gnanam-gray-400)]">Livraison J+1 avant 12h</div>
        </div>
        <div className="flex min-w-[180px] flex-1 items-center gap-2.5 rounded-xl border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 focus-within:border-[var(--gnanam-gold)]">
          <Search size={17} className="text-[var(--gnanam-gray-400)]" strokeWidth={2.2} />
          <input
            value={state.search}
            onChange={(e) => dispatch({ type: "SET_FIELD", field: "search", value: e.target.value })}
            type="text"
            placeholder="Rechercher un produit…"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--gnanam-ink)] outline-none placeholder:text-[var(--gnanam-gray-400)]"
          />
        </div>
        <button
          onClick={() => dispatch({ type: "TOGGLE_CART" })}
          className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[var(--gnanam-teal-900)] px-4 text-sm font-bold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)]"
        >
          <ShoppingCart size={19} strokeWidth={2} />
          Panier
          {cartCount > 0 && (
            <span className="rounded-full bg-[var(--gnanam-gold)] px-2 py-0.5 text-[12.5px] font-extrabold text-[var(--gnanam-teal-900)]">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="px-6 pt-3.5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_NAMES.map((name) => {
            const active = state.cat === name;
            return (
              <button
                key={name}
                onClick={() => dispatch({ type: "SET_CATEGORY", cat: name })}
                className={`shrink-0 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap ${
                  active
                    ? "border-[var(--gnanam-teal-900)] bg-[var(--gnanam-teal-900)] text-[var(--gnanam-cream-text)]"
                    : "border-[var(--gnanam-border)] bg-white text-[#40565B]"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
        <div className="mt-2.5 mb-0.5 text-[12.5px] text-[var(--gnanam-gray-400)]">
          {products.length} {products.length > 1 ? "produits" : "produit"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-2.5 pb-10">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <div className="py-12 text-center text-[14.5px] text-[var(--gnanam-gray-400)]">
            Aucun produit ne correspond à « {state.search} ».
          </div>
        )}
      </div>
    </div>
  );
}
