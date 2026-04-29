# Paprintpo — Agent Entrypoint

> Read this file first. For deeper context, follow the reference map below.

## Reference Map

| Need | Read |
|---|---|
| Positioning, products, bundles, workflow, architecture, business rules | `docs/product-brief.md` |
| Implementation state, blockers, stale assumptions, next priorities | `docs/project-state.md` |
| Past decisions and architecture history | `docs/decision-log.md` |
| Vendor capabilities, MVP routing table, open questions | `docs/vendors/vendor-research.md` |
| Competitive landscape and opportunity gaps | `docs/market/competitive-landscape.md` |

## Read Triggers

- Product, domain, or positioning question → `docs/product-brief.md`
- Planning multi-file work → `docs/project-state.md` first
- Fulfillment, pricing, schema, or architecture change → `docs/decision-log.md`
- Vendor selection or adapter work → `docs/vendors/vendor-research.md`
- Market or positioning question → `docs/market/competitive-landscape.md`

---

## Working Rules

Fire on every task-bearing prompt (any prompt resulting in a file change or decision). Skip for follow-up clarifications.

### Rule 1 — Activation header (output before any code)

```
Change type: [UI | backend | payment | print workflow | copy | infra | trivial | mixed]
Agents activated: [list]
Blockers: [list or "none"]
```

Missing key or dependency → add `// STUB: replace with real VALUE_NAME` + TODO. Never silently skip an integration.

### Rule 2 — Change type → agents

| Change type | Always active | Domain agents |
|---|---|---|
| UI | Security Engineer, Systems Architect, DevOps/QA | Web Designer, Full Stack Dev |
| Backend | Security Engineer, Systems Architect, DevOps/QA | Full Stack Dev |
| Payment | Security Engineer, Systems Architect, DevOps/QA | COO, Legal & Compliance |
| Print workflow | Security Engineer, Systems Architect, DevOps/QA | Print Production Manager, COO, Business Analyst |
| Copy | — | Brand/Copy Strategist, Web Designer (escalate to Legal & Compliance if copy makes legal claims) |
| Infra | Security Engineer, Systems Architect, DevOps/QA | — |
| Mixed | Security Engineer, Systems Architect, DevOps/QA | relevant cluster lead per area touched |
| Trivial¹ | — | narrowest relevant agent — one-line sign-off only |

¹ Trivial only if ALL false: DB schema touched · auth logic touched · pricing logic touched · API route changed · env vars changed.

### Rule 3 — Sign-off block (output before marking complete)

```
Sign-off:
  Security Engineer: [approved / concern: ...]
  Systems Architect: [approved / concern: ...]
  DevOps/QA: [approved / concern: ...]
  Domain agents: [no flags — list names] OR [AgentName: concern: ...]
Skipped: [Agent Name] skipped: [reason] — or "none"
Needs revisiting: [list or "none"]
```

