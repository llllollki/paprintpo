"use client";

// Minimal slide-in cart drawer. Triggered from StoreNav.
// Shows item names, quantities, subtotal, and a link to /cart.
// Complex cart management (edit quantity, remove) lives on /cart.

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/pricing";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, subtotalCents } = useCart();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-80 bg-white z-30 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Cart {items.length > 0 && `(${items.length})`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 mt-4">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="text-sm border-b border-gray-100 pb-3 last:border-0"
              >
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {Object.values(item.optionLabels).join(" · ")}
                </p>
                <div className="flex justify-between mt-1 text-gray-700">
                  <span>Qty {item.quantity}</span>
                  <span>{formatCents(item.lineTotalCents)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-sm font-semibold text-gray-900">
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full text-center rounded bg-gray-900 text-white text-sm font-semibold py-2.5 hover:bg-gray-700 transition-colors"
            >
              View Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
