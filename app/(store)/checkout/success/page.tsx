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
      .select({ id: orders.id, customerEmail: orders.customerEmail, customerName: orders.customerName })
      .from(orders)
      .where(eq(orders.stripeSessionId, session_id))
      .limit(1);
    order = rows[0] ?? null;
  }

  if (!order) {
    return (
      <main className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold mb-4" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
          Order Confirmed
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>
          Thank you for your order! A confirmation email is on its way.
        </p>
        <Link href="/products" className="text-sm font-bold hover:underline" style={{ color: "var(--violet)" }}>
          Continue shopping
        </Link>
      </main>
    );
  }

  const shortId = order.id.split("-")[0].toUpperCase();

  return (
    <main className="max-w-xl mx-auto px-6 py-20 text-center">
      <ClearCart />

      {/* Check icon */}
      <div
        className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "var(--surface)" }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--violet)" }}>
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>

      <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
        Order Confirmed!
      </h1>
      <p className="text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
        Thank you, <span className="font-semibold" style={{ color: "var(--ink)" }}>{order.customerName}</span>!
      </p>
      <p className="text-sm mb-7" style={{ color: "var(--ink-soft)" }}>
        Confirmation will be sent to{" "}
        <span className="font-medium" style={{ color: "var(--ink)" }}>{order.customerEmail}</span>.
      </p>

      <div
        className="inline-block rounded-xl px-6 py-4 mb-10 text-left"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: "var(--violet)" }}>
          Order ID
        </p>
        <p className="font-mono text-sm font-semibold" style={{ color: "var(--ink)" }}>{shortId}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "var(--violet)" }}
        >
          View Order Details
        </Link>
        <Link href="/products" className="text-sm font-medium hover:underline" style={{ color: "var(--ink-soft)" }}>
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
