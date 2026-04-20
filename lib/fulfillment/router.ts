// Fulfillment routing engine — the ONLY module allowed to access vendor adapters.
// All fulfillment calls in service.ts must go through this module.
// Importing from registry.ts or adapters/ directly outside this file is forbidden.
//
// MVP: always routes to all registered adapters (Cloudprinter stub at dev time).
// Post-MVP routing criteria: item cost, shipping cost, total landed cost,
// production time, delivery ETA, geography, vendor reliability, margin.
// Single vendor per order at MVP — no split fulfillment.

import { listAdapters, getAdapter } from "./registry";
import type { FulfillmentAdapter } from "./types";
import "./config"; // register adapters at import time — service.ts must not import config directly

/**
 * Returns all adapters eligible to receive quote requests.
 * MVP: all registered adapters.
 * Future: filter by routing criteria (geography, product capability, SLA, etc.).
 */
export function getQuoteAdapters(): FulfillmentAdapter[] {
  return listAdapters();
}

/**
 * Returns the adapter for a given vendor ID, used after admin confirms a vendor.
 * Returns undefined if no adapter is registered for that vendor.
 */
export function getSubmitAdapter(vendorId: string): FulfillmentAdapter | undefined {
  return getAdapter(vendorId);
}
