// Fulfillment service — orchestrates quote requests and vendor submissions.
// Called from server actions; not a "use server" module itself.

import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  productVendorMappings,
  fulfillmentQuotes,
  fulfillmentSubmissions,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { listAdapters, getAdapter } from "./registry";
import { pickRecommendation } from "./selection";
import type { FulfillmentOrder, FulfillmentOrderItem } from "./types";
import "./config"; // ensure adapters are registered at import time

// ---------------------------------------------------------------------------
// requestQuotes
//
// For every registered adapter, requests a production quote and persists it.
// Sets orders.fulfillment_recommendation to the highest-margin result.
// Clears any previous quotes so each call is a fresh snapshot.
// ---------------------------------------------------------------------------

export async function requestQuotes(orderId: string): Promise<void> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const order = orderRows[0];

  if (!order) throw new Error(`Order ${orderId} not found`);
  if (!order.shippingAddress) {
    throw new Error(`Order ${orderId} has no shipping address — cannot request quotes`);
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const productIds = items
    .map((i) => i.productId)
    .filter((id): id is string => id !== null);

  // Delete existing quotes and clear any pending selection/recommendation.
  // The selection must reference a live quote row; wiping it here forces the
  // admin to re-confirm after every re-request, preventing stale quoteId refs.
  await db.delete(fulfillmentQuotes).where(eq(fulfillmentQuotes.orderId, orderId));
  await db
    .update(orders)
    .set({ fulfillmentSelection: null, fulfillmentRecommendation: null })
    .where(eq(orders.id, orderId));

  const adapters = listAdapters();
  if (adapters.length === 0) throw new Error("No fulfillment adapters registered");

  const savedQuotes: (typeof fulfillmentQuotes.$inferSelect)[] = [];

  for (const adapter of adapters) {
    // Load vendor-specific product mappings for this order's products.
    const mappings =
      productIds.length > 0
        ? await db
            .select()
            .from(productVendorMappings)
            .where(
              and(
                eq(productVendorMappings.vendorId, adapter.vendorId),
                inArray(productVendorMappings.productId, productIds)
              )
            )
        : [];

    const fulfillmentItems: FulfillmentOrderItem[] = items.map((item) => {
      const mapping = mappings.find((m) => m.productId === item.productId);
      return {
        orderItemId: item.id,
        productId: item.productId ?? "",
        vendorProductId: mapping?.vendorProductId ?? "",
        vendorSku: mapping?.vendorSku ?? undefined,
        quantity: item.quantity,
        optionsSnapshot: item.optionsSnapshot,
      };
    });

    const fulfillmentOrder: FulfillmentOrder = {
      orderId: order.id,
      recipientName: order.customerName,
      shippingAddress: order.shippingAddress,
      items: fulfillmentItems,
    };

    try {
      const quoteResult = await adapter.getQuote(fulfillmentOrder);
      const totalVendorCents = quoteResult.quotedCents + quoteResult.shippingCents;
      const marginCents = order.totalCents - totalVendorCents;

      const [saved] = await db
        .insert(fulfillmentQuotes)
        .values({
          orderId,
          vendorId: quoteResult.vendorId,
          quotedCents: quoteResult.quotedCents,
          shippingCents: quoteResult.shippingCents,
          marginCents,
          turnaroundDays: quoteResult.turnaroundDays,
          rawResponse: (quoteResult.rawResponse as Record<string, unknown>) ?? null,
        })
        .returning();

      savedQuotes.push(saved);
    } catch (err) {
      // One vendor failing should not block others.
      console.error(`Quote request failed for vendor "${adapter.vendorId}":`, err);
    }
  }

  if (savedQuotes.length === 0) {
    throw new Error("All quote requests failed — no quotes saved");
  }

  const best = pickRecommendation(savedQuotes);
  if (!best) return;

  await db
    .update(orders)
    .set({
      fulfillmentRecommendation: {
        quoteId: best.id,
        vendorId: best.vendorId,
        quotedCents: best.quotedCents,
        shippingCents: best.shippingCents,
        marginCents: best.marginCents ?? 0,
        turnaroundDays: best.turnaroundDays ?? undefined,
      },
    })
    .where(eq(orders.id, orderId));
}

