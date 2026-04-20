// Seed script — inserts a minimal sample catalog for storefront development.
// Safe to re-run: deletes existing rows by slug before inserting.
//
// Run: npm run seed
// Requires DATABASE_URL in .env.local (loaded via --env-file flag in package.json script).

import { db } from "../lib/db/index";
import {
  products,
  productOptions,
  quantityTiers,
  printSpecs,
  bundles,
  bundleItems,
} from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { PRINT_SPECS } from "../lib/fulfillment/specs";

// ---------------------------------------------------------------------------
// Catalog definition
// ---------------------------------------------------------------------------

const catalog = [
  {
    slug: "standard-business-card",
    name: "Standard Business Card",
    description:
      "3.5\" × 2\" business cards printed on premium card stock. Professional results for any industry.",
    category: "business-cards",
    // basePrice is the entry-level "starting from" display price (cents).
    // Tiers drive actual unit pricing in the configurator.
    basePrice: 4500, // $45.00 for 100
    options: [
      // finish
      { groupName: "finish", label: "Matte",  value: "matte",   priceModifier: 0,    sortOrder: 0 },
      { groupName: "finish", label: "Gloss",  value: "gloss",   priceModifier: 200,  sortOrder: 1 },
      // sides
      { groupName: "sides",  label: "Single-sided", value: "single", priceModifier: 0,    sortOrder: 0 },
      { groupName: "sides",  label: "Double-sided", value: "double", priceModifier: 500,  sortOrder: 1 },
      // turnaround
      { groupName: "turnaround", label: "Standard (5 business days)", value: "standard", priceModifier: 0,    sortOrder: 0 },
      { groupName: "turnaround", label: "Rush (2 business days)",     value: "rush",     priceModifier: 1500, sortOrder: 1 },
    ],
    tiers: [
      { minQty: 100,  unitPrice: 45 },  // $0.45/ea → $45.00
      { minQty: 250,  unitPrice: 30 },  // $0.30/ea → $75.00
      { minQty: 500,  unitPrice: 22 },  // $0.22/ea → $110.00
      { minQty: 1000, unitPrice: 16 },  // $0.16/ea → $160.00
    ],
  },
  {
    slug: "half-page-flyer",
    name: "Half-Page Flyer",
    description:
      "5.5\" × 8.5\" full-color flyers. Ideal for promotions, events, and announcements.",
    category: "flyers",
    basePrice: 4000, // $40.00 for 50
    options: [
      // paper
      { groupName: "paper", label: "Standard (80lb text)", value: "standard", priceModifier: 0,    sortOrder: 0 },
      { groupName: "paper", label: "Premium (100lb text)", value: "premium",  priceModifier: 300,  sortOrder: 1 },
      // sides
      { groupName: "sides", label: "Single-sided", value: "single", priceModifier: 0,    sortOrder: 0 },
      { groupName: "sides", label: "Double-sided", value: "double", priceModifier: 300,  sortOrder: 1 },
      // turnaround
      { groupName: "turnaround", label: "Standard (5 business days)", value: "standard", priceModifier: 0,    sortOrder: 0 },
      { groupName: "turnaround", label: "Rush (2 business days)",     value: "rush",     priceModifier: 2000, sortOrder: 1 },
    ],
    tiers: [
      { minQty: 50,  unitPrice: 80 },  // $0.80/ea → $40.00
      { minQty: 100, unitPrice: 55 },  // $0.55/ea → $55.00
      { minQty: 250, unitPrice: 38 },  // $0.38/ea → $95.00
      { minQty: 500, unitPrice: 28 },  // $0.28/ea → $140.00
    ],
  },
  {
    slug: "die-cut-sticker",
    name: "Die-Cut Sticker",
    description:
      "Custom-cut vinyl stickers in any shape. Weather-resistant and vibrant for indoor or outdoor use.",
    category: "stickers",
    basePrice: 3000, // $30.00 for 50
    options: [
      // material
      { groupName: "material", label: "White Vinyl",     value: "white",        priceModifier: 0,    sortOrder: 0 },
      { groupName: "material", label: "Holographic Foil",value: "holographic",  priceModifier: 500,  sortOrder: 1 },
      // finish
      { groupName: "finish", label: "Gloss", value: "gloss", priceModifier: 0,   sortOrder: 0 },
      { groupName: "finish", label: "Matte", value: "matte", priceModifier: 100, sortOrder: 1 },
    ],
    tiers: [
      { minQty: 50,  unitPrice: 60 },  // $0.60/ea → $30.00
      { minQty: 100, unitPrice: 40 },  // $0.40/ea → $40.00
      { minQty: 500, unitPrice: 20 },  // $0.20/ea → $100.00
    ],
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  // Clear dependent tables first to avoid FK violations on re-seed
  await db.delete(bundleItems);
  await db.delete(bundles);
  await db.delete(printSpecs);

  console.log("Seeding catalog…");

  for (const item of catalog) {
    // Remove existing rows for this slug (idempotent)
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);

    if (existing[0]) {
      console.log(`  Removing existing: ${item.slug}`);
      // Cascade deletes options and tiers via FK
      await db.delete(products).where(eq(products.id, existing[0].id));
    }

    // Insert product
    // Per CLAUDE.md: business cards, stickers, and flyers are Quick Preview eligible.
    const QUICK_PREVIEW_SLUGS = ["standard-business-card", "die-cut-sticker", "half-page-flyer"];
    const [product] = await db
      .insert(products)
      .values({
        slug: item.slug,
        name: item.name,
        description: item.description,
        category: item.category,
        basePrice: item.basePrice,
        active: true,
        quickPreviewEnabled: QUICK_PREVIEW_SLUGS.includes(item.slug),
      })
      .returning({ id: products.id });

    console.log(`  Inserted product: ${item.name} (${product.id})`);

    // Insert options
    await db.insert(productOptions).values(
      item.options.map((o) => ({ ...o, productId: product.id }))
    );
    console.log(`    ${item.options.length} options`);

    // Insert tiers
    await db.insert(quantityTiers).values(
      item.tiers.map((t) => ({ ...t, productId: product.id }))
    );
    console.log(`    ${item.tiers.length} quantity tiers`);
  }

  // ---------------------------------------------------------------------------
  // Print specs — seed from PRINT_SPECS constants
  // ---------------------------------------------------------------------------
  console.log("\nSeeding print specs…");

  for (const spec of Object.values(PRINT_SPECS)) {
    await db.insert(printSpecs).values({
      id: spec.id,
      productType: spec.productType,
      quantity: spec.quantity,
      size: spec.size,
      sides: spec.sides,
      finish: spec.finish,
      paperStock: spec.paperStock,
      orientation: spec.orientation,
      bleedMm: spec.bleedMm,
      dpiRequired: spec.dpiRequired,
    });
    console.log(`  ${spec.id}`);
  }

  // ---------------------------------------------------------------------------
  // Bundles — Starter Brand Kit, Local Promo Kit, Repeat Customer Kit
  // ---------------------------------------------------------------------------
  console.log("\nSeeding bundles…");

  const BUNDLE_DEFS = [
    {
      slug: "starter-brand-kit",
      name: "Starter Brand Kit",
      description: "Everything a new business needs to make a first impression — business cards, stickers, and reminder cards in one coordinated package.",
      price: 16900, // $169.00
      items: [
        "business_card_standard_250",
        "sticker_die_cut_100",
        "reminder_card_250",
      ],
    },
    {
      slug: "local-promo-kit",
      name: "Local Promo Kit",
      description: "Promote your business in the neighborhood — business cards, flyers, a poster, and stickers to cover all surfaces.",
      price: 19900, // $199.00
      items: [
        "business_card_standard_250",
        "flyer_basic_250",
        "poster_standard_1",
        "sticker_die_cut_100",
      ],
    },
    {
      slug: "repeat-customer-kit",
      name: "Repeat Customer Kit",
      description: "Built for retention — business cards, loyalty cards, reminder cards, and flyers to keep customers coming back.",
      price: 26900, // $269.00
      items: [
        "business_card_standard_250",
        "loyalty_card_250",
        "reminder_card_250",
        "flyer_basic_250",
      ],
    },
  ];

  for (const def of BUNDLE_DEFS) {
    const existing = await db
      .select({ id: bundles.id })
      .from(bundles)
      .where(eq(bundles.slug, def.slug))
      .limit(1);

    if (existing[0]) {
      await db.delete(bundles).where(eq(bundles.id, existing[0].id));
    }

    const [bundle] = await db
      .insert(bundles)
      .values({
        slug: def.slug,
        name: def.name,
        description: def.description,
        price: def.price,
        active: true,
      })
      .returning({ id: bundles.id });

    await db.insert(bundleItems).values(
      def.items.map((specId) => ({ bundleId: bundle.id, printSpecId: specId }))
    );

    console.log(`  ${def.name} (${def.items.length} items)`);
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
