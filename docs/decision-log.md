# Decision Log

## 2026-04-19 — Bundle/print-spec schema + Quick Preview flow implemented

### Schema additions (migration 0005)
Four new tables added after @spawn: review:
- `print_specs`: Paprintpo-canonical specs with `bleed_mm` and `dpi_required` (required by Print Production Manager for prepress validation)
- `bundles`: DB-driven bundle definitions (slug, name, description, price, active)
- `bundle_items`: maps bundles → print_spec_ids; `quantity_override` nullable (NULL = spec default)
- `vendor_product_mappings`: maps print_spec_id → vendor SKU; server-side only (RLS deny-all)

### RLS decisions (per Security Engineer @spawn: review)
- `print_specs`: `USING (auth.role() = 'authenticated')` — anon users cannot enumerate specs
- `bundles`: `USING (active = true)` — inactive bundles do not leak
- `bundle_items`: `USING (true)` — public read (display gated through bundles join)
- `vendor_product_mappings`: `USING (false)` — deny all non-service-role access

### Quick Preview flow
Route `/quick-preview` implemented as server + client component split:
- Server: fetches bundles + items + specs + matched products in one page load
- Client: handles file upload, preview session (POST /api/preview-sessions), artwork overlay, and add-to-cart
- Session token: httpOnly cookie (`preview_session_token`); 24h TTL matches preview_sessions table
- Artwork overlay: CSS `object-fit: cover` over SVG mockup placeholders in `/public/mockups/`
- Signed read URL issued via `/api/preview-sessions` after upload — never a public URL

### CartItem extension
`bundleId` and `bundleName` added as optional fields. Cart page and drawer group items by `bundleId`. Bundle items are removable individually; "Remove bundle" button removes all items in a group.

### Adapter resolution fork (planned, not yet implemented)
Per Systems Architect: `service.ts` currently resolves vendor SKUs via `product_vendor_mappings` (product_id → vendor). When bundle items are fulfilled via `print_spec_id`, they must use `vendor_product_mappings` instead. This fork is needed before bundle fulfillment is wired end-to-end. Flagged in `Needs revisiting` in @spawn: sign-off.

## 2026-04-19 — Quick Preview spec: same-image bundle rendering + per-product options clarified

### Clarification 1: Uploaded artwork previews on ALL bundle products simultaneously
The uploaded image is the artwork source for every product mockup in a bundle — not per-product uploads. If a customer uploads `image1.jpg`, all mockups (business card, sticker, flyer) overlay that same image at the same time. This was clarified to remove ambiguity about whether each product gets its own upload.

### Clarification 2: Per-product option selectors are MVP scope
Customers can adjust specs (size, finish, quantity etc.) per product within an expanded bundle card. Moved out of Post-MVP into the MVP Rules section of the Quick Preview spec. The `OptionSelector` component is reused; options are independent per product (changing business card size has no effect on flyer options).

### Edge cases added
- Second upload in same session: replaces the `storage_path` in `preview_sessions`, re-renders all mockups; previous staging file orphaned at TTL
- Validation warnings: inline per product card within the expanded bundle (not per bundle card)
- Cart removal: bundle items displayed as a group by `bundleId` but removable individually; removing one item does not cascade to the rest of the bundle

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

## Phase 5 — Auth, Stripe, Admin, Fulfillment

### Fulfillment schema — normalized tables over flat log
CLAUDE.md originally specified a single `fulfillment_logs` table. The implemented
schema uses three tables instead:
- `fulfillment_quotes` — one row per vendor per quote request; enables multi-vendor
  comparison and margin-based selection via `lib/fulfillment/selection.ts`
- `fulfillment_submissions` — one row per submission attempt; separates quote data
  (for selection) from submission data (for action and audit)
- `fulfillment_events` — inbound vendor webhooks stored for async status updates
  (Phase D); separated because events arrive post-submission

**Why:** The flat log would conflate quote data with submission data. Normalized tables
allow re-quoting without losing submission history, and enable event-sourced order
status updates from vendor webhooks.

### Order fulfillment selection — JSONB over enum column
`orders.fulfillment_selection` is a JSONB column `{ vendorId, quoteId, isOverride }`
rather than a scalar enum column. Stores the `quoteId` alongside the vendor so the
service layer can validate the quote is still live before submitting. The `isOverride`
flag records whether the admin overrode the system recommendation (future analytics).

### Admin server actions — defence-in-depth auth guard
All server actions in `app/(admin)/admin/orders/[id]/actions.ts` call `requireAdmin()`
which re-verifies the Supabase session and email allowlist on every invocation.
Middleware provides page-level protection; the action-level check covers direct
server action calls that bypass the page render.

### File ownership check — IDOR prevention
`updateFileStatus` now joins `order_files → order_items` to verify the file belongs to
the supplied `orderId` before updating status. Without this, any admin could approve
or reject files from arbitrary orders.

