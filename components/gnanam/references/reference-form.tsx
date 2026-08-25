"use client";

import { useState } from "react";
import { Category, Zone } from "@/lib/generated/prisma/enums";
import { CATEGORY_LABELS, ZONE_SHORT_LABELS } from "@/lib/gnanam/data";

export interface ReferenceDraft {
  sku: string;
  name: string;
  unit: string;
  /** Saisi en euros, converti en centimes à l'envoi. */
  price: string;
  category: Category;
  zone: Zone;
  minStock: string;
}

export const EMPTY_DRAFT: ReferenceDraft = {
  sku: "",
  name: "",
  unit: "",
  price: "",
  category: Category.FruitsLegumes,
  zone: Zone.Frais,
  minStock: "0",
};

const FIELD =
  "min-h-11 w-full rounded-[10px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3 text-[14.5px] outline-none focus:border-[var(--gnanam-gold)]";
const LABEL = "mb-1 block text-[12px] font-bold text-[var(--gnanam-gray-600)]";

/** Convertit la saisie « 24,50 » en 2450 centimes. Renvoie null si inexploitable. */
export function priceToCents(input: string): number | null {
  const normalized = input.replace(",", ".").trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function ReferenceForm({
  draft,
  onChange,
  showSku,
  disabled,
}: {
  draft: ReferenceDraft;
  onChange: (next: ReferenceDraft) => void;
  /** Le SKU n'est saisissable qu'à la création : il nomme le visuel du produit. */
  showSku: boolean;
  disabled?: boolean;
}) {
  const set = <K extends keyof ReferenceDraft>(key: K, value: ReferenceDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {showSku && (
        <div>
          <label className={LABEL} htmlFor="ref-sku">
            Référence (SKU)
          </label>
          <input
            id="ref-sku"
            value={draft.sku}
            onChange={(e) => set("sku", e.target.value)}
            disabled={disabled}
            placeholder="p19"
            className={FIELD}
          />
        </div>
      )}
      <div className={showSku ? "" : "sm:col-span-2"}>
        <label className={LABEL} htmlFor="ref-name">
          Nom du produit
        </label>
        <input
          id="ref-name"
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          disabled={disabled}
          placeholder="Mangue Kent"
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL} htmlFor="ref-unit">
          Unité de vente
        </label>
        <input
          id="ref-unit"
          value={draft.unit}
          onChange={(e) => set("unit", e.target.value)}
          disabled={disabled}
          placeholder="Colis 6 kg"
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL} htmlFor="ref-price">
          Prix HT (€)
        </label>
        <input
          id="ref-price"
          value={draft.price}
          onChange={(e) => set("price", e.target.value)}
          disabled={disabled}
          inputMode="decimal"
          placeholder="24,00"
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL} htmlFor="ref-category">
          Catégorie
        </label>
        <select
          id="ref-category"
          value={draft.category}
          onChange={(e) => set("category", e.target.value as Category)}
          disabled={disabled}
          className={FIELD}
        >
          {Object.values(Category).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={LABEL} htmlFor="ref-zone">
          Zone de stockage
        </label>
        <select
          id="ref-zone"
          value={draft.zone}
          onChange={(e) => set("zone", e.target.value as Zone)}
          disabled={disabled}
          className={FIELD}
        >
          {Object.values(Zone).map((z) => (
            <option key={z} value={z}>
              {ZONE_SHORT_LABELS[z]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={LABEL} htmlFor="ref-min">
          Seuil de réappro (colis)
        </label>
        <input
          id="ref-min"
          value={draft.minStock}
          onChange={(e) => set("minStock", e.target.value)}
          disabled={disabled}
          inputMode="numeric"
          className={FIELD}
        />
      </div>
    </div>
  );
}

export interface ReferencePayload {
  name: string;
  unit: string;
  priceCents: number;
  category: Category;
  zone: Zone;
  minStock: number;
}

export type DraftResult = { ok: true; value: ReferencePayload } | { ok: false; error: string };

/** Petit hook local : garde le brouillon et sait le convertir en payload serveur. */
export function useDraft(initial: ReferenceDraft) {
  const [draft, setDraft] = useState<ReferenceDraft>(initial);

  const payload = (): DraftResult => {
    const priceCents = priceToCents(draft.price);
    const minStock = Number.parseInt(draft.minStock || "0", 10);
    if (priceCents === null) return { ok: false, error: "Prix invalide." };
    if (!Number.isFinite(minStock) || minStock < 0) return { ok: false, error: "Seuil invalide." };
    return {
      ok: true,
      value: {
        name: draft.name.trim(),
        unit: draft.unit.trim(),
        priceCents,
        category: draft.category,
        zone: draft.zone,
        minStock,
      },
    };
  };

  return { draft, setDraft, payload };
}
