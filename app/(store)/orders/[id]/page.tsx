// /orders/[id] — customer order status and artwork upload page.
// Server component: fetches order, items, and existing files.
// Renders ArtworkUploadForm (client) per item.

import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderWithItemsAndFiles } from "@/lib/db/queries";
import { formatCents } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/db/schema";
import { ArtworkUploadForm, type UploadedFile } from "./_artwork-upload";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:              "Pending payment",
  paid:                 "Paid — awaiting artwork",
  artwork_review:       "Artwork under review",
  proof_sent:           "Proof sent — please review",
  proof_approved:       "Proof approved",
  in_production:        "In production",
  submitted_to_vendor:  "In production",
  fulfillment_failed:   "Production issue — we'll be in touch",
  shipped:              "Shipped",
  complete:             "Complete",
  payment_failed:       "Payment failed",
  cancelled:            "Cancelled",
};

// Uploads allowed for orders that are in the artwork stage or paid.
const UPLOAD_ALLOWED: OrderStatus[] = [
  "paid",
  "artwork_review",
  "proof_sent",
  "proof_approved",
];

function toLabel(groupName: string) {
  return groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/-/g, " ");
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const result = await getOrderWithItemsAndFiles(id);

  if (!result) notFound();

  const { order, items, files } = result;

  // Group files by orderItemId for easy lookup
  const filesByItem = files.reduce<Record<string, UploadedFile[]>>((acc, file) => {
    const entry: UploadedFile = {
      id: file.id,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      status: file.status,
    };
    (acc[file.orderItemId] ??= []).push(entry);
    return acc;
  }, {});

  const canUpload = (UPLOAD_ALLOWED as string[]).includes(order.status);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Order</p>
        <h1 className="text-2xl font-bold text-gray-900 font-mono">
          {id.split("-")[0].toUpperCase()}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{STATUS_LABEL[order.status]}</p>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Ship to
          </h2>
          <div className="rounded border border-gray-200 px-4 py-3 bg-white text-sm text-gray-700 space-y-0.5">
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && (
              <p>{order.shippingAddress.line2}</p>
            )}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </section>
      )}

      {/* Line items + upload forms */}
      <section className="space-y-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Items
        </h2>
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded border border-gray-200 p-4 space-y-4 bg-white"
          >
            {/* Item summary */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{item.productNameSnapshot}</p>
                {Object.keys(item.optionsSnapshot).length > 0 && (
                  <ul className="mt-0.5 space-y-0.5">
                    {Object.entries(item.optionsSnapshot).map(([group, value]) => (
                      <li key={group} className="text-xs text-gray-400">
                        <span className="text-gray-300">{toLabel(group)}:</span> {value}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {formatCents(item.lineTotalCents)}
              </p>
            </div>

            {/* Artwork upload */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Artwork</p>
              <ArtworkUploadForm
                orderId={order.id}
                orderItemId={item.id}
                existingFiles={filesByItem[item.id] ?? []}
                canUpload={canUpload}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Order totals */}
      <section>
        <div className="rounded border border-gray-200 px-4 py-3 space-y-2 bg-white text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span>
            <span>{formatCents(order.totalCents)}</span>
          </div>
        </div>
      </section>

      <Link
        href="/products"
        className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
      >
        Continue shopping
      </Link>
    </main>
  );
}
