"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { useIsDesktop } from "@/lib/gnanam/use-is-desktop";
import { AuthScreen } from "./auth-screen";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { CommandeModule } from "./commande/commande-module";
import { PreparationModule } from "./preparation/preparation-module";
import { SecuriteModule } from "./securite/securite-module";
import { LivraisonModule } from "./livraison/livraison-module";
import { StockModule } from "./stock/stock-module";
import { RapportsModule } from "./rapports/rapports-module";

export function GnanamApp() {
  const { state } = useGnanamStore();
  const isDesktop = useIsDesktop();

  if (!state.authed) return <AuthScreen />;

  return (
    <div className="flex h-full w-full">
      {isDesktop && <Sidebar />}

      <div className="flex flex-1 flex-col overflow-hidden">
        {state.module === "commande" && <CommandeModule />}
        {state.module === "preparation" && <PreparationModule />}
        {state.module === "securite" && <SecuriteModule />}
        {state.module === "livraison" && <LivraisonModule />}
        {state.module === "stock" && <StockModule />}
        {state.module === "rapports" && <RapportsModule />}
      </div>

      {!isDesktop && <MobileNav />}
    </div>
  );
}
