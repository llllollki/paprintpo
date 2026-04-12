// Pricing engine — the single source of truth for price calculation.
//
// Architecture note (refinement #3):
//   Product options (OptionSelector) describe *what* is configurable.
//   Pricing rules (this file) describe *how much* each configuration costs.
//   They are intentionally separate so pricing rules can later be stored in
//   the database, versioned, or replaced with a pricing API without touching
//   product option definitions.
//
// All monetary values are in cents (integer) to avoid floating-point errors.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// QuantityTier shape is now canonical in the DB schema.
// Imported for use in this file and re-exported so callers don't need to
// import from two places.
import type { QuantityTier } from "./db/schema";
export type { QuantityTier };

export interface SelectedOptions {
  size?: string;
  finish?: string;
  material?: string;
  sides?: string;
  turnaround?: string;
  [key: string]: string | undefined;
}

export interface PricingInput {
  basePrice: number;           // product base price in cents
  optionModifiers: number[];   // cents delta per selected option (from product_options.values)
  quantityTiers: QuantityTier[];
  quantity: number;
}

export interface PricingResult {
  unitPrice: number;   // cents — base + option modifiers, at the resolved tier
  lineTotal: number;   // cents — unitPrice × quantity
  tierApplied: QuantityTier | null;
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

/**
 * Resolves the best quantity tier for the given quantity and computes the
 * line total. The highest qualifying tier (largest minQty ≤ quantity) wins.
 */
export function calculatePrice(input: PricingInput): PricingResult {
  const { basePrice, optionModifiers, quantityTiers, quantity } = input;

  const optionTotal = optionModifiers.reduce((sum, mod) => sum + mod, 0);
  const adjustedBase = basePrice + optionTotal;

  // Find the best applicable tier
  const applicableTiers = quantityTiers
    .filter((t) => quantity >= t.minQty)
    .sort((a, b) => b.minQty - a.minQty);

  const tierApplied = applicableTiers[0] ?? null;

  // If a tier exists it overrides the adjusted base entirely;
  // the tier's unitPrice already accounts for volume discount.
  // If no tier applies, fall back to adjustedBase.
  const unitPrice = tierApplied ? tierApplied.unitPrice : adjustedBase;
  const lineTotal = unitPrice * quantity;

  return { unitPrice, lineTotal, tierApplied };
}

/**
 * Formats a cent value as a USD string (e.g. 1050 → "$10.50").
 * UI helper — keep formatting out of business logic callers.
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
