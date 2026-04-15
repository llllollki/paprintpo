// POST /api/uploads/presign
// Ownership check: client must supply orderId + orderItemId.
// Server verifies order_items.order_id === orderId before issuing a URL.
// If this is the first file on a paid order, the order advances to artwork_review.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderItems, orderFiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ALLOWED_MIME_TYPES } from "@/lib/uploads";
import { supabaseAdmin } from "@/lib/supabase/service";

// Orders in these statuses do not accept new artwork uploads.
const NON_UPLOADABLE = ["pending", "cancelled", "payment_failed"] as const;

const PresignBodySchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  filename: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PresignBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { orderId, orderItemId, filename, mimeType, sizeBytes } = parsed.data;

  // Ownership check: item must belong to the supplied order.
  const itemRows = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(and(eq(orderItems.id, orderItemId), eq(orderItems.orderId, orderId)))
    .limit(1);

  if (itemRows.length === 0) {
    return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  }

  // Load order status.
  const orderRows = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  const order = orderRows[0];
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if ((NON_UPLOADABLE as readonly string[]).includes(order.status)) {
    return NextResponse.json(
      { error: "Files cannot be uploaded for this order" },
      { status: 422 }
    );
  }

  // Check whether any files already exist for this order (across all items).
  // Used to determine whether to auto-advance status to artwork_review.
  const existingForOrder = await db
    .select({ id: orderFiles.id })
    .from(orderFiles)
    .innerJoin(orderItems, eq(orderFiles.orderItemId, orderItems.id))
    .where(eq(orderItems.orderId, orderId))
    .limit(1);

  const isFirstFile = existingForOrder.length === 0;

  // Assign storage path scoped to this order item.
  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const storagePath = `orders/${orderItemId}/${crypto.randomUUID()}.${ext}`;

  // Insert order_files row before requesting the upload URL.
  const [file] = await db
    .insert(orderFiles)
    .values({
      orderItemId,
      storagePath,
      originalFilename: filename,
      mimeType,
      sizeBytes,
      status: "pending_review",
    })
    .returning();

  // Generate signed upload URL from Supabase Storage.
  const { data: signedData, error: storageError } = await supabaseAdmin.storage
    .from("artwork")
    .createSignedUploadUrl(storagePath);

  if (storageError || !signedData) {
    // Clean up the DB row so it does not show as a dangling pending_review file.
    await db.delete(orderFiles).where(eq(orderFiles.id, file.id));
    return NextResponse.json(
      { error: "Failed to generate upload URL. Please try again." },
      { status: 502 }
    );
  }

  // Auto-advance: if this is the first file and the order is paid, move it to artwork_review.
  if (isFirstFile && order.status === "paid") {
    await db
      .update(orders)
      .set({ status: "artwork_review" })
      .where(eq(orders.id, orderId));
  }

  return NextResponse.json({
    signedUrl: signedData.signedUrl,
    path: storagePath,
    fileId: file.id,
  });
}
