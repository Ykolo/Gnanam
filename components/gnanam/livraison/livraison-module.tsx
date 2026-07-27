"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { LivraisonList } from "./livraison-list";
import { LivraisonDetail } from "./livraison-detail";

export function LivraisonModule() {
  const { state } = useGnanamStore();
  const stop = state.orders.find((o) => o.id === state.activeStopId);

  if (state.livView === "detail" && stop) return <LivraisonDetail />;
  return <LivraisonList />;
}
