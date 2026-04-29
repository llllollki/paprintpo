import { getProductsByCategory } from "@/lib/db/queries";
import { ProductCard } from "@/components/product/ProductCard";
import { notFound } from "next/navigation";
import Link from "next/link";

function toHeading(category: string) {
  return category.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

interface Props {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const categoryProducts = await getProductsByCategory(category);

  if (categoryProducts.length === 0) notFound();

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
        <Link href="/products" className="hover:underline" style={{ color: "var(--violet)" }}>
          All Products
        </Link>
        {" / "}
        {toHeading(category)}
      </p>

      <div className="mb-10">
        <span
          className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full mb-3"
          style={{ color: "var(--violet)", background: "var(--surface)" }}
        >
          {toHeading(category)}
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
          {toHeading(category)}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categoryProducts.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </main>
  );
}
