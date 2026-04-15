// Query layer — all DB reads for the storefront go through here.
// Each function is typed against the inferred Drizzle row types from schema.ts.

import { db } from "./index";
import { products, productOptions, quantityTiers, orders, orderItems, orderFiles, fulfillmentQuotes } from "./schema";
import type { Product, ProductOption, QuantityTier, Order, OrderItem, OrderFile, FulfillmentQuote } from "./schema";
import { eq, and, desc, inArray } from "drizzle-orm";

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

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export async function getOrders(): Promise<Order[]> {
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderWithItems(
  id: string
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = rows[0] ?? null;
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return { order, items };
}

export async function getOrderFulfillmentQuotes(
  orderId: string
): Promise<FulfillmentQuote[]> {
  return db
    .select()
    .from(fulfillmentQuotes)
    .where(eq(fulfillmentQuotes.orderId, orderId))
    .orderBy(desc(fulfillmentQuotes.marginCents));
}

export async function getOrderWithItemsAndFiles(
  id: string
): Promise<{ order: Order; items: OrderItem[]; files: OrderFile[] } | null> {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = rows[0] ?? null;
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  const files =
    items.length > 0
      ? await db
          .select()
          .from(orderFiles)
          .where(inArray(orderFiles.orderItemId, items.map((i) => i.id)))
      : [];

  return { order, items, files };
}
