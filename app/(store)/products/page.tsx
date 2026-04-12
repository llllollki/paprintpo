// /products — full catalog listing, grouped by category.
// Server component: fetches directly from DB via query layer.

import { getProducts } from "@/lib/db/queries";
import { ProductCard } from "@/components/product/ProductCard";

function toHeading(category: string) {
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function ProductsPage() {
  const allProducts = await getProducts();

  const byCategory = allProducts.reduce<
    Record<string, typeof allProducts>
  >((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const categories = Object.keys(byCategory).sort();

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Products</h1>

      {categories.length === 0 && (
        <p className="text-gray-500">No products available yet.</p>
      )}

      <div className="space-y-12">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {toHeading(category)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
