---
status: active
owner: product/engineering
last_reviewed: 2026-04-28
source_of_truth: true
review_trigger: update when implementation state, blockers, priorities, or open questions change
---

# Project State — 2026-04-28

## Implemented

- [x] Next.js 15 App Router scaffold (store + admin route groups)
- [x] Drizzle ORM schema: `products`, `product_options`, `quantity_tiers`, `orders`, `order_items`, `order_files` (migrations 0001–0002)
- [x] Supabase auth + middleware (admin route guard, server-side email allowlist)
- [x] Cart: `CartProvider`, `CartDrawer`, cart page, repricing on quantity change, localStorage persistence (`paprintpo_cart`)
- [x] Product listing: `/products`, `/products/[category]`, `/products/[category]/[slug]`
- [x] `ProductConfigurator`: option selectors, quantity input, live price calculation, artwork upload before add-to-cart
- [x] `FileUploader`: staging presign endpoint, artwork stored in `staging/` prefix, `artworkFile` on `CartItem`
- [x] Stripe Checkout + `checkout.session.completed` webhook → order creation in DB transaction
- [x] Fulfillment architecture: `router.ts`, `adapters/`, `specs.ts`, `types.ts`, `service.ts`, `selection.ts`
- [x] Fulfillment schema: `fulfillment_quotes`, `fulfillment_submissions`, `fulfillment_events` (normalized — not flat log)
- [x] `orders.fulfillment_selection` JSONB column: `{ vendorId, quoteId, isOverride }`
- [x] `StubAdapter` (gated to non-production environments only)
- [x] Admin order workflow: order list, order detail, artwork review panel, fulfillment panel
- [x] `lib/env.ts` startup env validation
- [x] Security headers (CSP, `X-Frame-Options`, `Strict-Transport-Security`) in `next.config.ts`
- [x] MIME/extension cross-validation on upload presign
- [x] Filename sanitisation on presign (regex allowlist, path traversal prevention)
- [x] Quick Preview flow `/quick-preview`: upload → preview session → bundle mockup cards → add-to-cart
- [x] Bundle schema: `bundles`, `bundle_items`, `print_specs`, `vendor_product_mappings` (migration 0005)
- [x] `brand_profiles` table (migration 0005 — table exists, no UI yet)
- [x] `CartItem.bundleId` + `CartItem.bundleName` fields; cart groups and displays bundle items together
- [x] `products.quick_preview_enabled` boolean column
- [x] `preview_sessions` table with RLS; httpOnly session cookie
- [x] Stripe webhook idempotency (status guard on both `checkout.session.completed` and `payment_intent.payment_failed`)
- [x] Order status machine enforcement: `in_production` / `shipped` blocked from admin override
- [x] `fulfillment_failed` recovery: admin can re-request quotes after failed fulfillment
- [x] IDOR prevention on file status updates (join check to verify file belongs to order)
- [x] Checkout atomicity via `db.transaction()`
- [x] Margin floor: `MIN_MARGIN_CENTS = 500` in `lib/fulfillment/config.ts`
- [x] Auth callback open redirect fix (origin comparison, not `startsWith`)
- [x] N+1 eliminated in `requestQuotes` (batch vendor mapping load)
- [x] `toLabel()` consolidated in `lib/format.ts`

---

## Partially Implemented / In Progress

- [ ] **Brand profile capture UI** — `brand_profiles` table exists; no form or flow yet
- [ ] **Vendor adapters** — `StubAdapter` complete; Cloudprinter adapter partial; Prodigi / Printify / Printful adapters not started
- [ ] **Print spec → vendor SKU resolution** — `vendor_product_mappings` seeded for stub only; no real SKU mapping for Prodigi / Printify
- [ ] **Bundle adapter resolution fork** — `service.ts` resolves vendor SKUs via `product_vendor_mappings` (product_id → vendor); bundle items must use `vendor_product_mappings` (print_spec_id → vendor); fork not wired end-to-end
- [ ] **Reorder workflow** — no UI or backend for "reorder from past order"; Reorder Kit exists as a bundle concept only
- [ ] **Preview sessions TTL cron** — not running; orphaned staging files accumulate after 24h
- [ ] **Admin exception queue** — ad-hoc handling only; no structured exception view or workflow

---

## Fulfillment Lifecycle: Implemented vs. Target-State

The 19-state lifecycle described in `docs/product-brief.md` › Target-State Lifecycle is **not yet implemented**. The codebase uses the Phase 5 8-state machine:

