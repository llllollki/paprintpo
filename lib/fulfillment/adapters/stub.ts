// StubAdapter — development/testing only.
// Returns hardcoded responses without making any real API calls.
// Registered unconditionally in config.ts; Phase D will gate it behind NODE_ENV.

import type {
  FulfillmentAdapter,
  FulfillmentOrder,
  FulfillmentQuoteResult,
  FulfillmentSubmissionResult,
  FulfillmentWebhookResult,
} from "../types";

export class StubAdapter implements FulfillmentAdapter {
  readonly vendorId = "stub";

  async getQuote(_order: FulfillmentOrder): Promise<FulfillmentQuoteResult> {
    return {
      vendorId: this.vendorId,
      quotedCents: 1500,
      shippingCents: 800,
      turnaroundDays: 5,
      rawResponse: { stub: true, note: "Hardcoded stub quote" },
    };
  }

  async submitOrder(order: FulfillmentOrder): Promise<FulfillmentSubmissionResult> {
    return {
      vendorOrderId: `STUB-${Date.now()}`,
      status: "accepted",
      rawResponse: { stub: true, orderId: order.orderId },
    };
  }

  async handleWebhook(
    _payload: unknown,
    _rawBody: string,
    _signature: string
  ): Promise<FulfillmentWebhookResult> {
    return {
      eventType: "stub.noop",
      orderId: "",
      processed: false,
    };
  }
}
