"use client";

// Cart state — React context + useReducer + localStorage persistence.
//
// CartItem stores everything needed to:
//   - display the item in the cart (productName, optionLabels, quantity, prices)
//   - reprice on quantity change (basePrice, optionModifiers, tiers)
//
// Persistence: localStorage key "print_cart". Written on every dispatch.
// Hydration: populated in useEffect after mount to avoid SSR mismatch.

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  createElement,
  type ReactNode,
} from "react";
import { calculatePrice } from "./pricing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartTier {
  minQty: number;
  unitPrice: number;
}

export interface CartItem {
  id: string;                              // client-generated uuid
  productId: string;
  productName: string;
  category: string;
  slug: string;
  selectedOptions: Record<string, string>; // groupName → selected value
  optionLabels: Record<string, string>;    // groupName → display label
  quantity: number;
  unitPriceCents: number;                  // recalculated on quantity change
  lineTotalCents: number;                  // unitPriceCents × quantity
  minQty: number;                          // minimum allowed quantity
  // Stored for repricing — not displayed
  basePrice: number;
  optionModifiers: number[];
  tiers: CartTier[];
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;       // sum of quantities, for nav badge
  subtotalCents: number;   // sum of lineTotalCents
  hydrated: boolean;       // false until localStorage is read; prevents cart flash
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: "ADD"; item: Omit<CartItem, "id"> }
  | { type: "REMOVE"; id: string }
  | { type: "UPDATE_QTY"; id: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function reprice(item: CartItem, quantity: number): CartItem {
  const clamped = Math.max(item.minQty, quantity);
  const { unitPrice, lineTotal } = calculatePrice({
    basePrice: item.basePrice,
    optionModifiers: item.optionModifiers,
    quantityTiers: item.tiers,
    quantity: clamped,
  });
  return {
    ...item,
    quantity: clamped,
    unitPriceCents: unitPrice,
    lineTotalCents: lineTotal,
  };
}

function reducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case "HYDRATE":
      return action.items;
    case "ADD":
      return [...state, { ...action.item, id: crypto.randomUUID() }];
    case "REMOVE":
      return state.filter((i) => i.id !== action.id);
    case "UPDATE_QTY":
      return state.map((i) =>
        i.id === action.id ? reprice(i, action.quantity) : i
      );
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const STORAGE_KEY = "print_cart";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useReducer(() => true, false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        dispatch({ type: "HYDRATE", items: parsed });
      }
    } catch {
      // Corrupted storage — start fresh
    }
    setHydrated();
  }, []);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    dispatch({ type: "ADD", item });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", id, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);

  return createElement(CartContext.Provider, {
    value: {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotalCents,
      hydrated,
    },
    children,
  });
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
