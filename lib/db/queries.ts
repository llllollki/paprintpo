// Query layer — all DB reads for the storefront go through here.
// Each function is typed against the inferred Drizzle row types from schema.ts.

import { db } from "./index";
import { products, productOptions, quantityTiers } from "./schema";
import type { Product, ProductOption, QuantityTier } from "./schema";
import { eq, and } from "drizzle-orm";

export async function getProducts(): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.name);
}

export async function getProductsByCategory(
  category: string
): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.category, category)))
    .orderBy(products.name);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getProductOptions(
  productId: string
): Promise<ProductOption[]> {
  return db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, productId))
    .orderBy(productOptions.groupName, productOptions.sortOrder);
}

export async function getQuantityTiers(
  productId: string
): Promise<QuantityTier[]> {
  return db
    .select()
    .from(quantityTiers)
    .where(eq(quantityTiers.productId, productId))
    .orderBy(quantityTiers.minQty);
}
