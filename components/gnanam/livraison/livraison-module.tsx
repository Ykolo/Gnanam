"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { api, LIVE } from "@/lib/trpc/client";
import { LivraisonList } from "./livraison-list";
import { LivraisonDetail } from "./livraison-detail";

export function LivraisonModule() {
  const { state } = useGnanamStore();
  const { data: orders, isLoading } = api.orders.today.useQuery(undefined, LIVE);
  const stop = orders?.find((o) => o.id === state.activeStopId);

  if (state.livView === "detail" && stop) return <LivraisonDetail stop={stop} />;
  return <LivraisonList orders={orders ?? []} isLoading={isLoading} />;
}
