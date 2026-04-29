---
status: active
owner: product/engineering
last_reviewed: 2026-04-28
source_of_truth: true
review_trigger: update when positioning, product categories, bundles, workflow, fulfillment lifecycle, architecture, or business rules change
---

# Paprintpo — Product Brief

## Positioning

**"Instant branded print kits for very small businesses."**

Paprintpo is not a generic print marketplace. It is a workflow-first platform: customers provide brand information once and receive coordinated, reorderable print bundles — without needing to understand print specifications or configure products one by one.

Flagship promise: **Upload once / brand everywhere / reorder easily.**

Do not frame Paprintpo as a catalog browser. Do not make sustainability claims unless backed by specific vendor specifications.

## Primary Customers

- B2C and B2B very small businesses (< 10 employees), budget-conscious, non-designers
- Shopify / Etsy sellers
- Local service businesses (cafes, restaurants, salons, cleaners)
- Beauty / wellness brands
- Makers and market vendors
- Creators and DTC microbrands
- Agencies / resellers serving small businesses

## Product Categories

Initial focus — **repeat-purchase engine first**:

| Category | Notes |
|---|---|
| Business / company cards | Entry product and trust-builder |
| Stickers (die-cut, kiss-cut, sheet) | Repeat-purchase core |
| Product labels (roll, sheet) | High-reorder frequency |
| QR / contact cards | Digital-native format |
| Thank-you cards / inserts | Ecommerce pack-in standard |
| Roll labels | Ecommerce and retail |
| Box / mailer stickers | Shipping branding |
| Packaging tape | Branded shipping |
| Tissue paper | Premium unboxing |
| Mailers / packaging products | Where vendor API support confirmed |

**Not in initial focus** (do not add without approval): flyers, brochures, banners, posters as primary products. Business cards are a trust-builder and entry product — not the sole focus.

## Stack (Fixed)

Next.js 15 App Router · Supabase Postgres · Drizzle ORM · Stripe · Tailwind + shadcn · Supabase Storage

No changes without explicit approval.

Key paths: `/lib` business logic · `/lib/fulfillment` fulfillment orchestration · `/lib/fulfillment/router.ts` routing engine · `/lib/fulfillment/adapters/` vendor adapters · `/lib/templates/` template logic · `/components` UI · `/docs` documentation

---

## Bundle Catalog

Bundles are DB-driven collections of internal print specs — never vendor SKUs. Prioritize workflow over catalog browsing. Bundle contents reference `print_spec_id`s only.

| Bundle | Contents | Target customer |
|---|---|---|
| **Launch Kit** | Business cards + logo stickers + QR/contact cards + thank-you cards | New business, first order |
| **Ecommerce Starter Kit** | Roll labels + mailer/box stickers + thank-you inserts + return/QR cards | Shopify / Etsy seller |
| **Local Service Kit** | Business cards + appointment/reminder cards + review-request cards | Cafe, salon, local service |
| **Market Booth Kit** | Price/menu cards + stickers + loyalty cards | Market vendor, maker |
| **Reorder Kit** | Replenishment of past approved items | Returning customer |

**Bundle rules:**
- Bundle pricing lives in `lib/pricing.ts` — per-item costs fetched individually, bundle-level margin calculated in aggregate
- Bundles are DB-driven — never hardcode bundle contents in code
- Minimum margin threshold in `lib/fulfillment/config.ts` — never inline in quote logic
- Bundle items reference internal `print_spec_id`s only — never vendor product IDs or SKUs

---

## Core Workflow: "Upload Once / Brand Everywhere"

1. Customer creates or updates a **brand profile** (business name, logo, optional address / phone / website / tagline)
2. Customer selects a **bundle** (guided to the most relevant kit by use case)
3. Platform generates coordinated mockups for all items in the bundle using the brand profile
4. Customer reviews, adjusts per-product options (finish, quantity, etc.), and approves
5. Customer checks out; artwork / files are locked to the order
6. Every fulfilled item is **reorderable** from past approved artwork — customer never re-uploads the same file

### Brand Profile Vault

`brand_profiles` table: `business_name`, `logo_storage_path`, `address`, `phone`, `website`, `social_handle`, `tagline`, nullable `user_id` (guest sessions supported via cookie token).

Security requirements:
- Contains PII — RLS required; GDPR/CCPA deletable on request
- Logo stored in private Supabase Storage bucket; signed URL access only — never public URL
- Data minimization: store only what checkout, fulfillment, and template generation require

### Quick Preview Path (Alternate Entry — No Brand Profile Required)

