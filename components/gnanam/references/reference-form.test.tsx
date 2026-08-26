import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EMPTY_DRAFT, ReferenceForm, priceToCents, useDraft, type ReferenceDraft } from "./reference-form";
import { Category, Zone } from "@/lib/generated/prisma/enums";

describe("priceToCents", () => {
  it("accepte la virgule comme séparateur décimal", () => {
    expect(priceToCents("24,50")).toBe(2450);
  });

  it("accepte aussi le point", () => {
    expect(priceToCents("24.50")).toBe(2450);
  });

  it("convertit exactement les prix à deux décimales, ce que saisit l'utilisateur", () => {
    expect(priceToCents("0,29")).toBe(29);
    expect(priceToCents("1,10")).toBe(110);
    expect(priceToCents("38")).toBe(3800);
    expect(priceToCents("104,95")).toBe(10495);
  });

  it("arrondit au centime au-delà de deux décimales", () => {
    // 1,005 × 100 vaut 100,4999… en binaire : l'arrondi descend. Sans
    // conséquence ici, le champ étant un prix en euros à deux décimales.
    expect(priceToCents("1,005")).toBe(100);
    expect(priceToCents("1,006")).toBe(101);
  });

  it("rejette un prix nul, négatif ou vide", () => {
    expect(priceToCents("0")).toBeNull();
    expect(priceToCents("-5")).toBeNull();
    expect(priceToCents("")).toBeNull();
    expect(priceToCents("   ")).toBeNull();
  });

  it("rejette une saisie non numérique", () => {
    expect(priceToCents("gratuit")).toBeNull();
  });
});

describe("useDraft", () => {
  const rempli: ReferenceDraft = {
    sku: "p19",
    name: "  Ananas Victoria  ",
    unit: "  Colis 5 kg ",
    price: "26,50",
    category: Category.FruitsLegumes,
    zone: Zone.Frais,
    minStock: "8",
  };

  it("convertit le brouillon en payload serveur, espaces retirés", () => {
    const { result } = renderHook(() => useDraft(rempli));
    const payload = result.current.payload();

    expect(payload).toEqual({
      ok: true,
      value: {
        name: "Ananas Victoria",
        unit: "Colis 5 kg",
        priceCents: 2650,
        category: Category.FruitsLegumes,
        zone: Zone.Frais,
        minStock: 8,
      },
    });
  });

  it("signale un prix invalide sans lever", () => {
    const { result } = renderHook(() => useDraft({ ...rempli, price: "zéro" }));
    expect(result.current.payload()).toEqual({ ok: false, error: "Prix invalide." });
  });

  it("traite un seuil vide comme zéro", () => {
    const { result } = renderHook(() => useDraft({ ...rempli, minStock: "" }));
    const payload = result.current.payload();
    expect(payload.ok && payload.value.minStock).toBe(0);
  });

  it("signale un seuil négatif", () => {
    const { result } = renderHook(() => useDraft({ ...rempli, minStock: "-3" }));
    expect(result.current.payload()).toEqual({ ok: false, error: "Seuil invalide." });
  });

  it("reflète les modifications successives du brouillon", () => {
    const { result } = renderHook(() => useDraft(EMPTY_DRAFT));

    act(() => result.current.setDraft({ ...EMPTY_DRAFT, name: "Gombo", unit: "Colis 4 kg", price: "22" }));

    const payload = result.current.payload();
    expect(payload.ok && payload.value).toMatchObject({ name: "Gombo", priceCents: 2200 });
  });
});

describe("ReferenceForm", () => {
  function Harness({ showSku }: { showSku: boolean }) {
    const { draft, setDraft } = useDraft(EMPTY_DRAFT);
    return <ReferenceForm draft={draft} onChange={setDraft} showSku={showSku} />;
  }

  it("expose le champ référence à la création", () => {
    render(<Harness showSku />);
    expect(screen.getByLabelText("Référence (SKU)")).toBeInTheDocument();
  });

  it("masque la référence en modification : elle nomme le visuel produit", () => {
    render(<Harness showSku={false} />);
    expect(screen.queryByLabelText("Référence (SKU)")).not.toBeInTheDocument();
  });

  it("propose toutes les catégories et toutes les zones", () => {
    render(<Harness showSku />);

    const categories = screen.getByLabelText("Catégorie");
    expect(categories).toHaveDisplayValue("Fruits & Légumes");
    expect(Array.from(categories.querySelectorAll("option"))).toHaveLength(
      Object.values(Category).length
    );

    const zones = screen.getByLabelText("Zone de stockage");
    expect(Array.from(zones.querySelectorAll("option"))).toHaveLength(Object.values(Zone).length);
  });

  it("remonte chaque frappe au parent", async () => {
    const user = userEvent.setup();
    render(<Harness showSku />);

    await user.type(screen.getByLabelText("Nom du produit"), "Gombo frais");

    expect(screen.getByLabelText("Nom du produit")).toHaveValue("Gombo frais");
  });

  it("désactive tous les champs pendant l'enregistrement", () => {
    render(
      <ReferenceForm draft={EMPTY_DRAFT} onChange={() => {}} showSku disabled />
    );

    expect(screen.getByLabelText("Nom du produit")).toBeDisabled();
    expect(screen.getByLabelText("Prix HT (€)")).toBeDisabled();
    expect(screen.getByLabelText("Catégorie")).toBeDisabled();
  });
});
