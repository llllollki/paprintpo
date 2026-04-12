// Stripe webhook handler — updates order status after payment events.
// Must be called with raw body (not parsed JSON) for signature verification.
import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  // TODO:
  // 1. Verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET
  // 2. Handle checkout.session.completed → mark order paid, trigger artwork_review status
  // 3. Handle payment_intent.payment_failed → mark order payment_failed
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
