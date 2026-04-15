// Fulfillment adapter registry.
// Adapters are registered at startup via lib/fulfillment/config.ts.
// The registry is a plain Map — no framework magic, easy to test.

import type { FulfillmentAdapter } from "./types";

const adapters = new Map<string, FulfillmentAdapter>();

export function registerAdapter(adapter: FulfillmentAdapter): void {
  adapters.set(adapter.vendorId, adapter);
}

export function getAdapter(vendorId: string): FulfillmentAdapter | undefined {
  return adapters.get(vendorId);
}

export function listAdapters(): FulfillmentAdapter[] {
  return Array.from(adapters.values());
}
