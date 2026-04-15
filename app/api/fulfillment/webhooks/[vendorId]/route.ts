// POST /api/fulfillment/webhooks/[vendorId]
// Receives inbound webhook events from print vendors.
// Each vendor's adapter handles signature verification and payload parsing.
// Phase D will wire up real adapter implementations.

import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/fulfillment/registry";
import "@/lib/fulfillment/config"; // ensure adapters are registered

interface RouteContext {
  params: Promise<{ vendorId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { vendorId } = await params;
  const adapter = getAdapter(vendorId);

  if (!adapter) {
    return NextResponse.json({ error: "Unknown vendor" }, { status: 404 });
  }

  // TODO: Phase D — delegate to adapter.handleWebhook()
  // const rawBody = await request.text();
  // const signature = request.headers.get("x-vendor-signature") ?? "";
  // const payload = JSON.parse(rawBody);
  // const result = await adapter.handleWebhook(payload, rawBody, signature);
  // ... persist fulfillment_events row and update order status

  return NextResponse.json({ received: true });
}
