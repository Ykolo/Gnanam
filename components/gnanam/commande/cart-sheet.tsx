"use client";

import { useMemo } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useGnanamStore } from "@/lib/gnanam/store";
import { findProduct } from "@/lib/gnanam/data";
import { eur } from "@/lib/gnanam/utils";
import { ProductImage } from "@/components/gnanam/product-image";

export function CartSheet() {
  const { state, dispatch } = useGnanamStore();

  const cartEntries = useMemo(
    () => Object.entries(state.cart).filter(([, q]) => q > 0),
    [state.cart]
  );
  const cartCount = cartEntries.reduce((a, [, q]) => a + q, 0);
  const cartTotal = cartEntries.reduce((a, [pid, q]) => a + findProduct(pid).price * q, 0);
  const vat = cartTotal * 0.055;
  const ttc = cartTotal * 1.055;

  return (
    <Sheet open={state.cartOpen} onOpenChange={(open) => dispatch({ type: "SET_CART_OPEN", open })}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[400px]">
        <SheetHeader className="flex-row items-center gap-3 border-b border-[var(--gnanam-border-soft)] p-5 pb-4.5">
          <SheetTitle className="text-lg font-extrabold">Mon panier</SheetTitle>
          {cartCount > 0 && (
            <span className="rounded-full bg-[var(--gnanam-cream)] px-2.5 py-0.5 text-[12.5px] font-bold text-[var(--gnanam-gray-600)]">
              {cartCount} articles
            </span>
          )}
        </SheetHeader>

        {cartEntries.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto p-5 py-3.5">
              <div className="flex flex-col gap-2.5">
                {cartEntries.map(([pid, qty]) => {
                  const p = findProduct(pid);
                  return (
                    <div
                      key={pid}
                      className="flex items-center gap-3 rounded-[13px] border border-[var(--gnanam-border-softer)] p-2.5 px-3"
                    >
                      <ProductImage
                        product={p}
                        sizes="44px"
                        className="h-11 w-11 shrink-0 rounded-[11px]"
                        fallbackClass="text-[15px]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] leading-tight font-bold">{p.name}</div>
                        <div className="mt-0.5 text-xs text-[var(--gnanam-gray-400)]">
                          {p.unit} · {eur(p.price)} HT
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <button
                            onClick={() => dispatch({ type: "SUB_FROM_CART", pid })}
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border-[1.5px] border-[var(--gnanam-border)] bg-white font-bold text-[var(--gnanam-teal-900)]"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="min-w-5 text-center text-sm font-extrabold">{qty}</span>
                          <button
                            onClick={() => dispatch({ type: "ADD_TO_CART", pid })}
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[var(--gnanam-gold)] font-extrabold text-[var(--gnanam-teal-900)]"
                          >
                            <Plus size={15} />
                          </button>
                          <button
                            onClick={() => dispatch({ type: "REMOVE_FROM_CART", pid })}
                            className="ml-auto p-1.5 text-xs font-bold text-[var(--gnanam-error)]"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-extrabold whitespace-nowrap text-[var(--gnanam-teal-900)]">
                        {eur(p.price * qty)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className="flex flex-col gap-2 border-t border-[var(--gnanam-border-soft)] bg-[var(--gnanam-cream-card)] px-5 pt-4"
              style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
            >
              <div className="flex justify-between text-[13.5px] text-[var(--gnanam-gray-600)]">
                <span>Sous-total HT</span>
                <span className="font-bold text-[var(--gnanam-ink)]">{eur(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-[13.5px] text-[var(--gnanam-gray-600)]">
                <span>TVA (5,5 %)</span>
                <span className="font-bold text-[var(--gnanam-ink)]">{eur(vat)}</span>
              </div>
              <div className="mt-0.5 flex justify-between text-base font-extrabold">
                <span>Total TTC</span>
                <span>{eur(ttc)}</span>
              </div>
              <button
                onClick={() => dispatch({ type: "SUBMIT_ORDER" })}
                className="mt-2 h-[50px] rounded-[13px] bg-[var(--gnanam-success)] text-[15px] font-bold text-white hover:bg-[var(--gnanam-success-hover)]"
              >
                Commander — livraison J+1
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-[var(--gnanam-gray-400)]">
            <ShoppingCart size={44} strokeWidth={1.6} className="text-[var(--gnanam-neutral-border)]" />
            <div className="text-center text-[14.5px]">
              Votre panier est vide.
              <br />
              Parcourez le catalogue pour ajouter des produits.
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
