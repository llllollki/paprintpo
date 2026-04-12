// Displays a product summary in category/listing views.
// basePrice is used as the "starting from" display price on the listing;
// actual configured pricing is calculated in the product detail page.

import Link from "next/link";
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
      className="block rounded-lg border border-gray-200 p-4 hover:border-gray-400 transition-colors"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="mb-3 w-full rounded object-cover aspect-video bg-gray-100"
        />
      )}
      {!imageUrl && (
        <div className="mb-3 w-full rounded aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No image
        </div>
      )}
      <h2 className="font-semibold text-gray-900">{name}</h2>
      <p className="mt-1 text-sm text-gray-500">
        From {formatCents(basePrice)}
      </p>
    </Link>
  );
}
