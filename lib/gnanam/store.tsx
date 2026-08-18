"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type {
  AppState,
  ModuleId,
  PrepView,
  LivView,
  Order,
  OrderLine,
  RepPeriod,
  StockFilter,
  StockMove,
  StockMoveKind,
} from "./types";
import { INITIAL_ORDERS, INITIAL_STOCK, INITIAL_MOVES } from "./data";
import { consumedOf } from "./stock";

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
  nextNum: 1044,

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
  stock: INITIAL_STOCK,
  stockMoves: INITIAL_MOVES,
  moveSeq: INITIAL_MOVES.length,

  orders: INITIAL_ORDERS,
};

type Action =
  | { type: "SET_FIELD"; field: "search"; value: string }
  | { type: "SET_MODULE"; module: ModuleId }
  | { type: "SET_CATEGORY"; cat: string }
  | { type: "ADD_TO_CART"; pid: string }
  | { type: "SUB_FROM_CART"; pid: string }
  | { type: "REMOVE_FROM_CART"; pid: string }
  | { type: "TOGGLE_CART" }
  | { type: "SET_CART_OPEN"; open: boolean }
  | { type: "SUBMIT_ORDER" }
  | { type: "NEW_ORDER" }
  | { type: "SET_PREP_VIEW"; view: PrepView }
  | { type: "OPEN_PREP_ORDER"; id: string }
  | { type: "BACK_TO_PREP_LIST" }
  | { type: "TOGGLE_LINE"; orderId: string; idx: number }
  | { type: "SET_LINE_PARTIAL"; orderId: string; idx: number }
  | { type: "SET_LINE_MISSING"; orderId: string; idx: number }
  | { type: "RESET_LINE"; orderId: string; idx: number }
  | { type: "INC_PICKED"; orderId: string; idx: number }
  | { type: "DEC_PICKED"; orderId: string; idx: number }
  | { type: "TOGGLE_FLAG"; key: string }
  | { type: "FINISH_ORDER" }
  | { type: "SET_LIV_VIEW"; view: LivView }
  | { type: "OPEN_STOP"; id: string }
  | { type: "BACK_TO_STOPS" }
  | { type: "TOGGLE_SIGN" }
  | { type: "CONFIRM_DELIVERY" }
  | { type: "SET_SEC_SEARCH"; value: string }
  | { type: "OPEN_SEC_ORDER"; id: string }
  | { type: "BACK_TO_SEC_LIST" }
  | { type: "TOGGLE_SEC_LINE"; key: string }
  | { type: "RELEASE_SEC_ORDER"; agent: string }
  | { type: "SET_REP_PERIOD"; period: RepPeriod }
  | { type: "SET_STOCK_SEARCH"; value: string }
  | { type: "SET_STOCK_FILTER"; filter: StockFilter }
  | { type: "RECEIVE_STOCK"; pid: string; qty: number }
  | { type: "ADJUST_STOCK"; pid: string; delta: number };

function updOrder(orders: Order[], id: string, fn: (o: Order) => Order): Order[] {
  return orders.map((o) => (o.id === id ? fn(o) : o));
}

function updLine(orders: Order[], orderId: string, idx: number, fn: (l: OrderLine) => OrderLine): Order[] {
  return updOrder(orders, orderId, (o) => ({
    ...o,
    lines: o.lines.map((l, i) => (i === idx ? fn(l) : l)),
  }));
}

/** Nombre de mouvements conservés dans le journal temps réel. */
const MAX_MOVES = 40;

