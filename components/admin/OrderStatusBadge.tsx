// Displays a color-coded badge for the current order status.
// Status values align with the orders.status enum in the database schema.

export type OrderStatus =
  | "pending"          // order created, awaiting payment
  | "paid"             // payment confirmed by Stripe webhook
  | "artwork_review"   // artwork uploaded, needs staff review
  | "proof_sent"       // proof emailed to customer
  | "proof_approved"   // customer approved proof
  | "in_production"    // job sent to press
  | "shipped"          // tracking number assigned
  | "complete"         // delivered / closed
  | "payment_failed"   // Stripe payment failed
  | "cancelled";       // cancelled before production

const statusStyles: Record<OrderStatus, string> = {
  pending:        "bg-yellow-100 text-yellow-800",
  paid:           "bg-blue-100 text-blue-800",
  artwork_review: "bg-orange-100 text-orange-800",
  proof_sent:     "bg-purple-100 text-purple-800",
  proof_approved: "bg-indigo-100 text-indigo-800",
  in_production:  "bg-cyan-100 text-cyan-800",
  shipped:        "bg-green-100 text-green-800",
  complete:       "bg-gray-100 text-gray-800",
  payment_failed: "bg-red-100 text-red-800",
  cancelled:      "bg-red-50 text-red-600",
};

const statusLabels: Record<OrderStatus, string> = {
  pending:        "Pending",
  paid:           "Paid",
  artwork_review: "Artwork Review",
  proof_sent:     "Proof Sent",
  proof_approved: "Proof Approved",
  in_production:  "In Production",
  shipped:        "Shipped",
  complete:       "Complete",
  payment_failed: "Payment Failed",
  cancelled:      "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
