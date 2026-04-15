"use server";

// Server actions for the admin order detail page.
// updateOrderStatus      — advances workflow status (Stripe/fulfillment-managed blocked).
// updateFileStatus       — approves or rejects an uploaded artwork file.
// requestQuotesAction    — triggers quote requests from all registered adapters.
// selectVendorAction     — records admin's vendor selection (confirm or override).
// submitToVendorAction   — submits order to selected vendor via fulfillment service.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { orders, orderFiles, ORDER_STATUSES } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requestQuotes, submitToVendor } from "@/lib/fulfillment/service";

// ---------------------------------------------------------------------------
// Order status
// ---------------------------------------------------------------------------

const STRIPE_MANAGED: (typeof ORDER_STATUSES)[number][] = [
  "paid",
  "payment_failed",
];

const FULFILLMENT_MANAGED: (typeof ORDER_STATUSES)[number][] = [
  "submitted_to_vendor",
  "fulfillment_failed",
];

const ADMIN_SETTABLE = ORDER_STATUSES.filter(
  (s) => !STRIPE_MANAGED.includes(s) && !FULFILLMENT_MANAGED.includes(s)
);

const UpdateStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ADMIN_SETTABLE as [string, ...string[]]),
});

export async function updateOrderStatus(formData: FormData) {
  const parsed = UpdateStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;

  const { orderId, status } = parsed.data;

  await db
    .update(orders)
    .set({ status: status as (typeof ORDER_STATUSES)[number] })
    .where(eq(orders.id, orderId));

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// File status
// ---------------------------------------------------------------------------

const UpdateFileStatusSchema = z.object({
  fileId: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export async function updateFileStatus(formData: FormData) {
  const parsed = UpdateFileStatusSchema.safeParse({
    fileId: formData.get("fileId"),
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;

  const { fileId, orderId, status } = parsed.data;

  await db
    .update(orderFiles)
    .set({ status })
    .where(eq(orderFiles.id, fileId));

  revalidatePath(`/admin/orders/${orderId}`);
}

// ---------------------------------------------------------------------------
// Fulfillment — Request Quotes
// ---------------------------------------------------------------------------

export async function requestQuotesAction(formData: FormData) {
  const orderId = formData.get("orderId");
  if (!z.string().uuid().safeParse(orderId).success) return;

  await requestQuotes(orderId as string);
  revalidatePath(`/admin/orders/${orderId}`);
}

// ---------------------------------------------------------------------------
// Fulfillment — Select Vendor
// ---------------------------------------------------------------------------

const SelectVendorSchema = z.object({
  orderId:    z.string().uuid(),
  quoteId:    z.string().uuid(),
  vendorId:   z.string().min(1),
  isOverride: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function selectVendorAction(formData: FormData) {
  const parsed = SelectVendorSchema.safeParse({
    orderId:    formData.get("orderId"),
    quoteId:    formData.get("quoteId"),
    vendorId:   formData.get("vendorId"),
    isOverride: formData.get("isOverride"),
  });

  if (!parsed.success) return;

  const { orderId, quoteId, vendorId, isOverride } = parsed.data;

  await db
    .update(orders)
    .set({ fulfillmentSelection: { vendorId, quoteId, isOverride } })
    .where(eq(orders.id, orderId));

  revalidatePath(`/admin/orders/${orderId}`);
}

// ---------------------------------------------------------------------------
// Fulfillment — Submit to Vendor
// ---------------------------------------------------------------------------

export async function submitToVendorAction(formData: FormData) {
  const orderId = formData.get("orderId");
  if (!z.string().uuid().safeParse(orderId).success) return;

  await submitToVendor(orderId as string);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}
