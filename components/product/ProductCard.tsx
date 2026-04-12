// Displays a product summary in category/listing views.
// Props intentionally minimal — expand once Product type is defined in schema.

interface ProductCardProps {
  name: string;
  slug: string;
  category: string;
  basePrice: number; // cents
  imageUrl?: string;
}

export function ProductCard({
  name,
  slug,
  category,
  basePrice,
  imageUrl,
}: ProductCardProps) {
  return (
    <a href={`/products/${category}/${slug}`}>
      {imageUrl && <img src={imageUrl} alt={name} />}
      <h2>{name}</h2>
      <p>From ${(basePrice / 100).toFixed(2)}</p>
    </a>
  );
}
