// Stripe webhook handler — updates order status after payment events.
// Must receive the raw request body (not parsed JSON) for signature verification.
// Register this URL in the Stripe dashboard: /api/webhooks/stripe

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  // Handle relevant events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        // Session not created by this app — ignore
        break;
      }

      await db
        .update(orders)
        .set({
          status: "paid",
          stripePaymentIntent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
        })
        .where(eq(orders.id, orderId));

      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;

      // Find order by payment_intent ID and mark payment_failed
      await db
        .update(orders)
        .set({ status: "payment_failed" })
        .where(eq(orders.stripePaymentIntent, intent.id));

      break;
    }

    default:
      // Unhandled event types are ignored — return 200 to acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
