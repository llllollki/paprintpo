// Creates a Stripe Checkout Session from validated cart contents.
import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  // TODO:
  // 1. Parse and validate cart items from request body (with Zod)
  // 2. Re-derive pricing server-side using lib/pricing.ts (never trust client price)
  // 3. Create Stripe Checkout Session with line items
  // 4. Return { url } for client redirect
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
