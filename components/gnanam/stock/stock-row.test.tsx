import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const receiveMutate = vi.fn();
const adjustMutate = vi.fn();
const invalidateStock = vi.fn();

/**
 * `StockRow` déclenche de vraies mutations tRPC. On remplace le client par des
 * espions : ce qui est vérifié ici, c'est ce que le composant *demande* au
 * serveur, la logique serveur étant couverte par server/routers/stock.test.ts.
 */
vi.mock("@/lib/trpc/client", () => ({
  api: {
    useUtils: () => ({ stock: { invalidate: invalidateStock } }),
    stock: {
      receive: { useMutation: () => ({ mutate: receiveMutate, isPending: false }) },
      adjust: { useMutation: () => ({ mutate: adjustMutate, isPending: false }) },
    },
  },
}));

const { StockRow } = await import("./stock-row");
const { fakeStockRow, renderWithStore } = await import("../test-utils");

beforeEach(() => {
  receiveMutate.mockClear();
  adjustMutate.mockClear();
});

describe("StockRow", () => {
  it("affiche physique, réservé et disponible", () => {
    renderWithStore(<StockRow row={fakeStockRow({ quantity: 46, reserved: 4, available: 42 })} />);

    expect(screen.getByText("46")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("signale un stock sous le seuil", () => {
    renderWithStore(<StockRow row={fakeStockRow({ level: "critique" })} />);
    expect(screen.getByText("Sous le seuil")).toBeInTheDocument();
  });

  it("signale une rupture", () => {
    renderWithStore(<StockRow row={fakeStockRow({ level: "rupture" })} />);
    expect(screen.getByText("Rupture")).toBeInTheDocument();
  });

  it("n'alerte pas quand le niveau est bon", () => {
    // « Disponible » est aussi l'intitulé d'une statistique de la carte : on
    // vérifie donc l'absence des deux libellés d'alerte, qui sont sans ambiguïté.
    renderWithStore(<StockRow row={fakeStockRow({ level: "ok" })} />);

    expect(screen.queryByText("Sous le seuil")).not.toBeInTheDocument();
    expect(screen.queryByText("Rupture")).not.toBeInTheDocument();
  });

  it("suggère un réapprovisionnement sous le seuil", () => {
    renderWithStore(<StockRow row={fakeStockRow({ available: 3, minStock: 8, level: "critique" })} />);

    // Deux fois le seuil moins le disponible : 8 × 2 − 3.
    expect(screen.getByText(/commander 13 colis/)).toBeInTheDocument();
  });

  it("ne suggère rien quand le stock est confortable", () => {
    renderWithStore(<StockRow row={fakeStockRow({ available: 42, minStock: 12 })} />);
    expect(screen.queryByText(/commander/)).not.toBeInTheDocument();
  });

  describe("ajustements", () => {
    it("demande un retrait d'un colis", async () => {
      const user = userEvent.setup();
      renderWithStore(<StockRow row={fakeStockRow({ id: "prod-9", name: "Riz basmati Pusa" })} />);

      await user.click(screen.getByRole("button", { name: "Retirer un colis de Riz basmati Pusa" }));

      expect(adjustMutate).toHaveBeenCalledWith({ productId: "prod-9", delta: -1 });
    });

    it("demande un ajout d'un colis", async () => {
      const user = userEvent.setup();
      renderWithStore(<StockRow row={fakeStockRow({ id: "prod-9", name: "Riz basmati Pusa" })} />);

      await user.click(screen.getByRole("button", { name: "Ajouter un colis à Riz basmati Pusa" }));

      expect(adjustMutate).toHaveBeenCalledWith({ productId: "prod-9", delta: 1 });
    });

    it("interdit le retrait quand le stock physique est nul", async () => {
      const user = userEvent.setup();
      renderWithStore(<StockRow row={fakeStockRow({ quantity: 0, level: "rupture" })} />);

      const retirer = screen.getByRole("button", { name: /^Retirer un colis/ });
      expect(retirer).toBeDisabled();

      await user.click(retirer);
      expect(adjustMutate).not.toHaveBeenCalled();
    });
  });

  describe("réception", () => {
    it("enregistre la quantité saisie", async () => {
      const user = userEvent.setup();
      renderWithStore(<StockRow row={fakeStockRow({ id: "prod-3", name: "Igname du Ghana" })} />);

      await user.click(screen.getByRole("button", { name: /Réception/ }));
      await user.type(screen.getByLabelText("Colis reçus pour Igname du Ghana"), "24");
      await user.click(screen.getByRole("button", { name: "Valider la réception" }));

      expect(receiveMutate).toHaveBeenCalledWith({ productId: "prod-3", qty: 24 });
    });

    it("valide aussi à la touche Entrée", async () => {
      const user = userEvent.setup();
      renderWithStore(<StockRow row={fakeStockRow({ id: "prod-3", name: "Igname du Ghana" })} />);

      await user.click(screen.getByRole("button", { name: /Réception/ }));
      await user.type(screen.getByLabelText("Colis reçus pour Igname du Ghana"), "6{Enter}");

      expect(receiveMutate).toHaveBeenCalledWith({ productId: "prod-3", qty: 6 });
    });

    it("ignore une quantité vide ou nulle", async () => {
      const user = userEvent.setup();
      renderWithStore(<StockRow row={fakeStockRow()} />);

      await user.click(screen.getByRole("button", { name: /Réception/ }));
      await user.click(screen.getByRole("button", { name: "Valider la réception" }));

      expect(receiveMutate).not.toHaveBeenCalled();
    });

    it("referme la saisie sans rien envoyer à l'annulation", async () => {
      const user = userEvent.setup();
      renderWithStore(<StockRow row={fakeStockRow({ name: "Igname du Ghana" })} />);

      await user.click(screen.getByRole("button", { name: /Réception/ }));
      await user.type(screen.getByLabelText("Colis reçus pour Igname du Ghana"), "12");
      await user.click(screen.getByRole("button", { name: "Annuler la réception" }));

      expect(receiveMutate).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /Réception/ })).toBeInTheDocument();
    });
  });
});
