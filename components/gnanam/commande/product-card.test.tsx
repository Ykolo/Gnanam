import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "./product-card";
import { fakeProduct, renderWithStore } from "../test-utils";
import { Category } from "@/lib/generated/prisma/enums";

describe("ProductCard", () => {
  it("affiche le prix en euros à partir des centimes stockés", () => {
    renderWithStore(<ProductCard product={fakeProduct({ priceCents: 2400 })} />);

    expect(screen.getByText("24,00 €")).toBeInTheDocument();
  });

  it("calcule le prix au kilo depuis l'unité de vente", () => {
    renderWithStore(<ProductCard product={fakeProduct({ unit: "Colis 6 kg", priceCents: 2400 })} />);

    expect(screen.getByText(/4,00 € \/ kg/)).toBeInTheDocument();
  });

  it("calcule le prix à l'unité pour un conditionnement par lot", () => {
    renderWithStore(<ProductCard product={fakeProduct({ unit: "Pack ×12", priceCents: 1560 })} />);

    expect(screen.getByText(/1,30 € \/ unité/)).toBeInTheDocument();
  });

  it("dérive la référence affichée du SKU", () => {
    renderWithStore(<ProductCard product={fakeProduct({ sku: "p9" })} />);

    expect(screen.getByText(/réf\. GE-109/)).toBeInTheDocument();
  });

  it("signale les références mises en avant", () => {
    renderWithStore(<ProductCard product={fakeProduct({ sku: "p1" })} />);
    expect(screen.getByText("PROMO")).toBeInTheDocument();
  });

  it("n'affiche pas de promo sur une référence ordinaire", () => {
    renderWithStore(<ProductCard product={fakeProduct({ sku: "p7" })} />);
    expect(screen.queryByText("PROMO")).not.toBeInTheDocument();
  });

  it("traduit la catégorie en libellé lisible", () => {
    renderWithStore(<ProductCard product={fakeProduct({ category: Category.Surgeles })} />);
    expect(screen.getByText("Surgelés")).toBeInTheDocument();
  });

  describe("panier", () => {
    const ajouter = () => screen.getByRole("button", { name: /^Ajouter au panier$/ });
    const plus = () => screen.getByRole("button", { name: /^Ajouter un .* au panier$/ });
    const moins = () => screen.getByRole("button", { name: /^Retirer un .* du panier$/ });

    it("remplace le bouton par un compteur au premier ajout", async () => {
      const user = userEvent.setup();
      renderWithStore(<ProductCard product={fakeProduct()} />);

      await user.click(ajouter());

      expect(screen.queryByRole("button", { name: /^Ajouter au panier$/ })).not.toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("incrémente la quantité", async () => {
      const user = userEvent.setup();
      renderWithStore(<ProductCard product={fakeProduct()} />);

      await user.click(ajouter());
      await user.click(plus());
      await user.click(plus());

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("revient au bouton d'ajout une fois la quantité retombée à zéro", async () => {
      const user = userEvent.setup();
      renderWithStore(<ProductCard product={fakeProduct()} />);

      await user.click(ajouter());
      await user.click(moins());

      expect(ajouter()).toBeInTheDocument();
    });

    it("nomme les boutons de quantité d'après le produit, pour les lecteurs d'écran", async () => {
      const user = userEvent.setup();
      renderWithStore(<ProductCard product={fakeProduct({ name: "Riz basmati Pusa" })} />);

      await user.click(ajouter());

      expect(screen.getByRole("button", { name: "Ajouter un Riz basmati Pusa au panier" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retirer un Riz basmati Pusa du panier" })).toBeInTheDocument();
    });
  });
});