function nowLabel(): string {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Applique une variation de stock et l'inscrit en tête du journal des mouvements. */
function applyMove(
  state: AppState,
  move: { pid: string; delta: number; kind: StockMoveKind; label: string },
  orders?: Order[]
): AppState {
  const seq = state.moveSeq + 1;
  const entry: StockMove = { id: "m" + seq, time: nowLabel(), ...move };
  return {
    ...state,
    orders: orders ?? state.orders,
    stock: { ...state.stock, [move.pid]: Math.max(0, (state.stock[move.pid] ?? 0) + move.delta) },
    stockMoves: [entry, ...state.stockMoves].slice(0, MAX_MOVES),
    moveSeq: seq,
  };
}

/**
 * Met à jour une ligne de commande et répercute en temps réel sur le stock du dépôt
 * la marchandise qui vient d'être prélevée (ou remise en rayon).
 */
function applyLine(state: AppState, orderId: string, idx: number, fn: (l: OrderLine) => OrderLine): AppState {
  const order = state.orders.find((o) => o.id === orderId);
  const before = order?.lines[idx];
  if (!order || !before) return state;

  const after = fn(before);
  const orders = updLine(state.orders, orderId, idx, () => after);
  const out = consumedOf(after) - consumedOf(before);
  if (out === 0) return { ...state, orders };

  return applyMove(
    state,
    {
      pid: after.pid,
      delta: -out,
      kind: out > 0 ? "sortie" : "annulation",
      label: `${order.client} · ${order.id}`,
    },
    orders
  );
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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
    case "SUBMIT_ORDER": {
      const entries = Object.entries(state.cart).filter(([, q]) => q > 0);
      if (entries.length === 0) return state;
      const id = "CMD-" + state.nextNum;
      const newOrder: Order = {
        id,
        client: "Épicerie Mont Kailash",
        address: "48 rue du Faubourg St-Denis, 75010 Paris",
        window: "8h – 11h",
        status: "todo",
        lines: entries.map(([pid, qty]) => ({ pid, qty, status: "pending", picked: qty })),
      };
      return {
        ...state,
        orders: [newOrder, ...state.orders],
        orderSent: true,
        lastOrderId: id,
        nextNum: state.nextNum + 1,
        cart: {},
        cartOpen: false,
      };
    }
    case "NEW_ORDER":
      return { ...state, orderSent: false };
    case "SET_PREP_VIEW":
      return { ...state, prepView: action.view };
    case "OPEN_PREP_ORDER":
      return {
        ...state,
        orders: updOrder(state.orders, action.id, (o) => ({ ...o, status: o.status === "todo" ? "picking" : o.status })),
        prepView: "pick",
        activeOrderId: action.id,
        flagOpen: null,
      };
    case "BACK_TO_PREP_LIST":
      return { ...state, prepView: "list", flagOpen: null };
    case "TOGGLE_LINE":
      return {
        ...applyLine(state, action.orderId, action.idx, (l) => ({
          ...l,
          status: l.status === "done" ? "pending" : "done",
          picked: l.qty,
        })),
        flagOpen: null,
      };
    case "SET_LINE_PARTIAL":
      return {
        ...applyLine(state, action.orderId, action.idx, (l) => ({
          ...l,
          status: "partial",
          picked: Math.max(1, l.qty - 1),
        })),
        flagOpen: null,
      };
    case "SET_LINE_MISSING":
      return {
        ...applyLine(state, action.orderId, action.idx, (l) => ({ ...l, status: "missing", picked: 0 })),
        flagOpen: null,
      };
    case "RESET_LINE":
      return {
        ...applyLine(state, action.orderId, action.idx, (l) => ({ ...l, status: "pending", picked: l.qty })),
        flagOpen: null,
      };
    case "INC_PICKED":
      return applyLine(state, action.orderId, action.idx, (l) => ({
        ...l,
        picked: Math.min(l.qty - 1, l.picked + 1),
      }));
    case "DEC_PICKED":
      return applyLine(state, action.orderId, action.idx, (l) => ({ ...l, picked: Math.max(0, l.picked - 1) }));
    case "TOGGLE_FLAG":
      return { ...state, flagOpen: state.flagOpen === action.key ? null : action.key };
    case "FINISH_ORDER":
      if (!state.activeOrderId) return state;
      return {
        ...state,
        orders: updOrder(state.orders, state.activeOrderId, (o) => ({ ...o, status: "ready" })),
        prepView: "list",
      };
    case "SET_LIV_VIEW":
      return { ...state, livView: action.view };
    case "OPEN_STOP":
      return { ...state, livView: "detail", activeStopId: action.id };
    case "BACK_TO_STOPS":
      return { ...state, livView: "list" };
    case "TOGGLE_SIGN":
      if (!state.activeStopId) return state;
      return { ...state, signed: { ...state.signed, [state.activeStopId]: !state.signed[state.activeStopId] } };
    case "CONFIRM_DELIVERY": {
      if (!state.activeStopId || !state.signed[state.activeStopId]) return state;
      return {
        ...state,
        orders: updOrder(state.orders, state.activeStopId, (o) => ({ ...o, status: "delivered" })),
        livView: "list",
      };
    }
    case "SET_SEC_SEARCH":
      return { ...state, secSearch: action.value };
    case "OPEN_SEC_ORDER":
      return { ...state, secView: "check", secOrderId: action.id };
    case "BACK_TO_SEC_LIST":
      return { ...state, secView: "list" };
    case "TOGGLE_SEC_LINE":
      return { ...state, secChecked: { ...state.secChecked, [action.key]: !state.secChecked[action.key] } };
    case "RELEASE_SEC_ORDER": {
      if (!state.secOrderId) return state;
      const clearance = { at: nowLabel(), agent: action.agent };
      return {
        ...state,
        orders: updOrder(state.orders, state.secOrderId, (o) => ({ ...o, security: clearance })),
        secView: "list",
      };
    }
    case "SET_REP_PERIOD":
      return { ...state, repPeriod: action.period };
    case "SET_STOCK_SEARCH":
      return { ...state, stockSearch: action.value };
    case "SET_STOCK_FILTER":
      return { ...state, stockFilter: action.filter };
    case "RECEIVE_STOCK": {
      if (action.qty <= 0) return state;
      return applyMove(state, {
        pid: action.pid,
        delta: action.qty,
        kind: "reception",
        label: "Réception dépôt · saisie manuelle",
      });
    }
    case "ADJUST_STOCK": {
      if (action.delta === 0) return state;
      if (action.delta < 0 && (state.stock[action.pid] ?? 0) === 0) return state;
      return applyMove(state, {
        pid: action.pid,
        delta: action.delta,
        kind: "ajustement",
        label: action.delta > 0 ? "Correction inventaire (+)" : "Correction inventaire (−)",
      });
    }
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
