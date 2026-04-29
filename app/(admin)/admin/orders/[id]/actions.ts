"use server";

// Server actions for the admin order detail page.
// Every action calls requireAdmin() first — defence-in-depth on top of middleware.
// updateOrderStatus      — advances workflow status (Stripe/fulfillment-managed blocked).
// updateFileStatus       — approves or rejects an uploaded artwork file.
// requestQuotesAction    — triggers quote requests from all registered adapters.
// selectVendorAction     — records admin's vendor selection (confirm or override).
// submitToVendorAction   — submits order to selected vendor via fulfillment service.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { orders, orderItems, orderFiles, ORDER_STATUSES } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requestQuotes, submitToVendor } from "@/lib/fulfillment/service";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Auth guard — re-verified on every action (middleware is page-level only)
// ---------------------------------------------------------------------------

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Unauthorized");
  }
}

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
  "in_production", // set by vendor webhook only — admin must not override
  "shipped",       // set by vendor webhook only — admin must not override
];

const ADMIN_SETTABLE = ORDER_STATUSES.filter(
  (s) => !STRIPE_MANAGED.includes(s) && !FULFILLMENT_MANAGED.includes(s)
);

const UpdateStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ADMIN_SETTABLE as [string, ...string[]]),
});

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();

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
  fileId:  z.string().uuid(),
  orderId: z.string().uuid(),
  status:  z.enum(["approved", "rejected"]),
});

export async function updateFileStatus(formData: FormData) {
  await requireAdmin();

  const parsed = UpdateFileStatusSchema.safeParse({
    fileId:  formData.get("fileId"),
    orderId: formData.get("orderId"),
    status:  formData.get("status"),
  });

  if (!parsed.success) return;

  const { fileId, orderId, status } = parsed.data;

  // Ownership check: verify the file actually belongs to this order.
  // Prevents IDOR — an admin can only approve/reject files on the order they're viewing.
  const fileRows = await db
    .select({ id: orderFiles.id })
    .from(orderFiles)
    .innerJoin(orderItems, eq(orderFiles.orderItemId, orderItems.id))
    .where(and(eq(orderFiles.id, fileId), eq(orderItems.orderId, orderId)))
    .limit(1);

  if (fileRows.length === 0) return;

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
  await requireAdmin();

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
  await requireAdmin();

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
  await requireAdmin();

  const orderId = formData.get("orderId");
  if (!z.string().uuid().safeParse(orderId).success) return;

  await submitToVendor(orderId as string);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}
