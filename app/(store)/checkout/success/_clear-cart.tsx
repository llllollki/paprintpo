"use client";

// Clears localStorage cart on mount — rendered only after a confirmed order.
// Lives in a client component because useCart requires React context.

import { useEffect } from "react";
import { useCart, STORAGE_KEY } from "@/lib/cart";

export function ClearCart() {
  const { clearCart } = useCart();
  useEffect(() => {
    // Remove from localStorage first so CartProvider's hydration effect (which
    // runs after this child effect) reads nothing and does not restore the items.
    localStorage.removeItem(STORAGE_KEY);
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