**Currently implemented** (`lib/db/schema.ts` `ORDER_STATUSES`, all status-transition code):
```
pending → paid → artwork_review → proof_sent → proof_approved
  → in_production (webhook only) → shipped (webhook only) → complete
```
Plus: `payment_failed`, `cancelled`, `fulfillment_failed`, `submitted_to_vendor`

**Target direction** (documented, not implemented): `draft → artwork_uploaded → preflight_pending → preflight_passed | preflight_failed → quote_requested → quote_selected → payment_authorized → submitted_to_vendor → vendor_accepted | vendor_rejected → in_production → shipped | partially_shipped → delivered`

**Any agent planning fulfillment work must build against the implemented machine, not the target-state.** Transitioning to the target-state lifecycle requires cluster review + schema migration + updates across `service.ts`, adapters, admin, webhook handlers, and `OrderStatusBadge`.

---

## Stale Assumptions (Superseded by 2026-04-28 Pivot)

| Old assumption | Replaced by |
|---|---|
| Cloudprinter is the only MVP vendor | Category-routed: TBD for cards (Prodigi "coming soon"), Printify/Printful for stickers, Packhelp quote-assisted for packaging |
| Flyers, posters, brochures are core products | Core products: business cards, stickers, labels, inserts, packaging-adjacent collateral |
| Starter Brand Kit / Local Promo Kit / Repeat Customer Kit | New bundles: Launch Kit, Ecommerce Starter Kit, Local Service Kit, Market Booth Kit, Reorder Kit |
| Simple 8-state status machine (`pending → paid → artwork_review → proof_sent → proof_approved → in_production → shipped → complete`) | Richer 19-state fulfillment lifecycle — see `docs/product-brief.md` › Fulfillment Lifecycle |
| Quick Preview shows individual product cards | Quick Preview shows bundle cards (Launch Kit, Ecommerce Starter Kit, Local Service Kit, Market Booth Kit) |
| Quick Preview bundle names: Starter Brand Kit, Local Promo Kit, Repeat Customer Kit | Replaced by new bundle catalog |

**Schema action required:** Existing seed data in `scripts/seed.ts` reflects old bundle names and old product focus. A seed update + migration is needed before next product-facing work.

---

## Remaining Implementation / Doc Gaps (2026-04-28 Alignment Pass)

### Fixed in 2026-04-28 alignment pass (pass 1)
- Homepage copy: hero tagline, hero body, Quick Preview CTA, categories subtext, footer tagline, CTA subtext
- Homepage BUNDLES array: replaced old kit names with Launch Kit / Ecommerce Starter Kit / Local Service Kit / Market Booth Kit
- `app/layout.tsx` description metadata aligned to new positioning
- `scripts/seed.ts`: bundle names and descriptions updated; `QUICK_PREVIEW_SLUGS` updated (half-page-flyer removed from Quick Preview eligibility)
- `docs/product-brief.md`: Market Booth Kit "mini flyers" corrected; fulfillment lifecycle split into current-implementation vs. target-state
- `docs/decision-log.md`: Market Booth Kit item corrected; lifecycle clarified

### Fixed in 2026-04-28 alignment pass (pass 2 — this pass)
- `app/(store)/page.tsx` CATEGORIES: removed Flyers, Banners, Brochures, Posters from nav and footer (Banners/Brochures/Posters were already 404; Flyers removed per 2026-04-28 pivot decision)
- `app/(store)/page.tsx` categories grid: updated from 3-column to 2-column layout
- `app/(store)/page.tsx` "Our Products" heading: "Everything You Need to Print" → "Shop by Category"
- `docs/decision-log.md`: proxy spec note added
- `docs/project-state.md`: Next Implementation Plan added (Steps 1–8)

### Deferred — documented, not changed

**`_quick-preview-client.tsx` MOCKUP_PATHS entries for `flyers` and `posters`:**
Cannot remove until DB is re-seeded (Step 1 of Next Implementation Plan). If old bundles are still in the DB, these keys are reachable and their removal would fall back to `business_cards.svg` for stale Quick Preview sessions. Safe to remove after Step 1. See Next Implementation Plan › Step 2.

**`lib/fulfillment/specs.ts` legacy specs (`flyer_basic_250`, `poster_standard_1`):**
Code-layer specs registered in `PRINT_SPECS`; continue to be seeded into `print_specs` table. Unused by any active bundle after seed update. Requires `@spawn:` review + migration to remove. See Next Implementation Plan › Step 7.

**`public/mockups/flyers.svg`, `public/mockups/posters.svg`:**
Referenced by MOCKUP_PATHS; cannot be deleted until those keys are removed (Step 2). See Next Implementation Plan › Step 3.

**`half-page-flyer` product in seed catalog:**
`/products/flyers` is now a hidden route (no longer in nav). Removing the product requires Product Manager approval. See Next Implementation Plan › Step 4.

