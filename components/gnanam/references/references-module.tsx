"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { api } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/client";
import { CATEGORY_LABELS, ZONE_COLORS, ZONE_SHORT_LABELS } from "@/lib/gnanam/data";
import { eur, normalize } from "@/lib/gnanam/utils";
import { EMPTY_DRAFT, ReferenceForm, useDraft, type ReferenceDraft } from "./reference-form";

type Product = RouterOutputs["catalog"]["list"][number];

function draftOf(p: Product): ReferenceDraft {
  return {
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    price: (p.priceCents / 100).toFixed(2).replace(".", ","),
    category: p.category,
    zone: p.zone,
    minStock: String(p.minStock),
  };
}

function EditRow({ product, onDone }: { product: Product; onDone: () => void }) {
  const utils = api.useUtils();
  const { draft, setDraft, payload } = useDraft(draftOf(product));
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    utils.catalog.list.invalidate();
    utils.products.list.invalidate();
    utils.stock.invalidate();
  };
  const update = api.catalog.update.useMutation({
    onSuccess: () => {
      invalidate();
      onDone();
    },
    onError: (e) => setError(e.message),
  });

  const save = () => {
    const result = payload();
    if (!result.ok) return setError(result.error);
    setError(null);
    update.mutate({ id: product.id, ...result.value });
  };

  return (
    <div className="rounded-2xl border-[1.5px] border-[var(--gnanam-gold)] bg-white p-4 shadow-[0_2px_10px_rgba(14,58,66,.05)]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[14.5px] font-extrabold">Modifier {product.sku.toUpperCase()}</span>
        <button
          onClick={onDone}
          aria-label="Annuler la modification"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-[9px] border-[1.5px] border-[var(--gnanam-border)] text-[var(--gnanam-gray-600)] hover:bg-[var(--gnanam-cream)]"
        >
          <X size={16} strokeWidth={2.4} />
        </button>
      </div>
      <ReferenceForm draft={draft} onChange={setDraft} showSku={false} disabled={update.isPending} />
      {error && <div className="mt-2 text-[13px] font-semibold text-[var(--gnanam-error)]">{error}</div>}
      <button
        onClick={save}
        disabled={update.isPending}
        className="mt-3 min-h-11 w-full rounded-[10px] bg-[var(--gnanam-teal-900)] px-4 text-[14px] font-bold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)] disabled:opacity-70"
      >
        {update.isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

function ProductRow({ product, onEdit }: { product: Product; onEdit: () => void }) {
  const utils = api.useUtils();
  const setActive = api.catalog.setActive.useMutation({
    onSuccess: () => {
      utils.catalog.list.invalidate();
      utils.products.list.invalidate();
      utils.stock.invalidate();
    },
  });
  const [zoneBg, zoneFg] = ZONE_COLORS[product.zone];

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(14,58,66,.05)]"
      style={{ opacity: product.active ? 1 : 0.55 }}
    >
      <div className="min-w-[160px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14.5px] font-bold">{product.name}</span>
          {!product.active && (
            <span className="rounded-full bg-[var(--gnanam-border-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--gnanam-gray-600)]">
              Désactivée
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[12.5px] text-[var(--gnanam-gray-400)]">
          {product.sku.toUpperCase()} · {product.unit} · {CATEGORY_LABELS[product.category]} · seuil{" "}
          {product.minStock}
        </div>
      </div>

      <span
        className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide uppercase"
        style={{ background: zoneBg, color: zoneFg }}
      >
        {ZONE_SHORT_LABELS[product.zone]}
      </span>

      <span className="w-20 text-right text-[15px] font-extrabold text-[var(--gnanam-teal-900)]">
        {eur(product.priceCents / 100)}
      </span>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="min-h-10 rounded-[10px] border-[1.5px] border-[var(--gnanam-border)] bg-white px-3.5 text-[13px] font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-cream)]"
        >
          Modifier
        </button>
        <button
          onClick={() => setActive.mutate({ id: product.id, active: !product.active })}
          disabled={setActive.isPending}
          className="min-h-10 rounded-[10px] border-[1.5px] px-3.5 text-[13px] font-bold disabled:opacity-60"
          style={{
            borderColor: product.active ? "var(--gnanam-error-border)" : "var(--gnanam-success-border)",
            background: product.active ? "var(--gnanam-error-bg)" : "var(--gnanam-success-bg)",
            color: product.active ? "var(--gnanam-error)" : "var(--gnanam-success)",
          }}
        >
          {product.active ? "Désactiver" : "Réactiver"}
        </button>
      </div>
    </div>
  );
}

function CreatePanel({ onDone }: { onDone: () => void }) {
  const utils = api.useUtils();
  const { draft, setDraft, payload } = useDraft(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const create = api.catalog.create.useMutation({
    onSuccess: () => {
      utils.catalog.list.invalidate();
      utils.products.list.invalidate();
      utils.stock.invalidate();
      onDone();
    },
    onError: (e) => setError(e.message),
  });

  const save = () => {
    if (!draft.sku.trim()) return setError("Référence obligatoire.");
    const result = payload();
    if (!result.ok) return setError(result.error);
    setError(null);
    create.mutate({ sku: draft.sku.trim(), ...result.value });
  };

  return (
    <div className="rounded-2xl border-[1.5px] border-[var(--gnanam-teal-900)] bg-white p-4 shadow-[0_2px_10px_rgba(14,58,66,.05)]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[14.5px] font-extrabold">Nouvelle référence</span>
        <button
          onClick={onDone}
          aria-label="Fermer"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-[9px] border-[1.5px] border-[var(--gnanam-border)] text-[var(--gnanam-gray-600)] hover:bg-[var(--gnanam-cream)]"
        >
          <X size={16} strokeWidth={2.4} />
        </button>
      </div>
      <ReferenceForm draft={draft} onChange={setDraft} showSku disabled={create.isPending} />
      <div className="mt-2 text-[12px] text-[var(--gnanam-gray-400)]">
        Le visuel est cherché dans <code>public/produits/&lt;référence&gt;.webp</code> ; à défaut, les initiales
        du produit s&apos;affichent.
      </div>
      {error && <div className="mt-2 text-[13px] font-semibold text-[var(--gnanam-error)]">{error}</div>}
      <button
        onClick={save}
        disabled={create.isPending}
        className="mt-3 min-h-11 w-full rounded-[10px] bg-[var(--gnanam-teal-900)] px-4 text-[14px] font-bold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)] disabled:opacity-70"
      >
        {create.isPending ? "Création…" : "Créer la référence"}
      </button>
    </div>
  );
}

export function ReferencesModule() {
  const { data: products, isLoading } = api.catalog.list.useQuery();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const visible = useMemo(() => {
    const q = normalize(search.trim());
    return (products ?? []).filter(
      (p) => !q || normalize(p.name).includes(q) || normalize(p.sku).includes(q)
    );
  }, [products, search]);

  const actives = (products ?? []).filter((p) => p.active).length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3.5 border-b border-[var(--gnanam-border-soft)] bg-white px-6 py-3.5 shadow-[0_1px_0_rgba(14,58,66,.04)]">
        <div className="shrink-0">
          <div className="text-[19px] font-extrabold tracking-tight text-[var(--gnanam-teal-900)]">Références</div>
          <div className="text-xs text-[var(--gnanam-gray-400)]">
            {actives} active{actives > 1 ? "s" : ""} sur {products?.length ?? 0}
          </div>
        </div>
        <div className="flex min-w-[180px] flex-1 items-center gap-2.5 rounded-xl border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 focus-within:border-[var(--gnanam-gold)]">
          <Search size={17} className="text-[var(--gnanam-gray-400)]" strokeWidth={2.2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Rechercher une référence…"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[var(--gnanam-gray-400)]"
          />
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[var(--gnanam-gold)] px-4 text-sm font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-gold-light)]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Nouvelle référence
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-28">
        <div className="flex max-w-[860px] flex-col gap-2.5">
          {creating && <CreatePanel onDone={() => setCreating(false)} />}

          {visible.map((p) =>
            editingId === p.id ? (
              <EditRow key={p.id} product={p} onDone={() => setEditingId(null)} />
            ) : (
              <ProductRow key={p.id} product={p} onEdit={() => setEditingId(p.id)} />
            )
          )}

          {!isLoading && visible.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-[14.5px] text-[var(--gnanam-gray-400)]">
              Aucune référence ne correspond à « {search} ».
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
