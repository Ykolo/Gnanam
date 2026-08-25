"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { api, LIVE } from "@/lib/trpc/client";
import { PrepList } from "./prep-list";
import { PrepPick } from "./prep-pick";

export function PreparationModule() {
  const { state } = useGnanamStore();
  const { data: orders, isLoading } = api.orders.today.useQuery(undefined, LIVE);
  const active = orders?.find((o) => o.id === state.activeOrderId);

  if (state.prepView === "pick" && active) return <PrepPick order={active} />;
  return <PrepList orders={orders ?? []} isLoading={isLoading} />;
}