Customers without a brand profile can upload raw artwork and immediately see it applied across a bundle's product mockups. Route: `/quick-preview`.

**Session rules:**
- Artwork stored in Supabase Storage (`staging/` prefix); path written to `preview_sessions`
- Guest users supported: `preview_sessions.user_id` nullable; session identified by server-set httpOnly cookie; RLS scoped to that token
- All bundle product mockups show the same uploaded artwork simultaneously — one upload, multiple mockups
- Second upload in same session replaces `storage_path` and re-renders all mockups; previous staging file orphaned at TTL
- Validation warnings: inline per product card within expanded bundle, non-blocking
- TTL: 24 hours; orphaned files cleaned by cron or Supabase edge function
- On "Add Bundle to Cart": each `CartItem` carries `artworkFile` referencing the same `storage_path` + `bundleId` + `bundleName`
- At checkout: `order_files` rows created from `artworkFile` (same path, one row per order item)

**Post-MVP** (do not implement now):
- Brand-info-driven preview (logo + name → auto-generated templates instead of raw overlay)
- Real print-accurate rendering (bleed, DPI, CMYK)
- More than 4 bundles in the preview grid

### Reorder Workflow

Every fulfilled order creates a reorderable record. Past approved artwork is referenced by `storage_path`. Customers trigger reorders from order history without re-uploading. The Reorder Kit bundle is a first-class entry in the bundles table.

---

## Fulfillment Architecture

MVP model: **category-routed, vendor-adapted**. One preferred vendor per product category. Design adapter boundaries so vendors can be swapped later without touching domain code.

### MVP Routing Table (Static)

| Category | Preferred vendor | Fallback | Notes |
|---|---|---|---|
| `business_cards` | TBD (Prodigi listed as "coming soon"; Cloudprinter or Gooten as interim) | Gelato | Verify Prodigi availability before adapter work |
| `stickers_labels` | Printify or Printful | Prodigi, Gooten | Confirm sticker/label SKU availability and margin |
| `packaging` | Packhelp | Manual / quote-assisted | Treat as sales-gated until API + USA fulfillment confirmed |

Do not build automated multi-vendor optimization, bidding, or split routing — those are post-MVP.

### Vendor Adapter Contract (Thin Interface)

Every vendor adapter must implement exactly:

```
quote(spec, quantity, destination) → NormalizedQuote
validateArtwork(file, spec) → ValidationResult
submitOrder(quote, artwork, recipient) → VendorOrderRef
cancelIfAllowed(vendorOrderRef) → CancelResult
getStatus(vendorOrderRef) → NormalizedStatus
handleWebhook(payload, signature) → WebhookEvent
```

Normalize quotes — not entire catalogs.

### Normalized Quote Fields

```
vendor           category         productKey       quantity
unitCost         setupFees        shippingOptions  taxEstimate
currency         minDeliveryDate  maxDeliveryDate  productionDays
quoteExpiresAt   rawQuote
```

### Architectural Rules

- Separate "internal preflight passed" from "vendor accepted" — these are distinct states
- Store raw vendor payloads on every response
- Store every inbound webhook event before processing
- Webhook handlers must be idempotent; acknowledge quickly, process async
- Use internal idempotency keys for: checkout, quote confirmation, payment capture, vendor submission, webhook processing
- Treat quote and shipping prices as volatile — request final quote close to checkout; do not cache aggressively
- For long packaging review cycles: use quote / deposit / invoice / manual approval rather than short card authorization hold
- All fulfillment calls go through `lib/fulfillment/router.ts` — never import a vendor adapter directly outside the router

---

## Fulfillment Lifecycle

### Current Implementation (as of 2026-04-28)

The code implements an 8-state machine from Phase 5. This is what exists in `lib/db/schema.ts`, `components/admin/OrderStatusBadge.tsx`, and all order-status transition code:

```
pending → paid → artwork_review → proof_sent → proof_approved
  → in_production   ← vendor webhook only
  → shipped         ← vendor webhook only
  → complete
```

Terminal states: `payment_failed`, `cancelled`, `fulfillment_failed`
Transitional: `submitted_to_vendor` (set in `lib/fulfillment/service.ts` after vendor submission attempt)

**Rules that apply to the current implementation:**
- `in_production` and `shipped` set by vendor webhook only — never by admin or code
- No fulfillment submission without `proof_approved` status
- `fulfillment_failed` is a recoverable state — admin can re-request quotes and retry
- Status machine changes require Business Analyst + COO + Systems Architect cluster review + update to this file

### Target-State Lifecycle (not yet implemented — do not build against this)

