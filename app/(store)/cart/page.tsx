"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/pricing";
import { toLabel } from "@/lib/format";
import type { CartItem } from "@/lib/cart";

const inputCls = "w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all";
const inputStyle = { border: "1.5px solid var(--border)", color: "var(--ink)", background: "white" };

function Field({
  id, label, type = "text", autoComplete, value, onChange, error, optional,
}: {
  id: string; label: string; type?: string; autoComplete?: string;
  value: string; onChange: (v: string) => void; error?: string; optional?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium" style={{ color: "var(--ink-soft)" }}>
        {label} {optional && <span style={{ color: "var(--ink-soft)", opacity: 0.6 }}>(optional)</span>}
      </label>
      <input
        id={id} type={type} autoComplete={autoComplete} value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        style={{ ...inputStyle, borderColor: error ? "#f87171" : "var(--border)" }}
        onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "var(--violet)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? "#f87171" : "var(--border)"; }}
      />
      {error && <p className="text-xs" style={{ color: "#b91c1c" }}>{error}</p>}
    </div>
  );
}

// Group cart items by bundleId; ungrouped items are returned individually.
function groupItems(items: CartItem[]) {
  const bundles = new Map<string, { bundleName: string; items: CartItem[] }>();
  const individual: CartItem[] = [];
  for (const item of items) {
    if (item.bundleId) {
      const g = bundles.get(item.bundleId);
      if (g) g.items.push(item);
      else bundles.set(item.bundleId, { bundleName: item.bundleName ?? "Bundle", items: [item] });
    } else {
      individual.push(item);
    }
  }
  return { bundles, individual };
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotalCents, hydrated } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrCountry, setAddrCountry] = useState("US");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!hydrated) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-extrabold mb-6" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
          Your Cart
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Loading…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--surface)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--violet)" }}>
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <h1 className="text-xl font-extrabold mb-2" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
          Your cart is empty
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--ink-soft)" }}>
          Add some products to get started.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white"
          style={{ background: "var(--violet)" }}
        >
          Browse products
        </Link>
      </main>
    );
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!customerName.trim()) next.name = "Full name is required";
    if (!customerEmail.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) next.email = "Enter a valid email address";
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
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName, customerEmail,
          shippingAddress: { line1: addrLine1, line2: addrLine2, city: addrCity, state: addrState, postalCode: addrPostal, country: addrCountry },
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
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-extrabold mb-8" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
        Your Cart
      </h1>

      {/* Line items */}
      {(() => {
        const { bundles: bundleGroups, individual } = groupItems(items);

        function renderItem(item: CartItem) {
          return (
            <div key={item.id} className="py-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="space-y-1">
                <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{item.productName}</p>
                {Object.entries(item.optionLabels).length > 0 && (
                  <ul className="text-xs space-y-0.5" style={{ color: "var(--ink-soft)" }}>
                    {Object.entries(item.optionLabels).map(([group, label]) => (
                      <li key={group}>
                        <span style={{ opacity: 0.6 }}>{toLabel(group)}:</span> {label}
                      </li>
                    ))}
                  </ul>
                )}
                {item.artworkFile && (
                  <p className="text-xs flex items-center gap-1" style={{ color: "var(--ink-soft)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#22c55e", flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item.artworkFile.filename}
                  </p>
                )}
                <div className="flex items-center gap-4 pt-2">
                  {!item.bundleId && (
                    <div className="flex items-center gap-2">
                      <label htmlFor={`qty-${item.id}`} className="text-xs" style={{ color: "var(--ink-soft)" }}>Qty</label>
                      <input
                        id={`qty-${item.id}`} type="number" min={item.minQty} defaultValue={item.quantity}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= item.minQty) updateQuantity(item.id, val);
                          else e.target.value = String(item.quantity);
                        }}
                        className="w-20 rounded-lg px-2.5 py-1.5 text-sm outline-none"
                        style={{ border: "1.5px solid var(--border)", color: "var(--ink)" }}
                      />
                    </div>
                  )}
                  {item.bundleId && (
                    <span className="text-xs" style={{ color: "var(--ink-soft)" }}>Qty {item.quantity}</span>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs font-medium transition-colors hover:opacity-70"
                    style={{ color: "#ef4444" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right space-y-1 min-w-[120px]">
                <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{formatCents(item.lineTotalCents)}</p>
                <p className="text-xs" style={{ color: "var(--ink-soft)" }}>{formatCents(item.unitPriceCents)} × {item.quantity}</p>
              </div>
            </div>
          );
        }

        return (
          <div className="mb-8" style={{ borderTop: "1px solid var(--border)" }}>
            {/* Bundle groups */}
            {[...bundleGroups.entries()].map(([bundleId, group]) => (
              <div key={bundleId} className="mb-2">
                <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--violet)" }}>Bundle</p>
                    <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{group.bundleName}</p>
                  </div>
                  <button
                    onClick={() => group.items.forEach((i) => removeItem(i.id))}
                    className="text-xs font-medium hover:opacity-70"
                    style={{ color: "#ef4444" }}
                  >
                    Remove bundle
                  </button>
                </div>
                <div className="pl-4" style={{ borderLeft: "3px solid rgba(98,70,234,0.15)" }}>
                  {group.items.map(renderItem)}
                </div>
              </div>
            ))}

            {/* Individual items */}
            {individual.map(renderItem)}
          </div>
        );
      })()}

      {/* Form */}
      <form onSubmit={handleCheckout} noValidate>
        <div className="flex flex-col items-end gap-6">
          {/* Subtotal */}
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm font-semibold" style={{ color: "var(--ink)" }}>
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>Taxes and shipping calculated at checkout.</p>
          </div>

          {/* Contact */}
          <div className="w-full sm:w-72 space-y-3">
            <p className="text-sm font-semibold" style={{ color: "var(--ink)", fontFamily: "var(--font-head)" }}>Contact information</p>
            <Field id="customerName" label="Full name" autoComplete="name" value={customerName} onChange={setCustomerName} error={errors.name} />
            <Field id="customerEmail" label="Email" type="email" autoComplete="email" value={customerEmail} onChange={setCustomerEmail} error={errors.email} />
          </div>

          {/* Shipping */}
          <div className="w-full sm:w-72 space-y-3">
            <p className="text-sm font-semibold" style={{ color: "var(--ink)", fontFamily: "var(--font-head)" }}>Shipping address</p>
            <Field id="addrLine1" label="Street address" autoComplete="address-line1" value={addrLine1} onChange={setAddrLine1} error={errors.line1} />
            <Field id="addrLine2" label="Apt / suite / unit" autoComplete="address-line2" value={addrLine2} onChange={setAddrLine2} optional />
            <div className="grid grid-cols-2 gap-3">
              <Field id="addrCity" label="City" autoComplete="address-level2" value={addrCity} onChange={setAddrCity} error={errors.city} />
              <Field id="addrState" label="State / region" autoComplete="address-level1" value={addrState} onChange={setAddrState} error={errors.state} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field id="addrPostal" label="Postal code" autoComplete="postal-code" value={addrPostal} onChange={setAddrPostal} error={errors.postalCode} />
              <Field id="addrCountry" label="Country" autoComplete="country-name" value={addrCountry} onChange={setAddrCountry} error={errors.country} />
            </div>
          </div>

          {errors.server && (
            <p className="w-full sm:w-72 text-xs px-3 py-2 rounded-lg" style={{ color: "#b91c1c", background: "#fef2f2" }}>
              {errors.server}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full sm:w-72 rounded-lg py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--violet)" }}
          >
            {loading ? "Redirecting to payment…" : "Proceed to Checkout"}
          </button>

          <Link href="/products" className="text-sm font-medium hover:underline" style={{ color: "var(--ink-soft)" }}>
            Continue shopping
          </Link>
        </div>
      </form>
    </main>
  );
}