### Checkout atomicity — DB transaction
Order row + order_items are now created inside a single `db.transaction()` call.
Prevents a partial state where the order exists but has no items if the second insert fails.

### Margin floor — `lib/fulfillment/config.ts`
`MIN_MARGIN_CENTS = 500` ($5.00). `submitToVendor()` throws before calling the
adapter if the selected quote's margin falls below this threshold. Adjust before
go-live once real Cloudprinter costs are known.

### Security headers — `next.config.ts`
Added `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy`, and `Strict-Transport-Security` via `headers()` in next.config.ts.

### RLS policies — `drizzle/rls_policies.sql`
Row Level Security enabled on all tables. Catalog tables (products, options, tiers)
allow public SELECT. All transactional tables (orders, items, files, fulfillment)
deny direct API access — all writes go through the service role via Drizzle.
Phase 4: replace USING (false) on orders/files with user-scoped policies once
`user_id` FK is added.

### Filename sanitisation — `api/uploads/presign/route.ts`
Filenames validated against `/^[a-zA-Z0-9._\- ]+$/` before a presign URL is issued.
Prevents path traversal attacks and shell metacharacter injection in storage paths.

## 2026-04-18 — Full agent assessment + hardening

### Stripe webhook idempotency
Both `checkout.session.completed` and `payment_intent.payment_failed` handlers now
include a status guard in the WHERE clause. Previously a duplicate or delayed event
could regress an already-advanced order (e.g. `artwork_review` → `paid`). Both
handlers now only transition from the expected prior state.

### Order status machine enforcement — admin actions
`FULFILLMENT_MANAGED` in `actions.ts` and `page.tsx` now includes `in_production`
and `shipped`. Previously those two states were omittable from the blocked list,
allowing admins to set them directly — violating the CLAUDE.md rule that only vendor
webhooks may set those statuses.

### Startup env validation — `lib/env.ts`
New module validates `DATABASE_URL`, Supabase, Stripe, and `ADMIN_EMAILS` on server
startup. In production, missing vars throw immediately. In development they warn.
Imported by `lib/db/index.ts` so it fires before the first DB query.

### Auth callback open redirect fix
The `?next=` parameter in `/auth/callback` now uses `new URL(rawNext, origin)` and
compares `.origin` values rather than just checking `startsWith("/")`. Protocol-relative
URLs like `//evil.com` could previously pass the startsWith check.

### CSP header + dynamic Supabase remotePatterns
`Content-Security-Policy` header added to `next.config.ts`. Directives are built
dynamically from `NEXT_PUBLIC_SUPABASE_URL` so they include the real Supabase
hostname once the env var is set. `images.remotePatterns` is also populated
dynamically from the same env var.

### MIME/extension cross-validation on uploads
`/api/uploads/presign` now cross-validates the declared MIME type against the
file extension. Prevents filename spoofing (e.g. `malware.exe.pdf` — regex passes
but `pdf` extension is checked against the declared `application/pdf` MIME type).

### Stub adapter gated to non-production
`lib/fulfillment/config.ts` now only registers StubAdapter when
`NODE_ENV !== "production"`. Previously it was registered unconditionally,
meaning a production deploy would send real orders to a fake stub.

### N+1 query eliminated in requestQuotes
Product vendor mappings are now batch-loaded in a single query before the adapter
loop, then filtered per-adapter in memory. Previously: one DB query per adapter.

### Schema additions — `quick_preview_enabled` + `preview_sessions`
`products.quick_preview_enabled` boolean added per CLAUDE.md spec. `preview_sessions`
table added for the Quick Preview feature. Migration: `drizzle/0004_add_quick_preview_enabled_and_preview_sessions.sql`.
Seed script updated to mark business cards, stickers, and flyers as Quick Preview eligible.
RLS policy for `preview_sessions` added to `drizzle/rls_policies.sql`.

### toLabel() extracted to `lib/format.ts`
Removed 4 duplicate inline `toLabel()` definitions from `cart/page.tsx`,
`orders/[id]/page.tsx`, `admin/orders/[id]/page.tsx`, and `OptionSelector.tsx`.
All now import from `@/lib/format`.

## 2026-04-19 — Quick Preview redesigned around bundles

### Bundle-first Quick Preview flow
The Quick Preview feature spec was updated to align with Paprintpo's bundle product model.

**Before:** Upload image → 3 individual product cards (business cards, stickers, flyers) with artwork overlay → add each to cart independently.

**After:** Upload artwork → 3 **bundle** preview cards (Starter Brand Kit, Local Promo Kit, Repeat Customer Kit) → each card shows a collage of its products with the artwork applied → "Add Bundle to Cart" adds all bundle items at once, each carrying the same `artworkFile` reference.

**Why:** Paprintpo's value proposition is coordinated branded collateral, not individual product SKU selection. Showing bundles in Quick Preview communicates the "full kit" story immediately. Individual product browsing remains available via `/products`.

