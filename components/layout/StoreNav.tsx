"use client";

// Storefront navigation bar. Reads cart count from CartContext for the badge.
// Owns the CartDrawer open/close state — no global modal system needed.

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function StoreNav() {
  const { itemCount } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            Print Shop
          </Link>

          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/products"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Products
            </Link>

            <button
              onClick={() => setDrawerOpen(true)}
              className="relative flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label={`Cart, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            >
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="bg-gray-900 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
