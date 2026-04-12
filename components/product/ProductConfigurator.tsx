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
import { OptionSelector } from "./OptionSelector";
import { FileUploader } from "./FileUploader";
import type { OptionGroup } from "./OptionSelector";
import type { Product, ProductOption, QuantityTier } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Transform flat DB option rows into OptionGroup[] for OptionSelector.
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  product: Product;
  options: ProductOption[];
  tiers: QuantityTier[];
}

export function ProductConfigurator({ product, options, tiers }: Props) {
  const optionGroups = useMemo(() => toOptionGroups(options), [options]);

  const minQty = tiers.length > 0 ? Math.min(...tiers.map((t) => t.minQty)) : 1;

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(minQty);

  // Collect price modifiers for all currently selected options.
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
    optionGroups.length > 0 &&
    optionGroups.every((g) => selected[g.name] !== undefined);

  function handleOptionChange(groupName: string, value: string) {
    setSelected((prev) => ({ ...prev, [groupName]: value }));
  }

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    setQuantity(isNaN(val) ? minQty : Math.max(minQty, val));
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
        <label
          htmlFor="quantity"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={minQty}
          step={1}
          value={quantity}
          onChange={handleQuantityChange}
          className="block w-32 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        {tiers.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            Minimum order: {minQty} units
          </p>
        )}
      </div>

      {/* Price display */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Unit price</span>
          <span>{formatCents(pricing.unitPrice)}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900">
          <span>Total ({quantity} units)</span>
          <span>{formatCents(pricing.lineTotal)}</span>
        </div>
        {pricing.tierApplied && (
          <p className="text-xs text-green-700 pt-1">
            Volume pricing applied — {pricing.tierApplied.minQty}+ unit rate
          </p>
        )}
      </div>

      {/* Artwork upload placeholder */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Artwork file</p>
        <FileUploader onUploadComplete={() => {}} />
        <p className="mt-1 text-xs text-gray-400">
          Artwork upload is available at checkout once your order is placed.
        </p>
      </div>

      {/* Add to cart — placeholder */}
      <button
        disabled
        className="w-full rounded bg-gray-900 px-4 py-3 text-sm font-semibold text-white opacity-40 cursor-not-allowed"
        title={!allGroupsSelected ? "Select all options first" : "Coming soon"}
      >
        Add to Cart — coming soon
      </button>
    </div>
  );
}
