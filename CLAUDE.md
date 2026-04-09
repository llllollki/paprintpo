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

## Current priorities
1. Choose stack
2. Scaffold storefront
3. Create product model for printable goods
4. Define upload and customization flow
5. Prepare checkout architecture