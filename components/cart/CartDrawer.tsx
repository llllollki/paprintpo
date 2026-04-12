// Slide-out cart drawer showing current line items and totals.
// Cart state lives in a client-side store (to be implemented in lib/cart.ts).

export function CartDrawer({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <aside>
      <h2>Your Cart</h2>
      {/* TODO: map over cart items, show options snapshot, quantity, price */}
      {/* TODO: link to /cart for full review, or inline checkout button */}
    </aside>
  );
}
