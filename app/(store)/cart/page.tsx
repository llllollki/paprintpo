"use client";

// /cart — full cart review page.
// Reads from CartContext (localStorage-backed). No server data fetch needed.
// Quantity edits trigger repricing via the cart reducer (crosses tier thresholds).
// Checkout button is placeholder — Stripe is not wired yet.

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/pricing";

function toLabel(groupName: string) {
  return groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/-/g, " ");
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotalCents, hydrated } =
    useCart();

  if (!hydrated) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>
        <p className="text-sm text-gray-400">Loading…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <Link
          href="/products"
          className="text-sm font-medium text-gray-900 underline underline-offset-2"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      {/* Line items */}
      <div className="divide-y divide-gray-200 border-t border-b border-gray-200 mb-8">
        {items.map((item) => (
          <div key={item.id} className="py-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">{item.productName}</p>

              {/* Selected options */}
              {Object.entries(item.optionLabels).length > 0 && (
                <ul className="text-xs text-gray-500 space-y-0.5">
                  {Object.entries(item.optionLabels).map(([group, label]) => (
                    <li key={group}>
                      <span className="text-gray-400">{toLabel(group)}:</span>{" "}
                      {label}
                    </li>
                  ))}
                </ul>
              )}

              {/* Quantity + remove */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`qty-${item.id}`}
                    className="text-xs text-gray-500"
                  >
                    Qty
                  </label>
                  <input
                    id={`qty-${item.id}`}
                    type="number"
                    min={item.minQty}
                    defaultValue={item.quantity}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= item.minQty) {
                        updateQuantity(item.id, val);
                      } else {
                        // Reset input to current quantity if invalid
                        e.target.value = String(item.quantity);
                      }
                    }}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Prices */}
            <div className="text-right space-y-1 min-w-[120px]">
              <p className="font-semibold text-gray-900">
                {formatCents(item.lineTotalCents)}
              </p>
              <p className="text-xs text-gray-400">
                {formatCents(item.unitPriceCents)} × {item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex flex-col items-end gap-4">
        <div className="w-full sm:w-72 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCents(subtotalCents)}</span>
          </div>
          <p className="text-xs text-gray-400">
            Taxes and shipping calculated at checkout.
          </p>
        </div>

        {/* Checkout — placeholder */}
        <button
          disabled
          className="w-full sm:w-72 rounded bg-gray-900 px-4 py-3 text-sm font-semibold text-white opacity-40 cursor-not-allowed"
          title="Stripe checkout coming soon"
        >
          Proceed to Checkout — coming soon
        </button>

        <Link
          href="/products"
          className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
