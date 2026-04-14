// Admin order detail — customer info, line items, status update.
// Server component — data fetched at request time.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderWithItems } from "@/lib/db/queries";
import { formatCents } from "@/lib/pricing";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/db/schema";
import { updateOrderStatus } from "./actions";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:         "bg-yellow-50  text-yellow-700  ring-yellow-200",
  paid:            "bg-blue-50    text-blue-700    ring-blue-200",
  artwork_review:  "bg-orange-50  text-orange-700  ring-orange-200",
  proof_sent:      "bg-purple-50  text-purple-700  ring-purple-200",
  proof_approved:  "bg-indigo-50  text-indigo-700  ring-indigo-200",
  in_production:   "bg-cyan-50    text-cyan-700    ring-cyan-200",
  shipped:         "bg-teal-50    text-teal-700    ring-teal-200",
  complete:        "bg-green-50   text-green-700   ring-green-200",
  payment_failed:  "bg-red-50     text-red-700     ring-red-200",
  cancelled:       "bg-gray-100   text-gray-500    ring-gray-200",
};

const STRIPE_MANAGED: OrderStatus[] = ["paid", "payment_failed"];
const ADMIN_SETTABLE = ORDER_STATUSES.filter((s) => !STRIPE_MANAGED.includes(s));

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function toLabel(groupName: string) {
  return groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/-/g, " ");
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getOrderWithItems(id);

  if (!result) notFound();

  const { order, items } = result;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Back */}
      <Link
        href="/admin"
        className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
      >
        ← All orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order{" "}
            <span className="font-mono text-xl">
              {id.split("-")[0].toUpperCase()}
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Customer
        </h2>
        <div className="rounded border border-gray-200 px-4 py-3 space-y-1 bg-white">
          <p className="font-medium text-gray-900">{order.customerName}</p>
          <p className="text-sm text-gray-500">{order.customerEmail}</p>
        </div>
      </section>

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
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {item.productNameSnapshot}
                    </p>
                    {Object.keys(item.optionsSnapshot).length > 0 && (
                      <ul className="mt-0.5 space-y-0.5">
                        {Object.entries(item.optionsSnapshot).map(
                          ([group, value]) => (
                            <li key={group} className="text-xs text-gray-400">
                              <span className="text-gray-300">
                                {toLabel(group)}:
                              </span>{" "}
                              {value}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatCents(item.unitPriceCents)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCents(item.lineTotalCents)}
                  </td>
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

      {/* Placeholder — file management */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Artwork Files
        </h2>
        <div className="rounded border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-400">
          File upload management coming in a later phase.
        </div>
      </section>
    </main>
  );
}
