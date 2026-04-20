"use client";

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
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />

      <aside className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col bg-white" style={{ boxShadow: "var(--shadow-lg)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
            Cart {items.length > 0 && <span style={{ color: "var(--violet)" }}>({items.length})</span>}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors"
            style={{ background: "var(--surface)", color: "var(--ink-soft)" }}
            aria-label="Close cart"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center pt-10">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "var(--surface)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--violet)" }}>
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Your cart is empty.</p>
            </div>
          ) : (() => {
            // Group items by bundleId; items without a bundleId are individual
            const bundleGroups = new Map<string, { bundleName: string; items: typeof items }>();
            const individualItems: typeof items = [];

            for (const item of items) {
              if (item.bundleId) {
                const existing = bundleGroups.get(item.bundleId);
                if (existing) {
                  existing.items.push(item);
                } else {
                  bundleGroups.set(item.bundleId, {
                    bundleName: item.bundleName ?? "Bundle",
                    items: [item],
                  });
                }
              } else {
                individualItems.push(item);
              }
            }

            return (
              <>
                {/* Bundle groups */}
                {[...bundleGroups.entries()].map(([bundleId, group]) => (
                  <div key={bundleId} className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(98,70,234,0.2)", background: "rgba(98,70,234,0.03)" }}>
                    <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(98,70,234,0.12)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--violet)" }}>
                        Bundle
                      </p>
                      <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{group.bundleName}</p>
                    </div>
                    <div className="px-3 py-2 space-y-2">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-xs">
                          <div>
                            <p style={{ color: "var(--ink)" }}>{item.productName}</p>
                            <p style={{ color: "var(--ink-soft)" }}>Qty {item.quantity}</p>
                          </div>
                          <span className="font-semibold flex-shrink-0 ml-2" style={{ color: "var(--ink)" }}>
                            {formatCents(item.lineTotalCents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Individual items */}
                {individualItems.map((item) => (
                  <div key={item.id} className="pb-3 last:pb-0" style={{ borderBottom: "1px solid var(--border)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{item.productName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                      {Object.values(item.optionLabels).join(" · ")}
                    </p>
                    <div className="flex justify-between mt-1 text-sm">
                      <span style={{ color: "var(--ink-soft)" }}>Qty {item.quantity}</span>
                      <span className="font-semibold" style={{ color: "var(--ink)" }}>{formatCents(item.lineTotalCents)}</span>
                    </div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex justify-between text-sm font-bold" style={{ color: "var(--ink)" }}>
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full text-center rounded-lg py-3 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "var(--violet)" }}
            >
              View Cart &amp; Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
