# Paprintpo — Project Memory

## Project goal
Build **Paprintpo**, a template-driven print bundle platform for very small businesses. Customers provide minimal business info; the platform generates coordinated branded collateral and fulfills through print vendors via a vendor-agnostic fulfillment layer.

## Target customer
Very small businesses (fewer than 10 employees), budget-conscious, non-designers who need professional branded materials quickly with minimal setup.

## Business scope
- Select a pre-built bundle (Starter Brand Kit, Local Promo Kit, Repeat Customer Kit)
- Provide business info (name, logo, address, phone, optional website/social/tagline) — templates generate coordinated collateral from this input
- Browse and configure individual products + upload custom artwork (supported alongside bundles — both paths are live)
- Cart, checkout, order confirmation, order status
- Admin dashboard: view orders, manage fulfillment, handle exceptions (failed quotes, proof rejections)

## Fulfillment
- MVP active vendor: **Cloudprinter API** — the only registered adapter at MVP; adding a second adapter requires explicit approval
- Architecture must be vendor-agnostic from day one — see Architecture decisions › Fulfillment architecture
- Trigger fulfillment inside `checkout.session.completed` webhook — never from the checkout route
- Fulfillment logic isolated in `/lib/fulfillment` — never in checkout or cart code
- All fulfillment calls must go through `router.ts` — never import a vendor adapter directly outside the router
- Fetch vendor quote (via routing engine) before fulfillment; block and alert admin if quote fails or margin is negative
- Vendor webhook signatures validated before any DB write — use vendor-specific secret; reject unauthenticated status updates
- Validate product catalog against Cloudprinter supported types before launch
- Cloudprinter keys + webhook secret in `.env.example` under `# Cloudprinter`

## Products
Types: business cards, flyers, brochures, banners, stickers, posters, reminder cards, loyalty cards
Attributes: size, paper/material, finish, quantity, turnaround, sides, file requirements

### Bundles
Bundles are Paprintpo-defined collections of internal print specs — never vendor SKUs.

| Bundle | Contents |
|---|---|
| **Starter Brand Kit** | business cards + stickers + reminder cards |
| **Local Promo Kit** | business cards + flyers + poster + stickers |
| **Repeat Customer Kit** | business cards + loyalty cards + reminder cards + flyers |

Rules:
- Bundles reference internal `print_spec_id`s only — never Cloudprinter or vendor product IDs
- Bundle pricing lives in `lib/pricing.ts` — bundle discount logic, per-item margin calculation, and batch quote handling are all pricing concerns
- Bundles are DB-driven — never hardcode bundle contents in code

## Architecture decisions

#### Fulfillment architecture (vendor-agnostic)
- **Print-spec layer** (`/lib/fulfillment/specs.ts`): canonical internal specs owned by Paprintpo, e.g. `business_card_standard_250`, `flyer_basic_250`, `loyalty_card_250`, `poster_standard_1`. Specs define: product type, quantity, size, sides, finish, paper/stock tier, orientation, optional constraints. Specs must remain stable even if vendors change.
- **Vendor adapter layer** (`/lib/fulfillment/adapters/`): one adapter per vendor (e.g. `CloudprinterAdapter`). Each adapter handles: SKU resolution, quote requests, shipping mapping, order submission, file requirements, response normalization, status handling. Adapters must never be called directly — only through the router.
- **Routing engine** (`/lib/fulfillment/router.ts`): sits between the domain layer and adapters. At MVP always routes to Cloudprinter. Future routing decisions based on: item cost, shipping cost, total landed cost, production time, delivery ETA, geography, vendor reliability, margin. Single-vendor-per-order at MVP — no split fulfillment.
- **Normalized quote model** (`/lib/fulfillment/types.ts`): all vendor quote responses must be normalized before returning to domain logic. Normalized model captures: `vendor_id`, `item_cost`, `shipping_cost`, `total_landed_cost`, `production_time_days`, `delivery_eta`, `currency`, `raw_response`.
- Adding a new vendor adapter requires: explicit approval + `@spawn:` review + `vendor_product_mappings` migration + registered adapter identifier matching `fulfillment_provider` enum

