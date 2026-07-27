"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { PrepList } from "./prep-list";
import { PrepPick } from "./prep-pick";

export function PreparationModule() {
  const { state } = useGnanamStore();
  const active = state.orders.find((o) => o.id === state.activeOrderId);

  if (state.prepView === "pick" && active) return <PrepPick />;
  return <PrepList />;
}
