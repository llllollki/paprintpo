// Admin order list — all orders, newest first.
// Server component — data fetched at request time.

import Link from "next/link";
import { getOrders } from "@/lib/db/queries";
import { formatCents } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/db/schema";

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

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function shortId(id: string) {
  return id.split("-")[0].toUpperCase();
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Order", "Customer", "Status", "Date", "Total", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-700">
                    {shortId(order.id)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {order.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatCents(order.totalCents)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
