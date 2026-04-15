"use client";

// /cart — full cart review page with inline contact form.
// Reads from CartContext (localStorage-backed).
// Quantity edits trigger repricing via the cart reducer (crosses tier thresholds).
// Contact form (name + email) is submitted inline; on success the cart is cleared
// and the browser is redirected to Stripe Checkout.

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/pricing";

function toLabel(groupName: string) {
  return groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/-/g, " ");
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotalCents, hydrated } =
    useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrCountry, setAddrCountry] = useState("US");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    server?: string;
  }>({});
  const [loading, setLoading] = useState(false);

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

  function validate() {
    const next: typeof errors = {};
    if (!customerName.trim()) next.name = "Full name is required";
    if (!customerEmail.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      next.email = "Enter a valid email address";
    }
    if (!addrLine1.trim()) next.line1 = "Street address is required";
    if (!addrCity.trim()) next.city = "City is required";
    if (!addrState.trim()) next.state = "State / region is required";
    if (!addrPostal.trim()) next.postalCode = "Postal code is required";
    if (!addrCountry.trim()) next.country = "Country is required";
    return next;
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          shippingAddress: {
            line1: addrLine1,
            line2: addrLine2,
            city: addrCity,
            state: addrState,
            postalCode: addrPostal,
            country: addrCountry,
          },
          items,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ server: data.error ?? "Checkout failed. Please try again." });
        setLoading(false);
        return;
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setErrors({ server: "Network error. Please check your connection and try again." });
      setLoading(false);
    }
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

      {/* Summary + contact form */}
      <form onSubmit={handleCheckout} noValidate>
        <div className="flex flex-col items-end gap-6">
          {/* Order total */}
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            <p className="text-xs text-gray-400">
              Taxes and shipping calculated at checkout.
            </p>
          </div>

          {/* Contact fields */}
          <div className="w-full sm:w-72 space-y-3">
            <p className="text-sm font-medium text-gray-800">Contact information</p>

            <div className="space-y-1">
              <label htmlFor="customerName" className="block text-xs text-gray-500">
                Full name
              </label>
              <input
                id="customerName"
                type="text"
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="customerEmail" className="block text-xs text-gray-500">
                Email
              </label>
              <input
                id="customerEmail"
                type="email"
                autoComplete="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.email ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Shipping address */}
          <div className="w-full sm:w-72 space-y-3">
            <p className="text-sm font-medium text-gray-800">Shipping address</p>

            <div className="space-y-1">
              <label htmlFor="addrLine1" className="block text-xs text-gray-500">
                Street address
              </label>
              <input
                id="addrLine1"
                type="text"
                autoComplete="address-line1"
                value={addrLine1}
                onChange={(e) => setAddrLine1(e.target.value)}
                className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.line1 ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.line1 && (
                <p className="text-xs text-red-500">{errors.line1}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="addrLine2" className="block text-xs text-gray-500">
                Apt / suite / unit <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="addrLine2"
                type="text"
                autoComplete="address-line2"
                value={addrLine2}
                onChange={(e) => setAddrLine2(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="addrCity" className="block text-xs text-gray-500">
                  City
                </label>
                <input
                  id="addrCity"
                  type="text"
                  autoComplete="address-level2"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                    errors.city ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.city && (
                  <p className="text-xs text-red-500">{errors.city}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="addrState" className="block text-xs text-gray-500">
                  State / region
                </label>
                <input
                  id="addrState"
                  type="text"
                  autoComplete="address-level1"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                    errors.state ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.state && (
                  <p className="text-xs text-red-500">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="addrPostal" className="block text-xs text-gray-500">
                  Postal code
                </label>
                <input
                  id="addrPostal"
                  type="text"
                  autoComplete="postal-code"
                  value={addrPostal}
                  onChange={(e) => setAddrPostal(e.target.value)}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                    errors.postalCode ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.postalCode && (
                  <p className="text-xs text-red-500">{errors.postalCode}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="addrCountry" className="block text-xs text-gray-500">
                  Country
                </label>
                <input
                  id="addrCountry"
                  type="text"
                  autoComplete="country-name"
                  value={addrCountry}
                  onChange={(e) => setAddrCountry(e.target.value)}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                    errors.country ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.country && (
                  <p className="text-xs text-red-500">{errors.country}</p>
                )}
              </div>
            </div>
          </div>

          {/* Server error */}
          {errors.server && (
            <p className="w-full sm:w-72 text-xs text-red-500">{errors.server}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-72 rounded bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting to payment…" : "Proceed to Checkout"}
          </button>

          <Link
            href="/products"
            className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </form>
    </main>
  );
}