**Missing print specs for proxy bundle items:**
`reminder_card_250`, `loyalty_card_250`, `sticker_die_cut_100` used as proxies for thank-you cards, QR cards, roll labels, mailer stickers, inserts, price/menu cards. Requires new `PRINT_SPECS` entries, `@spawn:` review, migration, and seed update. See Next Implementation Plan › Step 5.

**Future agents must not treat these as implemented:**
- 19-state fulfillment lifecycle (target-state only; 8-state machine is live)
- Roll labels, QR cards, thank-you cards, price/menu cards as purchasable products
- Reorder Kit as a static bundle (it is per-user; no seed entry)
- Packhelp, Prodigi, Printify, Printful as wired vendor adapters

---

## Next Implementation Plan

Sequenced steps to remove old flyer/poster/brochure/banner assumptions and replace proxy bundle specs with real MVP print specs. Each step lists exact files likely to change, compatibility blockers, and required review gates.

---

### Step 1 — Re-seed development database *(no code change)*

Run `npm run seed` against the dev DB to apply the updated bundle definitions from the 2026-04-28 alignment pass.

- No files change.
- **Unlocks Step 2:** after re-seed, `flyers` and `posters` product types no longer appear in any bundle item from the DB. MOCKUP_PATHS keys become unreachable.
- **Blocker:** must confirm no active development orders reference old bundle specs before re-seeding (seed deletes and re-inserts all bundle rows).

---

### Step 2 — Remove stale MOCKUP_PATHS keys *(trivial UI — no @spawn, no migration)*

**Why deferred from this pass:** The `flyers` and `posters` keys in `MOCKUP_PATHS` are reachable if the DB still has old bundle records (Starter Brand Kit / Local Promo Kit with `flyer_basic_250` and `poster_standard_1` specs). Removing the keys before Step 1 changes the fallback output for stale DB bundles from the correct SVG to `business_cards.svg`.

**Evidence the keys become unreachable after Step 1:**
- Search `grep -rn "flyers\|posters" --include="*.ts" --include="*.tsx"` (excluding docs): MOCKUP_PATHS is the only runtime reference to these strings as product types.
- After re-seed, new bundle items only carry productTypes: `business_cards`, `stickers`, `loyalty_cards`, `reminder_cards`. No DB path reaches `flyers` or `posters` productType.
- `MOCKUP_PATHS` is a `Record<string, string>` lookup with a fallback (`?? "/mockups/business_cards.svg"`); unused keys are inert at runtime — the only risk is pre-Step-1 stale bundles.

**Files to change after Step 1:**
- `app/(store)/quick-preview/_quick-preview-client.tsx` — remove `flyers` and `posters` entries from `MOCKUP_PATHS`

**No @spawn review required.** No migration. No product approval. Trivial UI change.

---

### Step 3 — Remove orphaned mockup SVGs *(file deletion — no code change)*

After Step 2, `public/mockups/flyers.svg` and `public/mockups/posters.svg` are unreferenced by any code path.

- Delete `public/mockups/flyers.svg`
- Delete `public/mockups/posters.svg`
- **Verify first:** `grep -rn "flyers.svg\|posters.svg"` returns no code references.
- No @spawn. No migration.

---

### Step 4 — Remove half-page-flyer from seed catalog *(seed/product approval)*

**Blocker:** Product decision required. The `half-page-flyer` product keeps `/products/flyers` alive as a valid route. Removing it means:
- `/products/flyers` returns 404 (no products in category)
- This is acceptable since Flyers are no longer in the nav (done in this pass)

**Files to change:**
- `scripts/seed.ts` — remove the `half-page-flyer` entry from `catalog`; update `QUICK_PREVIEW_SLUGS` comment

**Requires:** Product Manager approval (scope change removes a live product type). No @spawn. No migration.

---

### Step 5 — Add new MVP print specs *(requires @spawn: review + migration)*

Add real print specs for the product types currently using proxies. For each new spec:

| Target product type | Spec ID to add | Proxy it replaces |
|---|---|---|
| QR/contact card | `qr_card_250` | `loyalty_card_250` |
| Thank-you card | `thank_you_card_250` | `reminder_card_250` |
| Roll label | `roll_label_100` | `sticker_die_cut_100` |
| Mailer/box sticker | `mailer_sticker_100` | `sticker_die_cut_100` |
| Packaging insert | `insert_250` | `reminder_card_250` |
| Price/menu card | `price_menu_card_250` | `reminder_card_250` |

