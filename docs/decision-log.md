# Decision Log

## 2026-04-09 — Project init
- Project initialized for printing ecommerce
- Claude Code project memory added via CLAUDE.md
- Goal: configurable printing storefront with upload flow

## 2026-04-09 — Stack decision
**Chosen stack:** Next.js 15 (App Router) + Supabase (Postgres + Storage + Auth) + Drizzle ORM + Stripe Checkout + Tailwind CSS + shadcn/ui + Vercel

**Rejected alternatives:**
- Shopify/Medusa: variant model breaks down for multi-axis print options
- Payload CMS: over-engineered admin for MVP stage
- Firebase: NoSQL wrong model for relational order data
- PlanetScale/Neon: good DB but requires separate auth and storage services

## 2026-04-09 — Phase 1 scaffold + three architectural refinements

### Refinement 1: Quantity tiers as first-class pricing
Quantity tiers are not a flat multiplier on unit price. They are modeled as a
separate `quantity_tiers` table per product (Phase 2 schema), and the pricing
engine in `lib/pricing.ts` resolves the best applicable tier at calculation time.
**Why:** Print pricing is inherently tiered (100 qty ≠ 2× the cost of 50 qty).
Flat multipliers produce wrong prices at volume and can't express industry-standard
bracket pricing.

### Refinement 2: Expanded order status for artwork/proof workflow
Order status enum:
  `pending → paid → artwork_review → proof_sent → proof_approved → in_production → shipped → complete`
  Plus terminal states: `payment_failed`, `cancelled`
**Why:** Print jobs require human review of customer artwork before going to press.
A simple paid/shipped model skips the approval step that prevents costly reprints.

### Refinement 3: Pricing logic decoupled from product options
`lib/pricing.ts` — pure pricing calculation, no UI dependencies  
`components/product/OptionSelector.tsx` — display of configurable options, no price logic  
**Why:** Pricing rules will likely move to the database or a pricing API as the
product catalog grows. Keeping them separate means that migration won't require
touching UI components. It also makes pricing logic unit-testable in isolation.

## Phase 1 files created
- `app/` — full route skeleton (store, admin, auth, API routes)
- `components/` — ProductCard, OptionSelector, FileUploader, CartDrawer, OrderStatusBadge
- `lib/` — db client stub, supabase client/server, stripe client, pricing engine, upload helpers
- `middleware.ts` — /admin route guard stub
- `.env.example` — all required environment variables documented
- `drizzle.config.ts` — Drizzle Kit configuration

## 2026-04-11 — Phase 2 Drizzle schema

Tables defined in `lib/db/schema.ts`:
- `products` — catalog with slug, category, base_price (cents), active flag
- `product_options` — one row per selectable value; grouped by group_name; price_modifier in cents
- `quantity_tiers` — volume pricing per product; resolution logic in `lib/pricing.ts`
- `orders` — customer email/name, status (text + check constraint), subtotal_cents + total_cents, Stripe fields
- `order_items` — snapshot fields (product_name_snapshot, options_snapshot jsonb) preserve purchase record; product_id nullable FK
- `order_files` — Supabase Storage paths only; per-item artwork tracking with status

Key decisions:
- `order_items.product_id` is nullable (SET NULL on delete) — snapshot is source of truth
- `options_snapshot` is jsonb — avoids a join table and schema churn as option groups evolve
- Order/file status is text + check constraint — adding a status never requires a migration
- `subtotal_cents` + `total_cents` both on orders — subtotal is sum of line totals; total is final charged amount
- `QuantityTier` type is now canonical in the schema; `lib/pricing.ts` imports and re-exports it

## 2026-04-12 — Phase 3: Storefront foundations

### Pricing engine fix — option modifiers now stack on tier price
**Before:** `unitPrice = tierApplied ? tierApplied.unitPrice : adjustedBase`
**After:** `unitPrice = tierApplied ? tierApplied.unitPrice + optionTotal : adjustedBase`
**Why:** Tier prices represent the volume-discount unit rate. Option modifiers (rush
surcharge, gloss finish, double-sided) are per-unit add-ons that apply regardless of
volume. Dropping them when a tier applies produced wrong prices as soon as any
option had a non-zero modifier. Scoped change: one line in `lib/pricing.ts`.

