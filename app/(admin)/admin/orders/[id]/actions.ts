"use server";

// Server action — update order status.
// Called from the detail page status form.
// paid and payment_failed are Stripe-managed and cannot be set manually.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { orders, ORDER_STATUSES } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STRIPE_MANAGED: (typeof ORDER_STATUSES)[number][] = [
  "paid",
  "payment_failed",
];

const ADMIN_SETTABLE = ORDER_STATUSES.filter(
  (s) => !STRIPE_MANAGED.includes(s)
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

  if (!parsed.success) {
    // Server actions can't return errors to plain HTML forms directly;
    // validation prevents bad writes. The select is pre-constrained in the UI.
    return;
  }

  const { orderId, status } = parsed.data;

  await db
    .update(orders)
    .set({ status: status as (typeof ORDER_STATUSES)[number] })
    .where(eq(orders.id, orderId));

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}
