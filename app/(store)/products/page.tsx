import { getProducts } from "@/lib/db/queries";
import { ProductCard } from "@/components/product/ProductCard";

function toHeading(category: string) {
  return category.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function ProductsPage() {
  const allProducts = await getProducts();

  const byCategory = allProducts.reduce<Record<string, typeof allProducts>>(
    (acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    },
    {}
  );

  const categories = Object.keys(byCategory).sort();

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-12">
      {/* Page header */}
      <div className="mb-10">
        <span
          className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full mb-3"
          style={{ color: "var(--violet)", background: "var(--surface)" }}
        >
          Catalog
        </span>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}
        >
          All Products
        </h1>
      </div>

      {categories.length === 0 && (
        <p style={{ color: "var(--ink-soft)" }}>No products available yet.</p>
      )}

      <div className="space-y-14">
        {categories.map((category) => (
          <section key={category}>
            <h2
              className="text-lg font-bold mb-5 pb-3"
              style={{
                fontFamily: "var(--font-head)",
                color: "var(--ink)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {toHeading(category)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {byCategory[category].map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