**Files to change:**
- `lib/fulfillment/specs.ts` — add new `PrintSpec` entries to `PRINT_SPECS`
- `scripts/seed.ts` — add products for each new spec; update bundle items to use real spec IDs; add new spec IDs to `QUICK_PREVIEW_SLUGS`
- Migration: new rows in `print_specs` table

**Requires:** `@spawn:` review (schema migration on `print_specs` + bundle items change). Print Production Manager review (bleed/DPI/size requirements per product type). Product Manager approval.

---

### Step 6 — Populate vendor_product_mappings for new specs *(requires vendor API access)*

After Step 5, map each new spec to a real vendor SKU.

**Blocker:** Vendor API accounts must be confirmed (Prodigi availability for business cards, Printify/Printful for stickers/labels). See `docs/vendors/vendor-research.md` › Open Questions.

**Files to change:**
- `scripts/seed.ts` — add `vendor_product_mappings` seed rows for each new spec + vendor
- Migration: new rows in `vendor_product_mappings`

**Requires:** `@spawn:` review. Vendor account access confirmed.

---

### Step 7 — Remove legacy flyer/poster print specs *(requires @spawn: review)*

After Step 4 (half-page-flyer removed from catalog) and Step 6 (new specs active), `flyer_basic_250` and `poster_standard_1` have no live products and no bundle items.

**Verify before removing:** `SELECT * FROM vendor_product_mappings WHERE print_spec_id IN ('flyer_basic_250', 'poster_standard_1')` returns empty. `SELECT * FROM fulfillment_quotes WHERE /* references these specs */` returns empty in dev.

**Files to change:**
- `lib/fulfillment/specs.ts` — remove `flyer_basic_250` and `poster_standard_1` from `PRINT_SPECS`
- Migration: delete rows from `print_specs` table

**Requires:** `@spawn:` review. Confirm no existing order records reference these specs.

---

### Step 8 — Fulfillment lifecycle migration *(separate project track — do not start without dedicated cluster review)*

Migrating from the 8-state machine to the 19-state target-state lifecycle is a substantial cross-cutting change. It requires:
- Schema migration (new status values, new status-check constraint)
- Updates to `lib/db/schema.ts` ORDER_STATUSES
- Updates to `lib/fulfillment/service.ts` (all status guards)
- Updates to all vendor webhook handlers
- Updates to admin order UI (status badge labels, fulfillment panel conditions)
- Updates to store order status page (customer-facing status labels)
- Business Analyst + COO + Systems Architect cluster review

**Do not begin until Steps 1–7 are complete and vendors are wired.** Document progress in a separate decision-log entry when the cluster review is scheduled.

---

## Current Blockers

1. **Prodigi business cards "coming soon"** — listed on prodigi.com but not yet purchasable; business card vendor for MVP is unconfirmed. Evaluate Cloudprinter or Gooten as interim.
2. **No vendor API accounts** — Prodigi, Printify, Printful API keys not set up; no real quotes possible
3. **Bundle seed data stale** — seeds old bundle names; needs update to Launch Kit, Ecommerce Starter Kit, Local Service Kit, Market Booth Kit, Reorder Kit
4. **`vendor_product_mappings` empty for real vendors** — stub only; real SKU mapping not populated
5. **Brand profile UI missing** — table exists but no capture form; Quick Preview relies on raw artwork overlay only
6. **Preview sessions TTL cron not running** — orphaned staging files accumulate

---

## Recommended Next Priorities

1. Confirm business card vendor: check Cloudprinter and Gooten API access + US fulfillment + business card SKUs; resolve Prodigi "coming soon" timeline
2. Update bundle seed data to new catalog
3. Implement Printify or Printful adapter for stickers/labels; populate `vendor_product_mappings`
4. Implement business card adapter for confirmed vendor
5. Brand profile capture form (connected to `brand_profiles` table)
6. Preview sessions TTL cron (Supabase edge function or cron job)
7. Admin exception queue structured view
8. Reorder workflow (order history → reorder from past approved artwork)

---

## Open Questions

- Which Cloudprinter or Gooten product IDs map to business card `print_spec_id`s? Is US fulfillment confirmed for both?
- Printify vs. Printful for stickers/labels: which has better US fulfillment, sticker/label SKU coverage, API quality, and margin at low quantities?
- Is Packhelp API available for USA-originating, customer-direct orders? Or is it sales-gated for all packaging at MVP?
- What is the Reorder Kit UX? Same bundle flow with pre-filled artwork, or a dedicated order-history reorder page?
- Guest user reorder: how do anonymous past orders get linked to a new logged-in session?
- At what order volume does moving bundle pricing / margin rules to DB (away from `lib/pricing.ts`) make sense?
