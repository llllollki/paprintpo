// Fulfillment adapter registration.
// Import and register each vendor adapter here.
// Phase D: gate the stub behind NODE_ENV !== "production" once a real adapter exists.

import { registerAdapter } from "./registry";
import { StubAdapter } from "./adapters/stub";

// Only register the stub in non-production environments.
// In production, real vendor adapters (Cloudprinter) must be registered instead.
// STUB: replace with real Cloudprinter adapter registration once CLOUDPRINTER_API_KEY is available.
if (process.env.NODE_ENV !== "production") {
  registerAdapter(new StubAdapter());
}

// ---------------------------------------------------------------------------
// Margin policy
// ---------------------------------------------------------------------------

// Minimum acceptable margin in cents before a vendor submission is blocked.
// If the quote leaves less than this margin, submitToVendor() throws and the
// admin sees a fulfillment_failed status rather than a money-losing submission.
// Adjust this before go-live once real Cloudprinter costs are known.
export const MIN_MARGIN_CENTS = 500; // $5.00
