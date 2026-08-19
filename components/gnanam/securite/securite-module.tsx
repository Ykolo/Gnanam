"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { api, LIVE } from "@/lib/trpc/client";
import { SecList } from "./sec-list";
import { SecCheck } from "./sec-check";

export function SecuriteModule() {
  const { state } = useGnanamStore();
  const { data: orders, isLoading } = api.orders.today.useQuery(undefined, LIVE);
  const order = orders?.find((o) => o.id === state.secOrderId);

  if (state.secView === "check" && order) return <SecCheck order={order} />;
  return <SecList orders={orders ?? []} isLoading={isLoading} />;
}
