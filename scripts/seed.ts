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
    // Quick Preview eligible: business cards and stickers are the MVP preview products.
    // Flyer removed: flyers are not an MVP-focus product type (see docs/product-brief.md).
    // Add new product slugs here when roll-label, QR-card, and label specs are added.
    const QUICK_PREVIEW_SLUGS = ["standard-business-card", "die-cut-sticker"];
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
  // Bundles — Launch Kit, Ecommerce Starter Kit, Local Service Kit, Market Booth Kit
  //
  // NOTE: Items are mapped to existing print_spec_ids. Several target-state product
  // types (roll labels, QR cards, thank-you cards, price/menu cards, mailer stickers)
  // do not have print specs yet. Closest existing specs are used as proxies until
  // those specs are added. See docs/project-state.md › Remaining Implementation Gaps.
  //
  // Reorder Kit is not seeded: it is per-user (order history) and cannot be a
  // static bundle. Implement as a dedicated reorder workflow (post-MVP).
  // ---------------------------------------------------------------------------
  console.log("\nSeeding bundles…");

  const BUNDLE_DEFS = [
    {
      slug: "launch-kit",
      name: "Launch Kit",
      description: "Business cards, logo stickers, QR/contact cards, and thank-you cards — everything a new business needs to make its brand visible from day one.",
      price: 16900, // $169.00
      // Target: business_card_standard_250 + sticker_die_cut_100 + qr_card_250 + thank_you_card_250
      // Proxy: reminder_card_250 used for both QR/contact cards and thank-you cards until specs exist
      items: [
        "business_card_standard_250",
        "sticker_die_cut_100",
        "loyalty_card_250",   // proxy for QR/contact card spec (pending)
        "reminder_card_250",  // proxy for thank-you card spec (pending)
      ],
    },
    {
      slug: "ecommerce-starter-kit",
      name: "Ecommerce Starter Kit",
      description: "Roll labels, mailer stickers, thank-you inserts, and return cards — coordinated branded packaging that turns Shopify and Etsy orders into repeat customers.",
      price: 14900, // $149.00
      // Target: roll_label_100 + mailer_sticker_100 + insert_250 + return_card_250
      // Proxy: sticker_die_cut_100 (mailer sticker), reminder_card_250 (insert), loyalty_card_250 (return card)
      // Roll label spec is pending — sticker used as interim placeholder
      items: [
        "sticker_die_cut_100",  // proxy for mailer sticker / roll label spec (pending)
        "reminder_card_250",    // proxy for thank-you insert spec (pending)
        "loyalty_card_250",     // proxy for return/QR card spec (pending)
      ],
    },
    {
      slug: "local-service-kit",
      name: "Local Service Kit",
      description: "Business cards, appointment/reminder cards, and loyalty cards — keep customers coming back and leave every visit memorable.",
      price: 12900, // $129.00
      items: [
        "business_card_standard_250",
        "reminder_card_250",
        "loyalty_card_250",
      ],
    },
    {
      slug: "market-booth-kit",
      name: "Market Booth Kit",
      description: "Price and menu cards, logo stickers, and loyalty cards — everything a maker or market vendor needs to run a professional booth.",
      price: 14900, // $149.00
      // Target: price_menu_card_250 + sticker_die_cut_100 + loyalty_card_250
      // Proxy: reminder_card_250 used for price/menu card spec (pending)
      items: [
        "reminder_card_250",  // proxy for price/menu card spec (pending)
        "sticker_die_cut_100",
        "loyalty_card_250",
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