**Key implementation notes added to CLAUDE.md:**
- `bundleId` + `bundleName` fields added to `CartItem` spec (not yet implemented in code — requires bundles schema `@spawn:` review first)
- Cart groups items by `bundleId` for display; checkout is unchanged
- Same `storage_path` referenced by all items in a bundle session — single upload, multiple `order_files` rows at checkout

## 2026-04-19 — Paprintpo rebrand + vendor-agnostic fulfillment architecture

### Project renamed: Paprintpo
Platform pivot: Paprintpo is now a template-driven print bundle platform for very small
businesses. `package.json` name updated to `"paprintpo"`. Cart localStorage key updated
from `"print_cart"` to `"paprintpo_cart"` — existing carts in older browser sessions
will clear on first load (expected; no data loss risk since cart is ephemeral).

### Vendor-agnostic fulfillment architecture
CLAUDE.md updated to require a routing layer between domain code and vendor adapters.
Rules: adapters must never be imported outside `router.ts`; all fulfillment calls go
through the router. This enforces the abstraction at MVP so adding Gelato or a local
vendor post-MVP does not require touching `service.ts`.

**New files:**
- `lib/fulfillment/router.ts` — routing engine; the only module that imports from
  registry/adapters; exposes `getQuoteAdapters()` and `getSubmitAdapter(vendorId)`
- `lib/fulfillment/specs.ts` — canonical Paprintpo print specs; stable IDs independent
  of any vendor; MVP specs: business cards, flyers, stickers, loyalty cards, reminder
  cards, poster

**Updated files:**
- `lib/fulfillment/types.ts` — added `NormalizedQuoteResult` (vendor-agnostic shape)
- `lib/fulfillment/service.ts` — now imports from `router.ts` only; `./config` import
  removed (router.ts handles adapter registration at import time)

### Schema additions — require @spawn: review (NOT yet implemented)
Per CLAUDE.md, these tables require `@spawn:` review before migrations are written:
- `bundles` — bundle definitions (Starter Brand Kit, Local Promo Kit, Repeat Customer Kit)
- `bundle_items` — maps bundles to internal print specs
- `print_specs` — Paprintpo-canonical specs (mirrored from `lib/fulfillment/specs.ts`)
- `vendor_product_mappings` — rename of existing `product_vendor_mappings`; new columns:
  `print_spec_id` replaces `product_id` as the mapping key
- `brand_profiles` — business name, logo, address, phone, website, social, tagline; PII;
  RLS required; logo in private Supabase Storage bucket

## 2026-04-19 — Artwork upload moved to configurator (pre-checkout)

### Upload timing — staging path in cart
Previously artwork was uploaded post-checkout on the order detail page. Now customers
upload at the product configurator step before adding to cart.

**Flow:** configure options → upload artwork → add to cart → checkout → `order_files`
row created inside the checkout transaction.

**Staging:** files upload to `staging/{uuid}.{ext}` in the `artwork` bucket. The path
is stored in `CartItem.artworkFile`. At checkout, the route validates
`storagePath.startsWith("staging/")` to prevent IDOR (user can't reference another
order's file path), then inserts into `order_files` with status `pending_review`.

**Orphans:** carts abandoned after upload leave orphaned staging files. These are
cleaned up by the same TTL cron as `preview_sessions` (deferred).

**Files changed:**
- `app/api/uploads/presign-staging/route.ts` — new endpoint, no order context required
- `lib/cart.ts` — `ArtworkFile` type + `artworkFile?` on `CartItem`
- `components/product/FileUploader.tsx` — fully implemented; calls presign-staging
- `components/product/ProductConfigurator.tsx` — artwork required before Add to Cart
- `app/api/checkout/route.ts` — accepts artworkFile, inserts order_files in transaction
- `app/(store)/cart/page.tsx` — shows artwork filename per line item

## 2026-04-19 — fulfillment_failed recovery fix

### Bug: admin locked out after fulfillment_failed (COO + Business Analyst + DevOps/QA)
`fulfillment_failed` was in `FULFILLMENT_MANAGED` in `page.tsx`, causing the status
dropdown to be replaced with a read-only "managed by fulfillment system" message.
Combined with `canRequest = status === "proof_approved"` in the panel, the admin
had no recovery path: couldn't reset status, couldn't re-request quotes.

**Fix:**
- `page.tsx`: Removed `fulfillment_failed` from the display-layer `FULFILLMENT_MANAGED`
  array. `actions.ts` `FULFILLMENT_MANAGED` unchanged — system remains the only writer
  of this status; admins still can't set orders *to* `fulfillment_failed` via the dropdown.
- `_fulfillment-panel.tsx`: Extended `canRequest` to include `fulfillment_failed` so
  the Re-request Quotes button shows. `canSubmit` still requires `proof_approved`
  (per CLAUDE.md constraint); retry flow is: re-request → select → reset status → submit.
- `lib/fulfillment/service.ts`: Added status guards — `requestQuotes()` allows
  `proof_approved | fulfillment_failed`; `submitToVendor()` requires `proof_approved`.
