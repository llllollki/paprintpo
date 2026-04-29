import { getProductBySlug, getProductOptions, getQuantityTiers } from "@/lib/db/queries";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { notFound } from "next/navigation";
import Link from "next/link";

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
    <main className="max-w-[1100px] mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <p className="text-xs mb-8" style={{ color: "var(--ink-soft)" }}>
        <Link href="/products" className="hover:underline" style={{ color: "var(--violet)" }}>All Products</Link>
        {" / "}
        <Link href={`/products/${category}`} className="hover:underline capitalize" style={{ color: "var(--violet)" }}>
          {category.replace(/-/g, " ")}
        </Link>
        {" / "}
        {product.name}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left — product info */}
        <div>
          <div
            className="w-full aspect-square rounded-2xl flex items-center justify-center text-sm mb-6"
            style={{ background: "var(--surface)", color: "var(--violet-lt, #a68cf8)" }}
          >
            Product image
          </div>

          <span
            className="inline-block text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-3"
            style={{ color: "var(--violet)", background: "var(--surface)" }}
          >
            {category.replace(/-/g, " ")}
          </span>

          <h1 className="text-2xl font-extrabold tracking-tight mb-3" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
            {product.name}
          </h1>

          {product.description && (
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--ink-soft)" }}>
              {product.description}
            </p>
          )}

          {tiers.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--ink-soft)" }}>
                Volume pricing
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--ink-soft)" }}>
                    <th className="pb-2 text-left font-medium">Quantity</th>
                    <th className="pb-2 text-right font-medium">Per unit</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t) => (
                    <tr key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="py-2" style={{ color: "var(--ink)" }}>{t.minQty}+</td>
                      <td className="py-2 text-right font-semibold" style={{ color: "var(--ink)" }}>
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
          <ProductConfigurator product={product} options={options} tiers={tiers} />
        </div>
      </div>
    </main>
  );
}