The following richer lifecycle is the product-direction goal. It is **not** in the codebase. Any agent planning fulfillment work must verify against the current implementation above, not this target.

```
draft
  → artwork_uploaded
    → preflight_pending
      → preflight_passed
      → preflight_failed (admin exception; customer notified)
        → quote_requested
          → quote_selected
            → payment_authorized
              → submitted_to_vendor
                → vendor_accepted
                → vendor_rejected (admin exception)
                  → in_production          ← vendor webhook only
                    → shipped              ← vendor webhook only
                    → partially_shipped    ← vendor webhook only
                      → delivered
```

Terminal/exception (target): `admin_exception`, `canceled`, `refunded`, `reprint_requested`

Implementing this lifecycle requires: schema migration, status check updates across all adapters/service/admin routes, new prepress/preflight states, and a cluster review before any work begins.

### Payment Rules

**Instant API products (cards, stickers, labels):**
1. Customer accepts final quote
2. Authorize payment (do not capture yet)
3. Run preflight checks
4. Submit to vendor
5. Capture when vendor accepts (or at clear non-cancelable threshold)

**Packaging quote workflow:**
- Separate deposit / invoice / manual approval flow
- Do not auto-capture for long packaging review cycles

Cancellations: void the Stripe payment intent if not yet captured. Failed quotes: surface to admin with full context — never swallowed silently.

---

## Prepress Validation (Category-Aware)

### General (all categories)

- File reachable and readable
- File type allowlist (PDF, PNG, JPG — by category; SVG where supported)
- Max file size enforced
- Malware / content scan
- Dimensions check (minimum and maximum)
- DPI / PPI check
- Bleed, trim, and safe-area check
- Color profile warnings (RGB → CMYK advisory)
- Password-protected PDF rejection
- Transparent background handling per product type
- Barcode / QR readability check where applicable

### Business cards

- Strict bleed / trim / safe-area (typically 3 mm bleed)
- 300 DPI minimum
- Front / back completeness check

### Stickers / labels

- Low-resolution warning
- Die-cut / kiss-cut path constraints where applicable
- Label material and finish compatibility check

### Packaging

- Dieline required and validated
- All panels / sides present
- Material / substrate specified
- MOQ confirmed before quote
- Human proofing required — no automated approval
- Longer lead times; quote-assisted workflow until API confirmed

---

## Admin Exception Queue

Admin queue must surface and handle:

- Quote mismatch / expired quote
- Artwork preflight failed (block + notify customer + queue for admin)
- Vendor hold / vendor rejection
- Address failure / shipping method unavailable
- Payment authorization expired
- Vendor cancellation window missed
- Duplicate webhook / out-of-order webhook / status conflict
- Reprint / refund / chargeback requests

---

## MVP Scope

**In scope:**
1. ~~Choose stack~~ Done
2. ~~Scaffold storefront~~ Done
3. Drizzle schema updates for new bundle catalog (requires `@spawn:` review)
4. Supabase auth + middleware
5. Product listing and bundle configurator
6. Quick Preview flow (`/quick-preview`)
7. File upload + brand profile capture form
8. Stripe Checkout + webhook
9. Category-routed vendor adapters: business cards (Cloudprinter or Gooten pending Prodigi availability) + stickers (Printify or Printful)
10. `/admin` order workflow with exception queue

**Post-MVP (do not implement without approval):**
- Automated multi-vendor routing, bidding, or split fulfillment
- Second vendor adapter in same category without explicit approval
- Brand-info-driven Quick Preview (logo + name → auto-generated templates)
- Real print-accurate rendering (bleed, DPI, CMYK)
- Packaging API automation (Packhelp quote-assisted / manual until confirmed)
- Direct mail (Lob — only if direct mail becomes a product line)
- Design tools / template library
- CMO / marketing campaigns

---

## Non-Negotiable Business Rules

1. Prioritize bundle-first shopping over catalog-first browsing
2. Every order should create or update a reusable brand profile
3. Every fulfilled item should be reorderable from past approved artwork
4. Product expansion should favor repeat-use print items before novelty items
5. Packaging, labels, inserts, and stickers are the repeat-purchase engine
6. Business cards are a trust-builder and entry product — not the only focus
7. Do not make sustainability claims unless backed by vendor specifications
8. Platform claims no IP ownership over uploaded artwork or business logos (T&Cs must be explicit)
9. `brand_profiles` PII (address, phone) must be deletable on user request (GDPR/CCPA)
10. Adapters must never be imported directly outside `lib/fulfillment/router.ts`
11. Bundles are DB-driven — never hardcode bundle contents in application code
12. No production submission without proof of vendor acceptance