// ---------------------------------------------------------------------------
// submitToVendor
//
// Calls adapter.submitOrder() for the vendor in orders.fulfillment_selection.
// On success: inserts fulfillment_submissions row, advances status to submitted_to_vendor.
// On failure: inserts rejected submission row, advances status to fulfillment_failed.
// ---------------------------------------------------------------------------

export async function submitToVendor(orderId: string): Promise<void> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const order = orderRows[0];

  if (!order) throw new Error(`Order ${orderId} not found`);
  if (!order.fulfillmentSelection) {
    throw new Error("No vendor selected — set fulfillment_selection before submitting");
  }
  if (!order.shippingAddress) {
    throw new Error(`Order ${orderId} has no shipping address`);
  }

  const { vendorId, quoteId } = order.fulfillmentSelection;

  // Validate the selected quote still exists and belongs to this order.
  // If quotes were re-requested since selection, the quoteId is stale.
  const quoteRows = await db
    .select({ id: fulfillmentQuotes.id })
    .from(fulfillmentQuotes)
    .where(
      and(
        eq(fulfillmentQuotes.id, quoteId),
        eq(fulfillmentQuotes.orderId, orderId)
      )
    )
    .limit(1);

  if (quoteRows.length === 0) {
    // Clear the stale selection so admin is prompted to re-confirm.
    await db
      .update(orders)
      .set({ fulfillmentSelection: null })
      .where(eq(orders.id, orderId));
    throw new Error(
      "The selected quote no longer exists — quotes may have been re-requested. Please re-confirm a vendor."
    );
  }

  const adapter = getAdapter(vendorId);
  if (!adapter) throw new Error(`No adapter registered for vendor "${vendorId}"`);

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const productIds = items
    .map((i) => i.productId)
    .filter((id): id is string => id !== null);

  const mappings =
    productIds.length > 0
      ? await db
          .select()
          .from(productVendorMappings)
          .where(
            and(
              eq(productVendorMappings.vendorId, vendorId),
              inArray(productVendorMappings.productId, productIds)
            )
          )
      : [];

  const fulfillmentItems: FulfillmentOrderItem[] = items.map((item) => {
    const mapping = mappings.find((m) => m.productId === item.productId);
    return {
      orderItemId: item.id,
      productId: item.productId ?? "",
      vendorProductId: mapping?.vendorProductId ?? "",
      vendorSku: mapping?.vendorSku ?? undefined,
      quantity: item.quantity,
      optionsSnapshot: item.optionsSnapshot,
    };
  });

  const fulfillmentOrder: FulfillmentOrder = {
    orderId: order.id,
    recipientName: order.customerName,
    shippingAddress: order.shippingAddress,
    items: fulfillmentItems,
  };

  const rawRequest = { orderId, vendorId, quoteId };

  let submissionResult: Awaited<ReturnType<typeof adapter.submitOrder>> | null = null;
  try {
    submissionResult = await adapter.submitOrder(fulfillmentOrder);
  } catch (err) {
    console.error(`Submission to vendor "${vendorId}" threw:`, err);
  }

  const accepted = submissionResult?.status === "accepted";

  await db.insert(fulfillmentSubmissions).values({
    orderId,
    vendorId,
    vendorOrderId: accepted ? submissionResult!.vendorOrderId : null,
    status: accepted ? "accepted" : "rejected",
    rawRequest: rawRequest as Record<string, unknown>,
    rawResponse:
      (submissionResult?.rawResponse as Record<string, unknown>) ?? null,
  });

  await db
    .update(orders)
    .set({ status: accepted ? "submitted_to_vendor" : "fulfillment_failed" })
    .where(eq(orders.id, orderId));

  if (!accepted) {
    throw new Error("Vendor rejected or did not respond to the submission");
  }
}
