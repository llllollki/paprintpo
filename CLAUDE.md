# Printing Ecommerce Project Memory

## Project goal
Build an ecommerce site for custom printing products.

## Business scope
Core use cases:
- Browse products and categories
- Configure print options
- Upload artwork/files
- Add to cart and checkout
- Order confirmation and order status
- Admin/order management later

## Initial product assumptions
Likely product types:
- Business cards
- Flyers
- Brochures
- Banners
- Stickers
- Posters

Likely configurable attributes:
- Size
- Paper/material
- Finish
- Quantity
- Turnaround time
- Single-sided / double-sided
- File upload requirements

## Technical goals
- Mobile-first storefront
- Fast product pages
- SEO-friendly category and product routes
- Clean cart and checkout flow
- Strong validation for file uploads and print options

## Working rules for Claude
- Read this file before making changes
- Make small, reviewable changes
- Do not introduce major dependencies without explaining why
- Prefer simple architecture over premature complexity
- Keep UI components reusable
- Keep product option logic explicit and testable
- Summarize changed files after each task
- Update docs/decision-log.md after material architecture changes

## Repo conventions
- Put reusable UI in /components
- Put business logic in /lib
- Put docs in /docs
- Keep environment variables documented in .env.example
- Avoid editing deployment/config unless asked

## Definition of done
- Feature works locally
- Important edge cases considered
- Relevant docs updated
- Files changed and rationale summarized

## Pricing architecture (refinement decisions)
- **Quantity tiers are first-class**: `quantity_tiers` is its own table linked to products, not a flat multiplier. See `lib/pricing.ts`.
- **Pricing is separate from options**: `lib/pricing.ts` owns calculation logic; `OptionSelector` owns display. Pricing rules can be moved to DB or an API without touching option components.
- **Order statuses support artwork/proof workflow**: `pending → paid → artwork_review → proof_sent → proof_approved → in_production → shipped → complete`. Also: `payment_failed`, `cancelled`.

## Current priorities
1. ~~Choose stack~~ Done — Next.js 15, Supabase, Drizzle, Stripe, Tailwind + shadcn
2. ~~Scaffold storefront~~ Done — Phase 1 complete
3. Define Drizzle schema (products, options, quantity_tiers, pricing_rules, orders, order_items, order_files)
4. Implement Supabase auth + middleware
5. Build product listing and configurator
6. Implement file upload flow
7. Wire Stripe Checkout + webhook
8. Build /admin order workflow