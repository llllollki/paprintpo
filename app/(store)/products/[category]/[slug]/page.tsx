// /products/[category]/[slug] — product detail + configurator.
//
// Server component: fetches product, options, and tiers from DB in parallel.
// Passes data to ProductConfigurator (client component) which owns all
// interactive state (selections, quantity, live pricing).

import { getProductBySlug, getProductOptions, getQuantityTiers } from "@/lib/db/queries";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { category, slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product || product.category !== category) notFound();

  const [options, tiers] = await Promise.all([
    getProductOptions(product.id),
    getQuantityTiers(product.id),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <p className="text-sm text-gray-400 mb-1">
        <a href="/products" className="hover:underline">
          All Products
        </a>{" "}
        /{" "}
        <a href={`/products/${category}`} className="hover:underline capitalize">
          {category.replace(/-/g, " ")}
        </a>{" "}
        / {product.name}
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left — product info */}
        <div>
          {/* Image placeholder */}
          <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm mb-6">
            Product image
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
              {product.description}
            </p>
          )}
          {tiers.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Volume pricing
              </p>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 text-xs">
                    <th className="pb-1 font-medium">Quantity</th>
                    <th className="pb-1 font-medium text-right">Per unit</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="py-1 text-gray-700">{t.minQty}+</td>
                      <td className="py-1 text-gray-700 text-right">
                        ${(t.unitPrice / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right — configurator */}
        <div>
          <ProductConfigurator
            product={product}
            options={options}
            tiers={tiers}
          />
        </div>
      </div>
    </main>
  );
}
