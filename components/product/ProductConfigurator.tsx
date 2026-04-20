"use client";

// Client component — owns all interactive state for the product detail page:
//   - selected options (Record<groupName, value>)
//   - quantity
//   - live price (calculated via lib/pricing.ts on every state change)
//
// Receives product, options, and tiers as props from the server page component.
// Does not read from the DB or call any API — data is passed in at render time.

import { useState, useMemo } from "react";
import { calculatePrice, formatCents } from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import { OptionSelector } from "./OptionSelector";
import { FileUploader } from "./FileUploader";
import type { OptionGroup } from "./OptionSelector";
import type { Product, ProductOption, QuantityTier } from "@/lib/db/schema";
import type { ArtworkFile } from "@/lib/cart";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toOptionGroups(options: ProductOption[]): OptionGroup[] {
  const groupMap = new Map<string, OptionGroup>();
  for (const opt of options) {
    if (!groupMap.has(opt.groupName)) {
      groupMap.set(opt.groupName, {
        id: opt.groupName,
        name: opt.groupName,
        values: [],
        required: true,
      });
    }
    groupMap.get(opt.groupName)!.values.push({
      label: opt.label,
      value: opt.value,
      priceModifier: opt.priceModifier,
    });
  }
  return Array.from(groupMap.values());
}

// Build a groupName → display label map for the current selection.
function buildOptionLabels(
  options: ProductOption[],
  selected: Record<string, string>
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const opt of options) {
    if (selected[opt.groupName] === opt.value) {
      labels[opt.groupName] = opt.label;
    }
  }
  return labels;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  product: Product;
  options: ProductOption[];
  tiers: QuantityTier[];
}

export function ProductConfigurator({ product, options, tiers }: Props) {
  const { addItem } = useCart();
  const optionGroups = useMemo(() => toOptionGroups(options), [options]);

  const minQty = tiers.length > 0 ? Math.min(...tiers.map((t) => t.minQty)) : 1;

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(minQty);
  const [artworkFile, setArtworkFile] = useState<ArtworkFile | undefined>();
  const [added, setAdded] = useState(false);

  const optionModifiers = options
    .filter((o) => selected[o.groupName] === o.value)
    .map((o) => o.priceModifier);

  const pricing = calculatePrice({
    basePrice: product.basePrice,
    optionModifiers,
    quantityTiers: tiers,
    quantity,
  });

  const allGroupsSelected =
    optionGroups.length === 0 ||
    optionGroups.every((g) => selected[g.name] !== undefined);

  const canAddToCart = allGroupsSelected && !!artworkFile;

  function handleOptionChange(groupName: string, value: string) {
    setSelected((prev) => ({ ...prev, [groupName]: value }));
  }

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    setQuantity(isNaN(val) ? minQty : Math.max(minQty, val));
  }

  function handleAddToCart() {
    if (!canAddToCart) return;

    addItem({
      productId: product.id,
      productName: product.name,
      category: product.category,
      slug: product.slug,
      selectedOptions: selected,
      optionLabels: buildOptionLabels(options, selected),
      quantity,
      unitPriceCents: pricing.unitPrice,
      lineTotalCents: pricing.lineTotal,
      minQty,
      basePrice: product.basePrice,
      optionModifiers,
      tiers: tiers.map((t) => ({ minQty: t.minQty, unitPrice: t.unitPrice })),
      artworkFile,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Options */}
      <OptionSelector
        options={optionGroups}
        selected={selected}
        onChange={handleOptionChange}
      />

      {/* Quantity */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-head)" }}>
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={minQty}
          step={1}
          value={quantity}
          onChange={handleQuantityChange}
          className="block w-32 rounded-lg px-3.5 py-2.5 text-sm outline-none"
          style={{ border: "1.5px solid var(--border)", color: "var(--ink)" }}
        />
        {tiers.length > 0 && (
          <p className="mt-1 text-xs" style={{ color: "var(--ink-soft)" }}>
            Minimum order: {minQty} units
          </p>
        )}
      </div>

      {/* Price display */}
      <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex justify-between text-sm" style={{ color: "var(--ink-soft)" }}>
          <span>Unit price</span>
          <span>{formatCents(pricing.unitPrice)}</span>
        </div>
        <div className="flex justify-between font-bold text-base" style={{ color: "var(--ink)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
          <span>Total ({quantity} units)</span>
          <span style={{ color: "var(--violet)" }}>{formatCents(pricing.lineTotal)}</span>
        </div>
        {pricing.tierApplied && (
          <p className="text-xs font-medium" style={{ color: "var(--teal, #00c9a7)" }}>
            ✓ Volume pricing applied — {pricing.tierApplied.minQty}+ unit rate
          </p>
        )}
      </div>

      {/* Artwork upload */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--ink)", fontFamily: "var(--font-head)" }}>
          Artwork file <span style={{ color: "#ef4444" }}>*</span>
        </p>
        <FileUploader
          uploadedFile={artworkFile}
          onUploadComplete={setArtworkFile}
          onClear={() => setArtworkFile(undefined)}
        />
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={!canAddToCart || added}
        className="w-full rounded-lg px-4 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed"
        style={{
          background: added ? "#15803d" : "var(--violet)",
          opacity: added || canAddToCart ? 1 : 0.4,
        }}
      >
        {added
          ? "✓ Added to cart!"
          : !allGroupsSelected
          ? "Select all options to continue"
          : !artworkFile
          ? "Upload artwork to continue"
          : "Add to Cart"}
      </button>
    </div>
  );
}
