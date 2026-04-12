// /products/[category] — filtered listing for a single category.
// Server component: fetches from DB and 404s if the category has no active products.

import { getProductsByCategory } from "@/lib/db/queries";
import { ProductCard } from "@/components/product/ProductCard";
import { notFound } from "next/navigation";

function toHeading(category: string) {
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Props {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const categoryProducts = await getProductsByCategory(category);

  if (categoryProducts.length === 0) notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <p className="text-sm text-gray-400 mb-1">
        <a href="/products" className="hover:underline">
          All Products
        </a>{" "}
        / {toHeading(category)}
      </p>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {toHeading(category)}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryProducts.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </main>
  );
}
