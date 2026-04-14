"use client";

// Clears localStorage cart on mount — rendered only after a confirmed order.
// Lives in a client component because useCart requires React context.

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

export function ClearCart() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
