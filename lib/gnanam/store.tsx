"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { AppState, ModuleId, PrepView, LivView, RepPeriod, StockFilter } from "./types";
import { DEFAULT_DELIVERY_WINDOW, type DeliveryWindow } from "./data";

/** Le module ouvert au démarrage dépend du profil : il est fourni par le serveur. */
function makeInitialState(module: ModuleId): AppState {
  return { ...baseState, module };
}

const baseState: AppState = {
  module: "commande",
  cat: "Tous",
  cart: {},
  search: "",
  cartOpen: false,
  orderSent: false,
  lastOrderId: null,
  deliveryWindow: DEFAULT_DELIVERY_WINDOW,

  prepView: "list",
  activeOrderId: null,
  flagOpen: null,

  livView: "list",
  activeStopId: null,
  signed: {},

  secView: "list",
  secOrderId: null,
  secChecked: {},
  secSearch: "",

  repPeriod: "jour",

  stockSearch: "",
  stockFilter: "all",
};

type Action =
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_MODULE"; module: ModuleId }
  | { type: "SET_CATEGORY"; cat: string }
  | { type: "ADD_TO_CART"; pid: string }
  | { type: "SUB_FROM_CART"; pid: string }
  | { type: "REMOVE_FROM_CART"; pid: string }
  | { type: "TOGGLE_CART" }
  | { type: "SET_CART_OPEN"; open: boolean }
  | { type: "SET_DELIVERY_WINDOW"; window: DeliveryWindow }
  | { type: "ORDER_SUBMITTED"; orderLabel: string }
  | { type: "NEW_ORDER" }
  | { type: "SET_PREP_VIEW"; view: PrepView }
  | { type: "OPEN_PREP_ORDER"; id: string }
  | { type: "BACK_TO_PREP_LIST" }
  | { type: "SET_FLAG"; key: string | null }
  | { type: "SET_LIV_VIEW"; view: LivView }
  | { type: "OPEN_STOP"; id: string }
  | { type: "BACK_TO_STOPS" }
  | { type: "TOGGLE_SIGN" }
  | { type: "SET_SEC_SEARCH"; value: string }
  | { type: "OPEN_SEC_ORDER"; id: string }
  | { type: "BACK_TO_SEC_LIST" }
  | { type: "TOGGLE_SEC_LINE"; key: string }
  | { type: "SET_REP_PERIOD"; period: RepPeriod }
  | { type: "SET_STOCK_SEARCH"; value: string }
  | { type: "SET_STOCK_FILTER"; filter: StockFilter };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.value };
    case "SET_MODULE":
      return { ...state, module: action.module };
    case "SET_CATEGORY":
      return { ...state, cat: action.cat };
    case "ADD_TO_CART":
      return { ...state, cart: { ...state.cart, [action.pid]: (state.cart[action.pid] || 0) + 1 } };
    case "SUB_FROM_CART":
      return { ...state, cart: { ...state.cart, [action.pid]: Math.max(0, (state.cart[action.pid] || 0) - 1) } };
    case "REMOVE_FROM_CART":
      return { ...state, cart: { ...state.cart, [action.pid]: 0 } };
    case "TOGGLE_CART":
      return { ...state, cartOpen: !state.cartOpen };
    case "SET_CART_OPEN":
      return { ...state, cartOpen: action.open };
    case "SET_DELIVERY_WINDOW":
      return { ...state, deliveryWindow: action.window };
    case "ORDER_SUBMITTED":
      // Le créneau n'est pas réinitialisé : l'écran de confirmation l'affiche, et
      // un client recommande le plus souvent sur la même tranche horaire.
      return { ...state, orderSent: true, lastOrderId: action.orderLabel, cart: {}, cartOpen: false };
    case "NEW_ORDER":
      return { ...state, orderSent: false };
    case "SET_PREP_VIEW":
      return { ...state, prepView: action.view };
    case "OPEN_PREP_ORDER":
      return { ...state, prepView: "pick", activeOrderId: action.id, flagOpen: null };
    case "BACK_TO_PREP_LIST":
      return { ...state, prepView: "list", activeOrderId: null, flagOpen: null };
    case "SET_FLAG":
      return { ...state, flagOpen: action.key };
    case "SET_LIV_VIEW":
      return { ...state, livView: action.view };
    case "OPEN_STOP":
      return { ...state, livView: "detail", activeStopId: action.id };
    case "BACK_TO_STOPS":
      return { ...state, livView: "list", activeStopId: null };
    case "TOGGLE_SIGN":
      if (!state.activeStopId) return state;
      return { ...state, signed: { ...state.signed, [state.activeStopId]: !state.signed[state.activeStopId] } };
    case "SET_SEC_SEARCH":
      return { ...state, secSearch: action.value };
    case "OPEN_SEC_ORDER":
      return { ...state, secView: "check", secOrderId: action.id };
    case "BACK_TO_SEC_LIST":
      return { ...state, secView: "list", secOrderId: null };
    case "TOGGLE_SEC_LINE":
      return { ...state, secChecked: { ...state.secChecked, [action.key]: !state.secChecked[action.key] } };
    case "SET_REP_PERIOD":
      return { ...state, repPeriod: action.period };
    case "SET_STOCK_SEARCH":
      return { ...state, stockSearch: action.value };
    case "SET_STOCK_FILTER":
      return { ...state, stockFilter: action.filter };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function GnanamStoreProvider({
  initialModule,
  children,
}: {
  initialModule: ModuleId;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialModule, makeInitialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useGnanamStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useGnanamStore must be used within GnanamStoreProvider");
  return ctx;
}