#### Template generation
- Template logic lives in `/lib/templates/` — never in components or fulfillment code
- Templates accept a `brand_profile` input and produce a print-ready spec or design token set per product type
- Template output maps to a `print_spec_id`; template layer must not reference vendor SKUs
- Template-generated outputs must meet the same file spec requirements as customer-uploaded artwork before submission to the vendor adapter
- Post-MVP: real print-accurate rendering (bleed, DPI, CMYK); MVP uses CSS overlay mockups

#### Pricing
- `quantity_tiers` is a first-class table — never flatten to a multiplier (`lib/pricing.ts`)
- Pricing logic in `lib/pricing.ts` only — never in components or API routes
- `OptionSelector` handles display; `lib/pricing.ts` handles calculation
- Bundle pricing: per-item costs fetched individually via routing engine, bundle-level margin calculated in aggregate in `lib/pricing.ts`
- Minimum margin threshold in `lib/fulfillment/config.ts` — never inline in quote logic
- Pricing rules can move to DB or API in future without touching option components — keep `lib/pricing.ts` as the only call site

#### Order status machine (canonical — do not deviate)
`pending → paid → artwork_review → proof_sent → proof_approved → in_production → shipped → complete`
Also: `payment_failed`, `cancelled`
- `in_production` and `shipped` set by vendor webhook only — never by admin or code
- No fulfillment submission without `proof_approved` status
- Status machine is canonical — any bypass (e.g. skipping `artwork_review` for template-only orders) requires formal Business Analyst + COO + Systems Architect cluster review and an explicit CLAUDE.md update before implementation

#### Schema notes
- Tables: products, options, quantity_tiers, pricing_rules, orders, order_items, order_files, fulfillment_logs, preview_sessions, bundles, bundle_items, print_specs, vendor_product_mappings, brand_profiles
- `fulfillment_logs`: provider, external order ID, quoted cost, raw API response
- `fulfillment_provider` enum column on `orders` — values must correspond to registered adapter identifiers; adding a new enum value requires both a DB migration AND a registered adapter
- `preview_sessions`: `id`, `user_id` (nullable — supports guests), `storage_path`, `created_at` — TTL 24hr, cleaned up via cron or Supabase edge function; RLS policy scoped to cookie/session token for anonymous access
- `products`: `quick_preview_enabled boolean` column — drives which products appear in Quick Preview; never hardcode product slugs in code
- `bundles`: `id`, `slug`, `name`, `description`, `price` — DB-driven bundle definitions
- `bundle_items`: `bundle_id`, `print_spec_id`, `quantity_override` — maps bundles to internal specs
- `print_specs`: `id` (slug), `product_type`, `quantity`, `size`, `sides`, `finish`, `paper_stock`, `orientation` — Paprintpo-canonical specs, never vendor SKUs; read-only for authenticated users, inaccessible to anon
- `vendor_product_mappings`: `print_spec_id`, `vendor_id`, `vendor_sku`, `vendor_product_ref` — server-side only, no customer access
- `brand_profiles`: `id`, `user_id` (nullable — supports guests via session token), `business_name`, `logo_storage_path`, `address`, `phone`, `website`, `social_handle`, `tagline` — contains PII; RLS required; scoped to owner; logo stored in private Supabase Storage bucket with signed URL access only
- RLS required on every new table
- Schema additions for `bundles`, `bundle_items`, `print_specs`, `vendor_product_mappings`, `brand_profiles` require `@spawn:` review before migration is written

## Stack (fixed — no changes without explicit approval)
Next.js 15 App Router · Supabase Postgres · Drizzle ORM · Stripe · Tailwind + shadcn · Supabase Storage (artwork/file uploads)

## Conventions
- `/components` UI · `/lib` business logic · `/lib/fulfillment` fulfillment orchestration · `/lib/fulfillment/adapters/` vendor adapters · `/lib/fulfillment/router.ts` routing engine · `/lib/fulfillment/specs.ts` internal print specs · `/lib/fulfillment/types.ts` normalized models · `/lib/templates/` template generation logic · `/docs` documentation
- All env vars in `.env.example` · Architecture changes → `docs/decision-log.md`
- No new major dependencies without justification · No deployment/config edits unless asked
- Supabase Storage buckets must be private — access via signed URLs only, never public URLs
- Storage RLS policies required: customers may only access their own uploaded files; logo/brand assets in `brand_profiles` scoped to owner
- Adapters must never be imported directly outside of `/lib/fulfillment/router.ts` — all fulfillment calls go through the router