### Seed catalog — `scripts/seed.ts`
Three products seeded: Standard Business Card, Half-Page Flyer, Die-Cut Sticker.
Each has 2–3 option groups and 3–4 quantity tiers. Idempotent (delete by slug,
then re-insert). Run via `npm run seed` (requires `DATABASE_URL` in `.env.local`).

### Query layer — `lib/db/queries.ts`
Five typed functions: `getProducts`, `getProductsByCategory`, `getProductBySlug`,
`getProductOptions`, `getQuantityTiers`. All reads go through here; pages do not
instantiate `db` directly.

### Pages added/updated
- `/products` — catalog listing grouped by category, server component
- `/products/[category]` — filtered listing, 404s if category has no active products
- `/products/[category]/[slug]` — product detail; server component fetches and passes
  data to `ProductConfigurator` (client component) for interactive state

### Components added/updated
- `ProductCard` — upgraded to Next.js `Link`, typed against `Product` from schema, uses `formatCents`
- `OptionSelector` — renamed `ProductOption` UI type to `OptionGroup` (avoid name clash
  with DB-layer `ProductOption`); added `toLabel` helper for display; option modifier
  delta shown inline in each `<option>`
- `ProductConfigurator` (new) — client component owning `selected`, `quantity`, and
  live `calculatePrice` call; transforms flat DB option rows into `OptionGroup[]`;
  renders `OptionSelector`, quantity input, live price display, `FileUploader` placeholder,
  and disabled Add to Cart button

### Placeholder / not wired
- `FileUploader` — renders as-is; no presign API call; note tells user upload is at checkout
- Add to Cart button — disabled, no cart state
- Auth, Stripe, webhooks, admin — not touched

## 2026-04-13 — Phase 4: Cart foundations

### Cart item shape — `lib/cart.ts`
`CartItem` stores display fields (productName, optionLabels, quantity, prices) and
repricing fields (basePrice, optionModifiers, tiers). The repricing fields are frozen
at add-to-cart time so the cart page can recalculate price without any DB fetch.

### Repricing on quantity change
`updateQuantity` in the reducer calls `calculatePrice` with the stored basePrice,
optionModifiers, and tiers. If the new quantity crosses a tier threshold (e.g. from
99 to 100 units), unitPriceCents updates to the tier rate automatically.
`lineTotalCents` is always `unitPriceCents × quantity`.

### Persistence — localStorage
CartItems are serialized to `localStorage` under `"print_cart"` on every dispatch.
On mount, the CartProvider reads and hydrates. `hydrated: boolean` is exposed in
context so the cart page can avoid rendering stale empty-state before hydration.

### lib/pricing.ts — TierInput structural type
`PricingInput.quantityTiers` relaxed from `QuantityTier[]` (full DB row) to
`TierInput[]` (`{ minQty, unitPrice }[]`). Backward-compatible: QuantityTier still
satisfies TierInput. Allows CartTier (slim store type) to be passed without casting.

### Files added/updated
- `lib/cart.ts` — CartItem type, CartTier, CartProvider (createElement, no JSX),
  useCart hook, useReducer + localStorage sync
- `lib/pricing.ts` — TierInput type, relaxed PricingInput.quantityTiers
- `components/layout/StoreNav.tsx` (new) — sticky nav, cart count badge, owns
  CartDrawer open/close state
- `components/cart/CartDrawer.tsx` — real: item list, subtotal, View Cart link
- `app/(store)/layout.tsx` — wraps CartProvider + StoreNav
- `components/product/ProductConfigurator.tsx` — Add to Cart wired; builds
  CartItem from current selection; "Added to cart!" 2s feedback; button disabled
  until all option groups selected
- `app/(store)/cart/page.tsx` — real: line items, option labels, editable quantity
  (onBlur commits + reprices), remove button, subtotal; disabled checkout placeholder

### Placeholder / not wired
- Checkout button on /cart — disabled, Stripe not wired
- File upload — no change

## Phase 5 (next)
- Implement Supabase auth + middleware guard for /admin
- Wire Stripe Checkout + webhook
- Build admin order workflow
