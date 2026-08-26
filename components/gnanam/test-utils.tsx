import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { GnanamStoreProvider } from "@/lib/gnanam/store";
import type { ModuleId } from "@/lib/gnanam/types";
import { Category, Zone } from "@/lib/generated/prisma/enums";
import type { RouterOutputs } from "@/lib/trpc/client";

/**
 * Utilitaires de rendu des composants — pas un fichier de test.
 *
 * Les composants lisent l'état d'interface dans le store : les monter sans son
 * provider lève immédiatement. Ce helper l'installe.
 */
export function renderWithStore(
  ui: ReactElement,
  { module = "commande" as ModuleId, ...options }: RenderOptions & { module?: ModuleId } = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <GnanamStoreProvider initialModule={module}>{children}</GnanamStoreProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

type Product = RouterOutputs["products"]["list"][number];

/** Référence de catalogue minimale, surchargeable champ par champ. */
export function fakeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    sku: "p1",
    name: "Mangue Kent",
    unit: "Colis 6 kg",
    priceCents: 2400,
    category: Category.FruitsLegumes,
    zone: Zone.Frais,
    minStock: 12,
    quantity: 46,
    imageUrl: "/produits/p1.webp",
    ...overrides,
  };
}

type StockRowData = RouterOutputs["stock"]["list"][number];

export function fakeStockRow(overrides: Partial<StockRowData> = {}): StockRowData {
  return {
    id: "prod-1",
    sku: "p1",
    name: "Mangue Kent",
    unit: "Colis 6 kg",
    priceCents: 2400,
    category: Category.FruitsLegumes,
    zone: Zone.Frais,
    minStock: 12,
    quantity: 46,
    imageUrl: "/produits/p1.webp",
    active: true,
    createdAt: new Date("2026-08-01T00:00:00Z"),
    updatedAt: new Date("2026-08-01T00:00:00Z"),
    reserved: 4,
    available: 42,
    level: "ok",
    ...overrides,
  };
}
