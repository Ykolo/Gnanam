import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { GnanamStoreProvider, useGnanamStore } from "./store";

function wrapper({ children }: { children: ReactNode }) {
  return <GnanamStoreProvider initialModule="commande">{children}</GnanamStoreProvider>;
}

function setup() {
  return renderHook(() => useGnanamStore(), { wrapper });
}

describe("useGnanamStore", () => {
  it("lève une erreur hors provider", () => {
    expect(() => renderHook(() => useGnanamStore())).toThrow(
      "useGnanamStore must be used within GnanamStoreProvider"
    );
  });

  it("initialise le module au démarrage selon le profil", () => {
    const { result } = renderHook(() => useGnanamStore(), {
      wrapper: ({ children }) => <GnanamStoreProvider initialModule="preparation">{children}</GnanamStoreProvider>,
    });
    expect(result.current.state.module).toBe("preparation");
  });

  it("gère la recherche, le module et la catégorie", () => {
    const { result } = setup();
    act(() => result.current.dispatch({ type: "SET_SEARCH", value: "mangue" }));
    expect(result.current.state.search).toBe("mangue");
    act(() => result.current.dispatch({ type: "SET_MODULE", module: "stock" }));
    expect(result.current.state.module).toBe("stock");
    act(() => result.current.dispatch({ type: "SET_CATEGORY", cat: "Epicerie" }));
    expect(result.current.state.cat).toBe("Epicerie");
  });

  describe("panier", () => {
    it("ajoute, incrémente puis retire un article", () => {
      const { result } = setup();
      act(() => result.current.dispatch({ type: "ADD_TO_CART", pid: "p1" }));
      expect(result.current.state.cart.p1).toBe(1);
      act(() => result.current.dispatch({ type: "ADD_TO_CART", pid: "p1" }));
      expect(result.current.state.cart.p1).toBe(2);
      act(() => result.current.dispatch({ type: "SUB_FROM_CART", pid: "p1" }));
      expect(result.current.state.cart.p1).toBe(1);
      act(() => result.current.dispatch({ type: "REMOVE_FROM_CART", pid: "p1" }));
      expect(result.current.state.cart.p1).toBe(0);
    });

    it("ne descend jamais sous 0", () => {
      const { result } = setup();
      act(() => result.current.dispatch({ type: "SUB_FROM_CART", pid: "p1" }));
      expect(result.current.state.cart.p1).toBe(0);
    });

    it("ouvre et ferme le panier", () => {
      const { result } = setup();
      expect(result.current.state.cartOpen).toBe(false);
      act(() => result.current.dispatch({ type: "TOGGLE_CART" }));
      expect(result.current.state.cartOpen).toBe(true);
      act(() => result.current.dispatch({ type: "SET_CART_OPEN", open: false }));
      expect(result.current.state.cartOpen).toBe(false);
    });

    it("vide le panier et mémorise la référence à l'envoi de la commande", () => {
      const { result } = setup();
      act(() => result.current.dispatch({ type: "ADD_TO_CART", pid: "p1" }));
      act(() => result.current.dispatch({ type: "SET_CART_OPEN", open: true }));
      act(() => result.current.dispatch({ type: "ORDER_SUBMITTED", orderLabel: "CMD-1044" }));
      expect(result.current.state.orderSent).toBe(true);
      expect(result.current.state.lastOrderId).toBe("CMD-1044");
      expect(result.current.state.cart).toEqual({});
      expect(result.current.state.cartOpen).toBe(false);
      act(() => result.current.dispatch({ type: "NEW_ORDER" }));
      expect(result.current.state.orderSent).toBe(false);
    });
  });

  describe("préparation", () => {
    it("ouvre une commande et revient à la liste en réinitialisant le flag", () => {
      const { result } = setup();
      act(() => result.current.dispatch({ type: "SET_FLAG", key: "line-1" }));
      act(() => result.current.dispatch({ type: "OPEN_PREP_ORDER", id: "order-1" }));
      expect(result.current.state.prepView).toBe("pick");
      expect(result.current.state.activeOrderId).toBe("order-1");
      expect(result.current.state.flagOpen).toBeNull();

      act(() => result.current.dispatch({ type: "SET_FLAG", key: "line-2" }));
      act(() => result.current.dispatch({ type: "BACK_TO_PREP_LIST" }));
      expect(result.current.state.prepView).toBe("list");
      expect(result.current.state.activeOrderId).toBeNull();
      expect(result.current.state.flagOpen).toBeNull();
    });
  });

  describe("livraison", () => {
    it("ne signe que le stop actif", () => {
      const { result } = setup();
      act(() => result.current.dispatch({ type: "TOGGLE_SIGN" }));
      expect(result.current.state.signed).toEqual({});

      act(() => result.current.dispatch({ type: "OPEN_STOP", id: "stop-1" }));
      expect(result.current.state.livView).toBe("detail");
      act(() => result.current.dispatch({ type: "TOGGLE_SIGN" }));
      expect(result.current.state.signed["stop-1"]).toBe(true);
      act(() => result.current.dispatch({ type: "TOGGLE_SIGN" }));
      expect(result.current.state.signed["stop-1"]).toBe(false);

      act(() => result.current.dispatch({ type: "BACK_TO_STOPS" }));
      expect(result.current.state.livView).toBe("list");
      expect(result.current.state.activeStopId).toBeNull();
    });
  });

  describe("sécurité", () => {
    it("gère la recherche, l'ouverture et le pointage des lignes", () => {
      const { result } = setup();
      act(() => result.current.dispatch({ type: "SET_SEC_SEARCH", value: "kailash" }));
      expect(result.current.state.secSearch).toBe("kailash");

      act(() => result.current.dispatch({ type: "OPEN_SEC_ORDER", id: "order-1" }));
      expect(result.current.state.secView).toBe("check");
      expect(result.current.state.secOrderId).toBe("order-1");

      act(() => result.current.dispatch({ type: "TOGGLE_SEC_LINE", key: "line-1" }));
      expect(result.current.state.secChecked["line-1"]).toBe(true);
      act(() => result.current.dispatch({ type: "TOGGLE_SEC_LINE", key: "line-1" }));
      expect(result.current.state.secChecked["line-1"]).toBe(false);

      act(() => result.current.dispatch({ type: "BACK_TO_SEC_LIST" }));
      expect(result.current.state.secView).toBe("list");
      expect(result.current.state.secOrderId).toBeNull();
    });
  });

  describe("rapports et stock dépôt", () => {
    it("change la période des rapports", () => {
      const { result } = setup();
      act(() => result.current.dispatch({ type: "SET_REP_PERIOD", period: "mois" }));
      expect(result.current.state.repPeriod).toBe("mois");
    });

    it("filtre et recherche dans le stock", () => {
      const { result } = setup();
      act(() => result.current.dispatch({ type: "SET_STOCK_SEARCH", value: "riz" }));
      expect(result.current.state.stockSearch).toBe("riz");
      act(() => result.current.dispatch({ type: "SET_STOCK_FILTER", filter: "alert" }));
      expect(result.current.state.stockFilter).toBe("alert");
    });
  });
});
