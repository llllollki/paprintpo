// /checkout/success — shown after Stripe redirects back on successful payment.
// Reads ?session_id from the URL, looks up the order, and shows confirmation.
// The webhook may not have fired yet, so we accept status "pending" as valid too.

import Link from "next/link";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ClearCart } from "./_clear-cart";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let order: { id: string; customerEmail: string; customerName: string } | null = null;

  if (session_id) {
    const rows = await db
      .select({
        id: orders.id,
        customerEmail: orders.customerEmail,
        customerName: orders.customerName,
      })
      .from(orders)
      .where(eq(orders.stripeSessionId, session_id))
      .limit(1);

    order = rows[0] ?? null;
  }

  if (!order) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed</h1>
        <p className="text-gray-500 mb-8">
          Thank you for your order! A confirmation email is on its way.
        </p>
        <Link
          href="/products"
          className="text-sm font-medium text-gray-900 underline underline-offset-2"
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  const shortId = order.id.split("-")[0].toUpperCase();

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <ClearCart />
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-7 w-7 text-gray-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed</h1>
      <p className="text-gray-500 mb-1">Thank you, {order.customerName}!</p>
      <p className="text-sm text-gray-400 mb-6">
        A confirmation will be sent to{" "}
        <span className="font-medium text-gray-600">{order.customerEmail}</span>.
      </p>

      <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3 mb-8 inline-block text-left">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Order ID</p>
        <p className="font-mono text-sm text-gray-800">{shortId}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href={`/orders/${order.id}`}
          className="text-sm font-medium text-gray-900 underline underline-offset-2"
        >
          View order details
        </Link>
        <Link
          href="/products"
          className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
