// Product detail page with option configurator and file upload
// params.category → e.g. "business-cards"
// params.slug     → e.g. "standard-business-card"

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { category, slug } = await params;

  return (
    <main>
      <h1>Product: {slug}</h1>
      <p>Category: {category}</p>
      {/* TODO: OptionSelector, FileUploader, AddToCart */}
    </main>
  );
}
