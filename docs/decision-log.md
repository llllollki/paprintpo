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

## Phase 3 (next)
- Implement Supabase auth in middleware
- Build product listing page and configurator