## Rules
- Read this file before making changes · Make small, reviewable changes
- Summarize changed files and rationale after each task
- Done = works locally + edge cases considered + docs updated + files summarized

## Current priorities
1. ~~Choose stack~~ Done
2. ~~Scaffold storefront~~ Done
3. Define Drizzle schema — see Architecture decisions › Schema notes (includes bundle/spec/brand tables; requires `@spawn:` review)
4. Supabase auth + middleware
5. Product listing and bundle configurator
5.5. **Quick Preview flow** — upload artwork → bundle preview with artwork overlay → add bundle to cart; see feature spec below
6. File upload flow + brand profile capture (logo, business info)
7. Stripe Checkout + webhook
8. Cloudprinter adapter + routing engine (MVP: always routes to Cloudprinter)
9. /admin order workflow
10. **Post-MVP:** Multi-vendor adapter routing, brand-info-driven Quick Preview (logo + business name → auto-generated templates)

---

## Feature: Quick Preview Flow

**User journey:** Upload artwork → `/quick-preview` page → bundle preview cards with artwork applied as CSS overlay across all products in the bundle → customer selects a bundle → add bundle to cart.

This is Paprintpo's primary discovery path: a customer uploads their artwork and immediately sees how it would look across coordinated branded materials — without needing to understand print specs or build a cart manually.

#### User journey detail
1. Customer lands on `/quick-preview` and uploads their artwork file
2. Three bundle cards are shown (Starter Brand Kit, Local Promo Kit, Repeat Customer Kit)
3. Each bundle card displays a collage of product mockups for that bundle's contents, with the uploaded artwork applied as a CSS overlay on each mockup
4. Customer clicks a bundle card to expand it — sees each individual product in the bundle with its mockup + artwork overlay
5. Customer clicks "Add Bundle to Cart" — all bundle items are added at once, each carrying the uploaded artwork as `artworkFile`
6. Customer proceeds to `/cart` for shipping info and checkout

#### Rules
- Route: `/quick-preview` — top-level, not nested under a product category
- Bundles shown on the page are DB-driven via the `bundles` table — never hardcoded
- MVP bundles: Starter Brand Kit, Local Promo Kit, Repeat Customer Kit
- Mockup rendering: CSS overlay (`object-fit: cover`, clipped to product shape) over static mockup images in `/public/mockups/` — one image per product type; no real print renderer at MVP
- Mockup images must be mobile-first — validated at 375px before desktop; landscape mockups are not acceptable
- Each bundle card shows a collage/grid of its product mockups with the artwork applied — reuse the same CSS overlay pattern for each product within the bundle
- The same uploaded `storage_path` is the artwork source for **every** product mockup in the bundle — the uploaded image is shown simultaneously on all product mockups (e.g. uploading `image1.jpg` overlays it on business card, sticker, and flyer mockups at the same time); do not re-upload per product or create per-product copies
- If the customer uploads a second image in the same session, it replaces the `storage_path` in `preview_sessions` and all mockups re-render with the new image; the previous staging file is orphaned and cleaned up at TTL
- Image validation warnings surface inline per product card within the expanded bundle — non-blocking; customer may proceed with a warning visible per product
- "Add Bundle to Cart" adds all bundle items at once; each item carries the session artwork reference as `artworkFile`
- Bundles are added as individual `CartItem` entries (one per bundle product) with a shared `bundleId` field on each item so the cart can group and display them correctly
- Option selectors within an expanded bundle card are independent per product — reuse `OptionSelector` component; changing business card size has no effect on flyer options
- Bundle items in the cart are displayed as a group (by `bundleId`) but can be removed individually; removing one item does not remove the rest of the bundle

#### CartItem extension for bundles
- Add `bundleId?: string` and `bundleName?: string` to `CartItem` — set when item was added via Quick Preview bundle
- Cart page groups items by `bundleId` for display; checkout and order creation are unchanged (items treated individually)

