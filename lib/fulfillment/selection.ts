// Quote ranking and recommendation engine.
// marginCents is pre-computed at quote creation time (order.totalCents − vendor cost).
// The engine picks the quote with the highest margin as the recommendation.

import type { FulfillmentQuote } from "@/lib/db/schema";

/**
 * Sort quotes by margin descending (best deal for us first).
 * Quotes with null marginCents are ranked last.
 */
export function rankQuotes(quotes: FulfillmentQuote[]): FulfillmentQuote[] {
  return [...quotes].sort((a, b) => (b.marginCents ?? -Infinity) - (a.marginCents ?? -Infinity));
}

/**
 * Return the single highest-margin quote, or null if the list is empty.
 */
export function pickRecommendation(quotes: FulfillmentQuote[]): FulfillmentQuote | null {
  return rankQuotes(quotes)[0] ?? null;
}
