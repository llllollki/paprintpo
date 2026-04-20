import { db } from "@/lib/db";
import { bundles, bundleItems, printSpecs, products, productOptions, quantityTiers } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { QuickPreviewClient } from "./_quick-preview-client";

export const metadata = {
  title: "Quick Preview — Paprintpo",
  description: "Upload your artwork and instantly see it on coordinated branded print kits for your small business.",
};

async function getBundlesWithSpecs() {
  const activeBundles = await db
    .select()
    .from(bundles)
    .where(eq(bundles.active, true));

  if (activeBundles.length === 0) return [];

  const bundleIds = activeBundles.map((b) => b.id);

  const itemRows = await db
    .select({ item: bundleItems, spec: printSpecs })
    .from(bundleItems)
    .innerJoin(printSpecs, eq(bundleItems.printSpecId, printSpecs.id))
    .where(inArray(bundleItems.bundleId, bundleIds));

  // Collect unique product types to fetch matching products
  const productTypes = [...new Set(itemRows.map((r) => r.spec.productType))];
  // Map productType → product category slug (e.g. business_cards → business-cards)
  const typeToCategory = (pt: string) => pt.replace(/_/g, "-");

  const categories = productTypes.map(typeToCategory);
  const productRows =
    categories.length > 0
      ? await db
          .select()
          .from(products)
          .where(inArray(products.category, categories))
      : [];

  const productIds = productRows.map((p) => p.id);

  const [optionRows, tierRows] = await Promise.all([
    productIds.length > 0
      ? db.select().from(productOptions).where(inArray(productOptions.productId, productIds))
      : Promise.resolve([]),
    productIds.length > 0
      ? db.select().from(quantityTiers).where(inArray(quantityTiers.productId, productIds))
      : Promise.resolve([]),
  ]);

  // Enrich products with options + tiers
  const enrichedProducts = productRows.map((p) => ({
    ...p,
    options: optionRows.filter((o) => o.productId === p.id),
    tiers: tierRows.filter((t) => t.productId === p.id).sort((a, b) => a.minQty - b.minQty),
  }));

  // Build bundles with their items and matched products
  return activeBundles.map((bundle) => ({
    ...bundle,
    items: itemRows
      .filter((r) => r.item.bundleId === bundle.id)
      .map((r) => ({
        ...r.item,
        spec: r.spec,
        product: enrichedProducts.find(
          (p) => p.category === typeToCategory(r.spec.productType)
        ) ?? null,
      })),
  }));
}

export type BundleWithItems = Awaited<ReturnType<typeof getBundlesWithSpecs>>[number];

export default async function QuickPreviewPage() {
  const bundlesData = await getBundlesWithSpecs();

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      <QuickPreviewClient bundles={bundlesData} />
    </main>
  );
}