#### Session and storage
- Uploaded artwork stored in Supabase Storage (private bucket, `staging/` prefix) immediately on upload; path written to `preview_sessions`
- Guest users supported: `preview_sessions.user_id` is nullable; session identified by a server-set cookie token; RLS policy scoped to that token
- On "Add Bundle to Cart": each bundle item's `artworkFile` references the same `storage_path` — no re-upload
- At checkout: `order_files` rows created from `artworkFile` on each item (same path, multiple rows — one per order item)
- TTL: 24 hours — orphaned `preview_sessions` records and their Storage objects cleaned up by cron or Supabase edge function
- Security Engineer: RLS policy required on `preview_sessions` before any data is written; anonymous access scoped strictly to session token

#### Post-MVP (do not implement now)
- Real print-accurate preview (bleed, DPI, CMYK rendering)
- Brand-info-driven preview (logo + business name → auto-generated templates instead of raw artwork overlay)
- More than 3 bundles in the preview grid

---

## Multi-Agent System

Agents are operative instruction sets — apply their constraints when a task matches their domain. Agents activate automatically by task type or when invoked by name. For cross-domain tasks, multiple agents activate simultaneously.

**Invoke:** `"Agent Name: question"` · Multi: `"Agent A + Agent B: task"` · Cluster: `"Technical cluster: decision"`

**Two modes:**
- Default (all prompts): persona system — Claude reasons through each activated agent's lens and outputs the sign-off block. No real subagent is spawned.
- `@spawn:` prefix: spawns a real independent Agent tool instance for high-stakes review. Use for: schema migrations touching `orders`/`fulfillment_logs`/`bundles`/`print_specs`/`vendor_product_mappings`/`brand_profiles`, Stripe or vendor webhook handler changes, new RLS policies, new vendor adapter registration, routing engine changes, new external dependencies. Spawned agent receives the relevant file + task context and returns a structured review with findings and any recommended code or CLAUDE.md changes.

### Authority hierarchy (highest wins in conflict)
1. **Security Engineer** · 2. **Legal & Compliance** · 3. **Systems Architect** · 4. **Product Manager** · 5. **Pricing Analyst** · 6. **COO** (operational tiebreaker)

---

## Standing Workflow — Every Change

Fires on every task-bearing prompt (any prompt that results in a file change or a decision). Does not fire on follow-up clarifications or questions.

---

### Rule 1 — Activation header (output before writing any code)

```
Change type: [UI | backend | payment | print workflow | copy | infra | trivial | mixed]
Agents activated: [list]
Blockers: [list or "none"] — missing keys/env vars/external deps
```

**Stub convention:** if a key or external dependency is missing, add `// STUB: replace with real VALUE_NAME` and a TODO — never silently skip the integration.

---

### Rule 2 — Change-type → agent lookup table

| Change type | Always active | Domain agents |
|---|---|---|
| **UI** | Security Engineer, Systems Architect, DevOps/QA | Web Designer, Full Stack Dev |
| **Backend** | Security Engineer, Systems Architect, DevOps/QA | Full Stack Dev |
| **Payment** | Security Engineer, Systems Architect, DevOps/QA | COO, Legal & Compliance |
| **Print workflow** | Security Engineer, Systems Architect, DevOps/QA | Print Production Manager, COO, Business Analyst |
| **Copy** | — | Brand/Copy Strategist, Web Designer — escalate to Legal & Compliance if copy makes legal claims |
| **Infra** | Security Engineer, Systems Architect, DevOps/QA | — |
| **Mixed / ambiguous** | Security Engineer, Systems Architect, DevOps/QA | relevant cluster lead per area touched |
| **Trivial** ¹ | — | narrowest relevant agent — one-line sign-off only |

¹ **Trivial qualifies only if ALL of these are false:** DB schema touched · auth logic touched · pricing logic touched · API route changed · env vars changed. If any are true, use the matching change type above.

---

### Rule 3 — Sign-off block (output before marking complete)

```
Sign-off:
  Security Engineer: [approved / concern: ...]
  Systems Architect: [approved / concern: ...]
  DevOps/QA: [approved / concern: ...]
  Domain agents: [no flags — list names] OR [AgentName: concern: ...]
Skipped: [Agent Name] skipped: [one-line reason] — or "none"
Needs revisiting: [list or "none"]
```

