"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { Catalog } from "./catalog";
import { CartSheet } from "./cart-sheet";
import { OrderConfirmation } from "./order-confirmation";

export function CommandeModule() {
  const { state } = useGnanamStore();

  if (state.orderSent) return <OrderConfirmation />;

  return (
    <>
      <Catalog />
      <CartSheet />
    </>
  );
}
