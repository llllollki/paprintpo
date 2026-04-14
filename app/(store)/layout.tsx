// Storefront shell — provides cart context and renders the nav for all store pages.
// CartProvider is a client component; this layout can remain a server component
// because children are passed through as props (standard Next.js pattern).

import { CartProvider } from "@/lib/cart";
import { StoreNav } from "@/components/layout/StoreNav";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StoreNav />
      {children}
    </CartProvider>
  );
}
