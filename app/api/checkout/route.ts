// POST /api/checkout
// 1. Validates cart items + contact info (Zod)
// 2. Re-derives pricing server-side — client prices are untrusted
// 3. Creates order + order_items rows (status = pending)
// 4. Creates Stripe Checkout Session; stores session ID on order
// 5. Returns { url } for client redirect

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderItems, productOptions, quantityTiers } from "@/lib/db/schema";
import { getProductBySlug } from "@/lib/db/queries";
import { calculatePrice } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const CartItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  slug: z.string().min(1),
  selectedOptions: z.record(z.string()),
  quantity: z.number().int().positive(),
  // Client-supplied prices are ignored for calculation but validated for shape
  unitPriceCents: z.number().int().nonnegative(),
  lineTotalCents: z.number().int().nonnegative(),
  // Stored for repricing
  basePrice: z.number().int().nonnegative(),
  optionModifiers: z.array(z.number().int()),
  tiers: z.array(z.object({ minQty: z.number().int(), unitPrice: z.number().int() })),
  optionLabels: z.record(z.string()),
  minQty: z.number().int().positive(),
  category: z.string(),
  id: z.string(),
});

const ShippingAddressSchema = z.object({
  line1:      z.string().min(1, "Address is required"),
  line2:      z.string().optional().default(""),
  city:       z.string().min(1, "City is required"),
  state:      z.string().min(1, "State / region is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country:    z.string().min(1, "Country is required"),
});

const CheckoutBodySchema = z.object({
  customerName:    z.string().min(1, "Full name is required"),
  customerEmail:   z.string().email("Valid email is required"),
  shippingAddress: ShippingAddressSchema,
  items:           z.array(CartItemSchema).min(1, "Cart is empty"),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // 1. Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CheckoutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { customerName, customerEmail, shippingAddress, items } = parsed.data;

  // 2. Re-derive pricing server-side for every cart item
  const revalidatedItems = await Promise.all(
    items.map(async (item) => {
      // Fetch live product data
      const product = await getProductBySlug(item.slug);
      if (!product || !product.active) {
        throw new Error(`Product not found or inactive: ${item.slug}`);
      }

      // Fetch live option modifiers for the selected options
      const allOptions = await db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, product.id));

      const resolvedModifiers: number[] = [];
      for (const [groupName, value] of Object.entries(item.selectedOptions)) {
        const opt = allOptions.find(
          (o) => o.groupName === groupName && o.value === value
        );
        if (opt) resolvedModifiers.push(opt.priceModifier);
      }

      // Fetch live quantity tiers
      const tiers = await db
        .select()
        .from(quantityTiers)
        .where(eq(quantityTiers.productId, product.id));

      const { unitPrice, lineTotal } = calculatePrice({
        basePrice: product.basePrice,
        optionModifiers: resolvedModifiers,
        quantityTiers: tiers,
        quantity: item.quantity,
      });

      return {
        ...item,
        unitPriceCents: unitPrice,
        lineTotalCents: lineTotal,
        productNameSnapshot: product.name,
        productId: product.id,
      };
    })
  );

  const subtotalCents = revalidatedItems.reduce(
    (sum, i) => sum + i.lineTotalCents,
    0
  );
  // Total equals subtotal for now; tax/shipping applied at Stripe level later
  const totalCents = subtotalCents;

  // 3. Create order row
  const [order] = await db
    .insert(orders)
    .values({
      customerName,
      customerEmail,
      status: "pending",
      subtotalCents,
      totalCents,
      shippingAddress,
    })
    .returning();

  // 4. Create order_items rows
  await db.insert(orderItems).values(
    revalidatedItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      optionsSnapshot: item.selectedOptions,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    }))
  );

  // 5. Create Stripe Checkout Session.
  // If Stripe throws, mark the order cancelled so it does not sit as a stray
  // pending row. The order_items are preserved for debugging.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      metadata: { orderId: order.id },
      line_items: revalidatedItems.map((item) => ({
        price_data: {
          currency: "usd",
          unit_amount: item.unitPriceCents,
          product_data: {
            name: item.productNameSnapshot,
            description: Object.entries(item.optionLabels)
              .map(([g, l]) => `${g}: ${l}`)
              .join(", ") || undefined,
          },
        },
        quantity: item.quantity,
      })),
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
    });
  } catch {
    await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, order.id));
    return NextResponse.json(
      { error: "Payment provider unavailable. Please try again." },
      { status: 502 }
    );
  }

  // 6. Store Stripe session ID on the order
  await db
    .update(orders)
    .set({ stripeSessionId: session.id })
    .where(eq(orders.id, order.id));

  return NextResponse.json({ url: session.url });
}
