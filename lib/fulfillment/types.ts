// Core types for the fulfillment adapter system.
// Adapters translate our internal order representation into vendor-specific API calls.
// All monetary values are cents (integer), matching the rest of the codebase.

// ---------------------------------------------------------------------------
// Shared value types
// ---------------------------------------------------------------------------

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// ---------------------------------------------------------------------------
// Order representation passed to adapters
// ---------------------------------------------------------------------------

export interface FulfillmentOrderItem {
  orderItemId: string;
  productId: string;
  vendorProductId: string; // from product_vendor_mappings.vendor_product_id
  vendorSku?: string;       // from product_vendor_mappings.vendor_sku
  quantity: number;
  optionsSnapshot: Record<string, string>;
}

export interface FulfillmentOrder {
  orderId: string;
  recipientName: string; // orders.customerName — no separate shipping name for this MVP
  shippingAddress: ShippingAddress;
  items: FulfillmentOrderItem[];
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export interface FulfillmentQuoteResult {
  vendorId: string;
  quotedCents: number;   // vendor's production cost
  shippingCents: number;
  turnaroundDays?: number;
  rawResponse?: unknown; // full vendor API response, stored verbatim for auditing
}

// Normalized quote model — router normalizes all vendor responses to this shape
// so domain logic never depends on vendor-specific field names.
export interface NormalizedQuoteResult {
  vendorId: string;
  itemCost: number;           // vendor production cost in cents
  shippingCost: number;       // shipping cost in cents
  totalLandedCost: number;    // itemCost + shippingCost
  productionTimeDays: number;
  deliveryEta?: string;       // ISO 8601 date string, when available
  currency: string;           // ISO 4217, e.g. "USD"
  rawResponse?: unknown;
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

export interface FulfillmentSubmissionResult {
  vendorOrderId: string;
  status: "accepted" | "rejected";
  rawResponse?: unknown;
}

// ---------------------------------------------------------------------------
// Inbound webhook
// ---------------------------------------------------------------------------

export interface FulfillmentWebhookResult {
  eventType: string;
  orderId: string;    // our internal order ID (must be extracted from vendor payload)
  processed: boolean;
}

// ---------------------------------------------------------------------------
// Adapter interface
// Every vendor integration must implement this.
// ---------------------------------------------------------------------------

export interface FulfillmentAdapter {
  /** Stable vendor identifier — matches vendor_id in DB (e.g. "printify"). */
  readonly vendorId: string;

  /** Request a production + shipping quote without placing an order. */
  getQuote(order: FulfillmentOrder): Promise<FulfillmentQuoteResult>;

  /** Submit the order to the vendor. Called once after admin selects this vendor. */
  submitOrder(order: FulfillmentOrder): Promise<FulfillmentSubmissionResult>;

  /**
   * Handle an inbound vendor webhook.
   * rawBody and signature are provided for HMAC verification.
   * Implementations should verify the signature before processing the payload.
   */
  handleWebhook(
    payload: unknown,
    rawBody: string,
    signature: string
  ): Promise<FulfillmentWebhookResult>;
}