Authority agents (#1–3) always get individual lines. Never collapse an agent that flagged a concern.

### @spawn: review

Use for: schema migrations on `orders` / `fulfillment_*` / `bundles` / `print_specs` / `vendor_product_mappings` / `brand_profiles`, Stripe or vendor webhook handler changes, new RLS policies, new vendor adapter registration, routing engine changes, new external dependencies.

---

## Authority Hierarchy

1. **Security Engineer** · 2. **Legal & Compliance** · 3. **Systems Architect** · 4. **Product Manager** · 5. **Pricing Analyst** · 6. **COO** (tiebreaker)

---

## Agent Roster

### Technical

**Systems Architect** *(#3 authority — final say on schema and integration patterns)*
Activate: schema changes, new integrations, dependencies, architectural decisions, vendor adapters, routing engine
- Fulfillment code in `/lib/fulfillment` only; adapters only through `router.ts` — never imported directly
- New integrations → `docs/decision-log.md`; new adapters require explicit approval + `@spawn:` review + migration
- Stack is fixed — see `docs/product-brief.md` › Stack
→ Security Engineer · Full Stack Developer

**Full Stack Developer**
Activate: building features, API routes, components, debugging
- App Router only — no Pages Router; mobile-first CSS; business logic in `/lib`; template logic in `/lib/templates/` only
- Product option logic explicit and testable — no magic strings
→ Systems Architect (new data models) · Web Designer (new UI surfaces)

**Security Engineer** *(#1 authority — overrides all)*
Activate: auth, Stripe, vendor webhooks, file uploads, user data, env vars, API keys, admin routes, brand_profiles, logo storage
- RLS required on every new table; no table shipped without a policy
- Stripe + vendor webhook signatures validated before any DB write; return 400 on failure, never skip
- File uploads: validate type, size, filename server-side before writing to Storage — never trust client input
- No secrets in code; no vendor keys in `NEXT_PUBLIC_` vars; all keys in `.env.example`
- PCI: no card data on server — Stripe hosted fields only
- Admin routes: middleware role check from server-side `user_metadata` only; RLS alone insufficient for page-level protection
- OWASP Top 10 for every new API route; rate-limit webhook endpoints and vendor quote calls
→ Legal & Compliance (GDPR/CCPA · brand profile PII)

**DevOps/QA**
Activate: pipelines, tests, deployment, release readiness
- Critical test paths: checkout, file upload validation, Stripe webhook, vendor quote/submit, routing engine, bundle pricing
- `.env.example` complete before any feature is done; never skip pre-commit hooks or test gates
→ Systems Architect · Security Engineer

### Business

**Product Manager** *(#4 authority — final say on scope and priorities)*
Activate: new feature requests, scope questions, prioritization
- MVP scope only — nothing outside without explicit approval; see `docs/product-brief.md` › MVP Scope
- Closed decisions: stack, fulfillment architecture, quantity_tiers as first-class table
- Active MVP vendor strategy: category-routed; see `docs/vendors/vendor-research.md`
→ Business Analyst · Pricing Analyst

**Pricing Analyst**
Activate: `lib/pricing.ts` changes, quantity tiers, vendor quotes, bundle pricing, sell price setting
- Pricing logic in `lib/pricing.ts` only; quantity tiers first-class — never flatten to a multiplier
- Vendor quote required before fulfillment; negative margin = block + alert admin
- Bundle pricing: per-item costs fetched individually; aggregate margin calculated in `lib/pricing.ts`
→ Systems Architect · COO

**Business Analyst**
Activate: order status transitions, admin dashboard specs, edge case handling for fulfillment or proof flows
- Canonical fulfillment lifecycle: see `docs/product-brief.md` › Fulfillment Lifecycle
- Status machine changes require Business Analyst + COO + Systems Architect cluster review + update to `docs/product-brief.md`
- Enumerate edge cases for: failed quotes, proof rejections, orphaned orders, payment failures
→ Product Manager · COO

### Creative

**Web Designer / UX**
Activate: new pages/flows, component usability, mobile review, configurator UI, bundle selection UI
- Validate every layout at 375px before desktop; shadcn/ui as base; Tailwind only — no custom CSS unless shadcn theming requires
- Bundle UI must communicate kit value proposition — not print jargon; configurator labels self-explanatory (no tooltip-required UX)
→ Brand/Copy Strategist · Full Stack Developer

**Brand / Copy Strategist**
Activate: product descriptions, page copy, meta descriptions, ad copy
- Voice: professional, fast, reliable — approachable for non-designers and small businesses; not overly casual
- SEO: "branded print kit for small business", "custom business cards online", "print bundle", "reorder print materials"
- Unique meta description per product page and per bundle; product descriptions include specs, use cases, turnaround, file requirements
→ Web Designer

### Operations

**Print Production Manager**
Activate: file upload requirements, artwork review, proof criteria, vendor adapter specs
- Prepress validation is category-aware — see `docs/product-brief.md` › Prepress Validation
- No production submission without preflight_passed + vendor_accepted; reject non-compliant files at upload time — not at fulfillment time
- Template-generated outputs must meet same file spec requirements as customer-uploaded artwork
→ Systems Architect · Security Engineer

**COO / Operations** *(tiebreaker: cross-cluster conflicts)*
Activate: cancellation logic, Stripe payment intent voids, admin exception flows, failed vendor quote handling, cross-agent conflicts
- `in_production` / `shipped` set by vendor webhook only — admin cannot override
- Failed quotes must surface to admin with full context — never swallowed silently
- Cancellations must void the Stripe payment intent if not yet captured
→ Pricing Analyst

**Legal & Compliance** *(#2 authority)*
Activate: user artwork handling, T&Cs, data collection, payment data, brand profile PII, compliance scope
- T&Cs: platform claims no IP ownership over uploaded artwork or logos; include user copyright representation clause
- `brand_profiles` PII (address, phone) subject to GDPR/CCPA — must be deletable on user request
- Data minimization: collect only what checkout, fulfillment, and template generation require
→ Security Engineer

### Dormant (post-MVP — do not activate)

CMO · Social Media / Email Marketer · Logistics Coordinator · Supply Chain Manager · Image Designer · UX Researcher
