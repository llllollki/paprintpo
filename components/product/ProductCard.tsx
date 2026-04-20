import Link from "next/link";
import Image from "next/image";
import { formatCents } from "@/lib/pricing";
import type { Product } from "@/lib/db/schema";

type ProductCardProps = Pick<
  Product,
  "name" | "slug" | "category" | "basePrice"
> & {
  imageUrl?: string;
};

export function ProductCard({
  name,
  slug,
  category,
  basePrice,
  imageUrl,
}: ProductCardProps) {
  return (
    <Link
      href={`/products/${category}/${slug}`}
      className="group block bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
      style={{ boxShadow: "var(--shadow-sm)", border: "1px solid rgba(0,0,0,0.05)" }}
    >
      {imageUrl ? (
        <div className="relative w-full aspect-video" style={{ background: "var(--surface)" }}>
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        </div>
      ) : (
        <div
          className="w-full aspect-video flex items-center justify-center text-sm"
          style={{ background: "var(--surface)", color: "var(--violet-lt, #a68cf8)" }}
        >
          No image
        </div>
      )}

      <div className="px-5 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "var(--violet)" }}>
          {category.replace(/-/g, " ")}
        </p>
        <h2 className="font-bold text-[17px] tracking-[-0.02em] mb-1.5" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
          {name}
        </h2>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          From {formatCents(basePrice)}
        </p>
        <span
          className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-bold transition-all group-hover:gap-2.5"
          style={{ color: "var(--violet)" }}
        >
          Configure & Order
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </Link>
  );
}
