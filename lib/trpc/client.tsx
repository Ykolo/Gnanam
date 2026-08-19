"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

export const api = createTRPCReact<AppRouter>();
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Options communes aux écrans du dépôt : plusieurs postes travaillent sur les
 * mêmes commandes, chaque vue se resynchronise donc toutes les 5 secondes.
 * Rien ne tourne quand l'onglet est en arrière-plan.
 */
export const LIVE = {
  refetchInterval: 5000,
  refetchIntervalInBackground: false,
  staleTime: 2000,
} as const;

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } } })
  );
  const [trpcClient] = useState(() =>
    api.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })] })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
