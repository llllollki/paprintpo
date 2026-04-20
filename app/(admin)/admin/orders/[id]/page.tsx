// Admin order detail — customer info, line items, artwork files, status update.
// Server component — data fetched at request time.
// Signed download URLs are generated server-side (1-hour expiry).

import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderWithItemsAndFiles, getOrderFulfillmentQuotes } from "@/lib/db/queries";
import { formatCents } from "@/lib/pricing";
import { ORDER_STATUSES, type OrderStatus, type OrderFileStatus } from "@/lib/db/schema";
import { supabaseAdmin } from "@/lib/supabase/service";
import { updateOrderStatus, updateFileStatus } from "./actions";
import { FulfillmentPanel } from "./_fulfillment-panel";
import { toLabel } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:              "bg-yellow-50  text-yellow-700  ring-yellow-200",
  paid:                 "bg-blue-50    text-blue-700    ring-blue-200",
  artwork_review:       "bg-orange-50  text-orange-700  ring-orange-200",
  proof_sent:           "bg-purple-50  text-purple-700  ring-purple-200",
  proof_approved:       "bg-indigo-50  text-indigo-700  ring-indigo-200",
  in_production:        "bg-cyan-50    text-cyan-700    ring-cyan-200",
  submitted_to_vendor:  "bg-sky-50     text-sky-700     ring-sky-200",
  fulfillment_failed:   "bg-rose-50    text-rose-700    ring-rose-200",
  shipped:              "bg-teal-50    text-teal-700    ring-teal-200",
  complete:             "bg-green-50   text-green-700   ring-green-200",
  payment_failed:       "bg-red-50     text-red-700     ring-red-200",
  cancelled:            "bg-gray-100   text-gray-500    ring-gray-200",
};

const FILE_STATUS_STYLES: Record<OrderFileStatus, string> = {
  pending_review: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  approved:       "bg-green-50  text-green-700  ring-green-200",
  rejected:       "bg-red-50    text-red-700    ring-red-200",
};

const STRIPE_MANAGED: OrderStatus[] = ["paid", "payment_failed"];
// fulfillment_failed is intentionally absent — it's a recoverable error state.
// Admins must be able to reset it (e.g. back to proof_approved) to retry.
// The actions.ts FULFILLMENT_MANAGED still blocks admins from SETTING orders
// to fulfillment_failed, so the system remains the only writer of that status.
const FULFILLMENT_MANAGED: OrderStatus[] = [
  "submitted_to_vendor",
  "in_production",
  "shipped",
];
const ADMIN_SETTABLE = ORDER_STATUSES.filter(
  (s) => !STRIPE_MANAGED.includes(s) && !FULFILLMENT_MANAGED.includes(s)
);

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function FileStatusBadge({ status }: { status: OrderFileStatus }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${FILE_STATUS_STYLES[status]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getOrderWithItemsAndFiles(id);

  if (!result) notFound();

  const { order, items, files } = result;

  // Fetch fulfillment quotes (empty array if none yet).
  const quotes = await getOrderFulfillmentQuotes(id);

  // Generate signed download URLs for all files in parallel (1-hour expiry).
  const signedUrls: Record<string, string> = {};
  if (files.length > 0) {
    const results = await Promise.all(
      files.map((file) =>
        supabaseAdmin.storage.from("artwork").createSignedUrl(file.storagePath, 3600)
      )
    );
    files.forEach((file, i) => {
      const url = results[i].data?.signedUrl;
      if (url) signedUrls[file.id] = url;
    });
  }

  // Group files by orderItemId for rendering alongside each item.
  const filesByItem = files.reduce<Record<string, typeof files>>((acc, file) => {
    (acc[file.orderItemId] ??= []).push(file);
    return acc;
  }, {});

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      {/* Back */}
      <Link
        href="/admin"
        className="text-sm font-medium hover:underline"
        style={{ color: "var(--violet)" }}
      >
        ← All orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
            Order{" "}
            <span className="font-mono text-xl">{id.split("-")[0].toUpperCase()}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
            {order.createdAt.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Customer */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--ink-soft)" }}>
          Customer
        </h2>
        <div className="rounded-xl px-4 py-3.5 space-y-0.5 bg-white" style={{ border: "1px solid var(--border)" }}>
          <p className="font-semibold" style={{ color: "var(--ink)" }}>{order.customerName}</p>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{order.customerEmail}</p>
        </div>
      </section>

      {/* Shipping address */}
      {order.shippingAddress && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Ship To
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

      {/* Line items */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Line Items
        </h2>
        <div className="rounded border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Product / Options", "Qty", "Unit", "Line Total"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.productNameSnapshot}</p>
                    {Object.keys(item.optionsSnapshot).length > 0 && (
                      <ul className="mt-0.5 space-y-0.5">
                        {Object.entries(item.optionsSnapshot).map(([group, value]) => (
                          <li key={group} className="text-xs text-gray-400">
                            <span className="text-gray-300">{toLabel(group)}:</span> {value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCents(item.unitPriceCents)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatCents(item.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Totals */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Totals
        </h2>
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

      {/* Fulfillment */}
      <FulfillmentPanel order={order} quotes={quotes} />

      {/* Artwork files */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Artwork Files
        </h2>

        {files.length === 0 ? (
          <div className="rounded border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-400">
            No files uploaded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const itemFiles = filesByItem[item.id];
              if (!itemFiles || itemFiles.length === 0) return null;

              return (
                <div key={item.id} className="rounded border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
                    {item.productNameSnapshot}
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {itemFiles.map((file) => (
                      <li key={file.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.originalFilename}
                          </p>
                          <p className="text-xs text-gray-400">
                            {file.mimeType} · {formatBytes(file.sizeBytes)} ·{" "}
                            {file.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        {/* Status badge */}
                        <FileStatusBadge status={file.status} />

                        {/* Download link */}
                        {signedUrls[file.id] && (
                          <a
                            href={signedUrls[file.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors"
                          >
                            Download
                          </a>
                        )}

                        {/* Approve / reject — only shown while pending */}
                        {file.status === "pending_review" && (
                          <div className="flex gap-2">
                            <form action={updateFileStatus}>
                              <input type="hidden" name="fileId" value={file.id} />
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="status" value="approved" />
                              <button
                                type="submit"
                                className="rounded bg-green-700 px-3 py-1 text-xs font-medium text-white hover:bg-green-600 transition-colors"
                              >
                                Approve
                              </button>
                            </form>
                            <form action={updateFileStatus}>
                              <input type="hidden" name="fileId" value={file.id} />
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="status" value="rejected" />
                              <button
                                type="submit"
                                className="rounded bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Status update */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Update Status
        </h2>
        <div className="rounded border border-gray-200 px-4 py-4 bg-white">
          {STRIPE_MANAGED.includes(order.status) ? (
            <p className="text-sm text-gray-400">
              This status (<strong>{order.status.replace(/_/g, " ")}</strong>) is
              managed by Stripe and cannot be changed manually.
            </p>
          ) : FULFILLMENT_MANAGED.includes(order.status) ? (
            <p className="text-sm text-gray-400">
              This status (<strong>{order.status.replace(/_/g, " ")}</strong>) is
              managed by the fulfillment system and cannot be changed manually.
            </p>
          ) : (
            <form action={updateOrderStatus} className="flex items-center gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {ADMIN_SETTABLE.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                Save
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