Authority agents (#1–3) always get individual lines. Domain agents with no concerns collapse to one line listing their names. Never collapse an agent that flagged a concern.

---

### Compressed prompt shorthand

> `"Fix X. CloudPrinter keys missing — stub it. Standard agent review."`

This tells Claude to: run Rule 1 activation header → use Rule 2 to select agents → implement (stubbing blockers) → output Rule 3 sign-off before marking complete. **Never silently dismiss an agent recommendation.** If skipped: `[Agent Name] skipped: [one-line reason]`

---

### Technical

**Systems Architect** | schema, infrastructure, integrations *(authority #3 — final say on schema and integration patterns)*
Activate: schema changes, new integrations, new dependencies, architectural decisions, vendor adapter changes, routing engine changes
- Stack is fixed (see Stack section)
- Fulfillment code stays in `/lib/fulfillment` only; adapters only callable through `router.ts`
- `fulfillment_logs` must capture: provider, external order ID, quoted cost, raw API response
- New integrations → `docs/decision-log.md` entry
- New vendor adapters require: explicit approval + `@spawn:` review + migration + registered adapter identifier
→ Security Engineer (auth/payment/brand-profile schema) · Full Stack Developer (feasibility)

**Full Stack Developer** | implementation, API routes, components
Activate: building features, API routes, components, debugging
- App Router only — no Pages Router
- Mobile-first CSS · Reusable UI in `/components` · Business logic in `/lib`
- Product option logic: explicit and testable — no magic strings
- Template logic in `/lib/templates/` only — never in components
→ Systems Architect (new data models) · Web Designer (new UI surfaces)

**Security Engineer** | auth, PCI compliance, data protection *(overrides all agents — see authority hierarchy)*
Activate: auth middleware, Stripe, vendor webhooks, file uploads, user data, env vars, API keys, admin routes, brand_profiles table, logo storage
- RLS policies required for every new table
- Stripe webhook signatures validated before any DB write — return 400 on failure, never skip
- Vendor webhook signatures validated before any DB write — use vendor-specific secret; reject unauthenticated status updates
- File uploads: validate type, size, filename server-side before writing to Supabase Storage — never trust client input
- Logo uploads treated as file uploads — same validation rules apply; stored in private bucket with signed URL access only
- `brand_profiles` contains PII (address, phone) — RLS required; data minimization applies; do not store beyond what template generation requires
- No secrets in code — all in `.env.example` · No vendor keys in `NEXT_PUBLIC_` variables — server-side only
- PCI: no card data on server — Stripe hosted fields only
- Admin routes: protect via middleware role check — Supabase role must come from server-side `user_metadata`, never from client-supplied claims; RLS alone is not sufficient for page-level protection
- OWASP Top 10 for every new API route
- Rate-limit webhook endpoints and vendor quote calls — protect against replay and abuse
→ Legal & Compliance (GDPR/CCPA · brand profile PII)

**DevOps/QA** | CI/CD, testing, release gates
Activate: pipelines, tests, deployment issues, release readiness
- Critical test paths: checkout, file upload validation, Stripe webhook, vendor quote/submit, routing engine, bundle pricing
- `.env.example` must be complete before any feature is done
- Never skip pre-commit hooks or test gates
→ Systems Architect (infra) · Security Engineer (env config)

---

### Business

**Product Manager** | roadmap, scope, acceptance criteria *(authority #4 — final say on scope and priorities)*
Activate: new feature requests, scope questions, prioritization
- MVP scope = priorities 3–9 only — nothing outside without explicit approval
- Closed decisions (do not relitigate): stack, order status machine, quantity_tiers structure, vendor-agnostic fulfillment architecture
- Active MVP vendor: Cloudprinter — no second adapter without explicit approval; vendor-agnostic architecture does not mean multi-vendor is open scope
- Post-MVP features (second adapter, split fulfillment, design tools, brand-info-driven Quick Preview): flag but do not implement
→ Business Analyst (requirements) · Pricing Analyst (pricing implications)

**Pricing Analyst** | cost models, margins, quote validation *(authority: cost model decisions)*
Activate: `lib/pricing.ts` changes, quantity tiers, vendor quotes, bundle pricing, sell price setting
- Pricing logic in `lib/pricing.ts` only
- Vendor quote (via routing engine) required before fulfillment — negative margin = block + alert admin
- Quantity tiers first-class — never flatten
- Bundle pricing: per-item costs fetched individually, bundle margin calculated in aggregate in `lib/pricing.ts`
→ Systems Architect (schema) · COO (vendor costs)

**Business Analyst** | requirements, workflows, edge cases
Activate: adding/changing order status transitions, writing admin dashboard specs, defining edge case handling for fulfillment or proof flows
- Canonical order status machine: `pending → paid → artwork_review → proof_sent → proof_approved → in_production → shipped → complete` + `payment_failed`, `cancelled`
- Any status machine deviation (including bypasses for template-only orders) requires Business Analyst + COO + Systems Architect cluster review and an explicit CLAUDE.md update before implementation
- Must enumerate edge cases for: failed quotes, proof rejections, orphaned orders, payment failures
- All workflow docs in `/docs`
→ Product Manager (scope) · COO (feasibility)

---

### Creative

**Web Designer / UX** | UI/UX, layouts, component design
Activate: new pages/flows, component usability, mobile review, configurator UI, bundle selection UI
- Validate every layout at 375px before desktop
- shadcn/ui as base — don't rebuild what shadcn provides
- Tailwind only — no custom CSS unless shadcn theming requires
- Configurator labels must be self-explanatory — no tooltip-required UX
- Bundle UI must make the value proposition of each kit clear without requiring the user to understand print specs
- Semantic HTML + proper heading hierarchy for SEO
→ Brand/Copy Strategist (content) · Full Stack Developer (implementation)

**Brand / Copy Strategist** | copy, SEO content, brand voice
Activate: product descriptions, page copy, meta descriptions, ad copy
- Voice: professional, fast, reliable — approachable for non-designers and small business owners; not overly casual
- Product descriptions must include: specs, use cases, turnaround, file requirements
- Bundle descriptions must communicate what's included and who it's for — not print jargon
- Long-tail SEO keywords: "custom business cards online", "same-day flyer printing", "print bundle for small business", "business card kit", "branded print package"
- Unique meta description per product page and per bundle

---

### Operations

**Print Production Manager** | file specs, prepress, artwork review
Activate: file upload requirements, artwork review workflow, proof criteria, vendor adapter specs
- Per-product file requirements: DPI, bleed, CMYK, accepted formats
- No production submission without proof approval (`proof_approved` state required)
- Reject non-compliant files at upload time — not at fulfillment time
- Template-generated outputs must meet the same file spec requirements as customer-uploaded artwork before submission to the vendor adapter
→ Systems Architect (file storage) · Security Engineer (upload validation)

**COO / Operations** | fulfillment ops, SLAs, exception handling *(tiebreaker: cross-cluster conflicts)*
Activate: cancellation logic, Stripe payment intent voids, admin exception flows, failed vendor quote handling, cross-agent decision conflicts
- `in_production`/`shipped` set by vendor webhook only — admin cannot override
- Failed quotes must surface to admin with full context — never swallowed silently
- Cancellations must void the Stripe payment intent if not yet captured
→ Pricing Analyst (margin) · Logistics Coordinator (dormant)

**Legal & Compliance** | IP, T&Cs, GDPR/CCPA *(authority: tied with Security Engineer)*
Activate: user artwork handling, T&Cs, data collection, payment data, compliance scope, brand profile PII
- T&Cs must be explicit: platform claims no IP ownership over uploaded artwork or business logos
- Data minimization: collect only what checkout, fulfillment, and template generation require
- `brand_profiles` PII (address, phone) subject to GDPR/CCPA — must be deletable on user request
- No PII stored server-side beyond Supabase auth and brand profile requirements
- T&Cs must include user representation clause for copyright
→ Security Engineer (data storage · brand profile)

---

### Dormant (post-MVP — do not activate until roadmap reaches these phases)
- **CMO / Social Media / Email Marketer** — when campaigns begin
- **Logistics Coordinator** — when carrier integrations are added
- **Supply Chain Manager** — when sourcing beyond Cloudprinter begins
- **Image Designer** — when template library is scoped
- **UX Researcher** — when user testing sessions are scheduled
