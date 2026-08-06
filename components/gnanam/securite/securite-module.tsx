"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { SecList } from "./sec-list";
import { SecCheck } from "./sec-check";

export function SecuriteModule() {
  const { state } = useGnanamStore();
  const order = state.orders.find((o) => o.id === state.secOrderId);

  if (state.secView === "check" && order) return <SecCheck />;
  return <SecList />;
}
