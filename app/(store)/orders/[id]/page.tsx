import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderWithItemsAndFiles } from "@/lib/db/queries";
import { formatCents } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/db/schema";
import { ArtworkUploadForm, type UploadedFile } from "./_artwork-upload";
import { toLabel } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:             "Pending payment",
  paid:                "Paid — awaiting artwork",
  artwork_review:      "Artwork under review",
  proof_sent:          "Proof sent — please review",
  proof_approved:      "Proof approved",
  in_production:       "In production",
  submitted_to_vendor: "In production",
  fulfillment_failed:  "Production issue — we'll be in touch",
  shipped:             "Shipped",
  complete:            "Complete",
  payment_failed:      "Payment failed",
  cancelled:           "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:             "#f59e0b",
  paid:                "var(--violet)",
  artwork_review:      "#f97316",
  proof_sent:          "#8b5cf6",
  proof_approved:      "#6246ea",
  in_production:       "#06b6d4",
  submitted_to_vendor: "#0ea5e9",
  fulfillment_failed:  "#ef4444",
  shipped:             "var(--teal, #00c9a7)",
  complete:            "#22c55e",
  payment_failed:      "#ef4444",
  cancelled:           "var(--ink-soft)",
};

const UPLOAD_ALLOWED: OrderStatus[] = ["paid", "artwork_review", "proof_sent", "proof_approved"];

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const result = await getOrderWithItemsAndFiles(id);
  if (!result) notFound();

  const { order, items, files } = result;

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
  const shortId = id.split("-")[0].toUpperCase();

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "var(--violet)" }}>
          Order
        </p>
        <h1 className="text-2xl font-extrabold font-mono mb-2" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
          {shortId}
        </h1>
        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
          style={{ background: "var(--surface)", color: STATUS_COLOR[order.status] }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[order.status] }} />
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--ink-soft)" }}>
            Ship to
          </h2>
          <div className="rounded-xl px-4 py-3.5 text-sm space-y-0.5 bg-white" style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </section>
      )}

      {/* Items */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
          Items
        </h2>
        {items.map((item) => (
          <div key={item.id} className="rounded-xl p-5 space-y-4 bg-white" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold" style={{ color: "var(--ink)" }}>{item.productNameSnapshot}</p>
                {Object.keys(item.optionsSnapshot).length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {Object.entries(item.optionsSnapshot).map(([group, value]) => (
                      <li key={group} className="text-xs" style={{ color: "var(--ink-soft)" }}>
                        <span style={{ opacity: 0.6 }}>{toLabel(group)}:</span> {String(value)}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--ink)" }}>
                {formatCents(item.lineTotalCents)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--ink-soft)" }}>Artwork</p>
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

      {/* Totals */}
      <section>
        <div className="rounded-xl px-5 py-4 space-y-2 bg-white text-sm" style={{ border: "1px solid var(--border)" }}>
          <div className="flex justify-between" style={{ color: "var(--ink-soft)" }}>
            <span>Subtotal</span>
            <span>{formatCents(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2" style={{ color: "var(--ink)", borderTop: "1px solid var(--border)" }}>
            <span>Total</span>
            <span>{formatCents(order.totalCents)}</span>
          </div>
        </div>
      </section>

      <Link href="/products" className="text-sm font-medium hover:underline" style={{ color: "var(--ink-soft)" }}>
        ← Continue shopping
      </Link>
    </main>
  );
}
