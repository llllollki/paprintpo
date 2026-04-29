---
status: active
owner: product/engineering
last_reviewed: 2026-04-28
source_of_truth: true
review_trigger: update when vendor APIs change, new vendors are evaluated, or MVP routing decisions change
---

# Vendor Research — Paprintpo MVP

## MVP Routing Decision (Category-Routed)

| Category | Preferred vendor | Status | Fallback |
|---|---|---|---|
| `business_cards` | **Unconfirmed** (Prodigi "coming soon"; Cloudprinter or Gooten as interim candidates) | Needs confirmation | Gelato |
| `stickers_labels` | Printify or Printful (evaluate both) | Needs confirmation | Prodigi, Gooten |
| `packaging` | Packhelp | Sales-gated / quote-assisted until API + USA confirmed | Manual |

Do not build automated multi-vendor optimization or split routing — post-MVP only.

---

## Vendor Validation Matrix

### API-Ready Candidates

---

#### Prodigi

| Dimension | Status |
|---|---|
| **Product fit** | Business cards (confirmed SKU exists), stickers/decals (catalog — verify SKUs) |
| **API order placement** | Yes — REST API, single request per order |
| **USA fulfillment** | Yes — routes to most cost-effective US lab per order |
| **White-label / direct ship** | Yes — dropshipping model; merchant reference fields |
| **Real-time quote / pricing** | Yes — dedicated quotes endpoint; returns fulfillment location, product cost, shipping cost |
| **Webhooks / status** | Yes — CloudEvents-spec callbacks at key order milestones |
| **Artwork submission** | Via publicly accessible URL in order payload (PNG, JPEG, PDF); 300 DPI optimal |
| **Proof / prepress support** | Not documented; likely automated |
| **MOQ** | Low — quantities from 10 (business cards: 10, 20, 50, 100, 150, 200, 250, 500) |
| **Low-quantity margin risk** | Medium — low MOQ but unit cost at small quantities may compress margin |
| **MVP recommendation** | **Blocked — business cards listed as "Coming soon" on prodigi.com as of 2026-04-28.** Confirm availability timeline before building adapter. Strong candidate once available. |
| **Sources** | https://www.prodigi.com/print-api/docs/reference/ · https://www.prodigi.com/products/business-and-commercial/business-stationery/business-cards/ |
| **Open questions** | When do business cards go live? What are sticker/decal SKUs? Is artwork URL required to be publicly accessible indefinitely? (Docs note originals deleted after 30 days — signed URL must remain valid at submission time.) |

---

#### Cloudprinter

| Dimension | Status |
|---|---|
| **Product fit** | Business cards, stickers — verify US-available SKUs via product info endpoint |
| **API order placement** | Yes — REST POST; quote-first workflow supported |
| **USA fulfillment** | US / local print network — confirm specific product availability in US nodes |
| **White-label / direct ship** | Not explicitly documented; confirm with Cloudprinter account team |
| **Real-time quote / pricing** | Yes — quote endpoint returns total product sum (excl. shipping/VAT); quote expires 48 hours |
| **Webhooks / status** | Yes — CloudSignal Webhooks v2 (separate docs page); event-driven status updates |
| **Artwork submission** | Via HTTPS URL with MD5 validation |
| **Proof / prepress support** | Not documented |
| **MOQ** | Low — individual order support |
| **Low-quantity margin risk** | Medium — enterprise / onboarding-heavy; may not be optimized for low-volume DTC |
| **MVP recommendation** | **Interim candidate for business cards** pending Prodigi launch. More enterprise-oriented; confirm onboarding timeline and DTC shipment model. |
| **Sources** | https://docs.cloudprinter.com/client/cloudprinter-core-api-v1-0 · https://docs.cloudprinter.com/client/cloudsignal-webhooks-v2-0 |
| **Open questions** | Which product types are available in US fulfillment nodes? Is white-label / direct-to-customer ship supported? What is the onboarding timeline for a new account? |

---

#### Gelato

| Dimension | Status |
|---|---|
| **Product fit** | Cards / stationery confirmed; custom boxes not in scope — packaging = branded inserts/labels only |
| **API order placement** | Yes — REST API with quote + order endpoints |
| **USA fulfillment** | Yes — global network includes US |
| **White-label / direct ship** | Yes — white-label, direct-to-customer |
| **Real-time quote / pricing** | Yes — dedicated quote API (v4); returns itemized pricing and shipping options |
| **Webhooks / status** | Yes — webhook events for order lifecycle |
| **Artwork submission** | Via URL in order payload |
| **Proof / prepress support** | Automated preflight — confirm human proof option |
| **MOQ** | Low |
| **Low-quantity margin risk** | Medium |
| **MVP recommendation** | **Fallback for business cards** if Prodigi and Cloudprinter are unavailable. Strong API but packaging capability limited to inserts/labels — not full custom boxes. |
| **Sources** | https://dashboard.gelato.com/docs/orders/v4/quote/ · https://dashboard.gelato.com/docs/webhooks/ |
| **Open questions** | What is the full US business card SKU catalog? What are sticker/label SKU options? Margin at 250-unit quantities? |

---

#### Printful

| Dimension | Status |
|---|---|
| **Product fit** | Stickers, business cards (verify catalog); packaging inserts supported; custom boxes limited |
| **API order placement** | Yes — REST API; cost estimate endpoint available before order |
| **USA fulfillment** | Yes — US warehouse / fulfillment |
| **White-label / direct ship** | Capable — sync products / variants with retail pricing; white-label confirmed in broader docs |
| **Real-time quote / pricing** | Yes — "Estimate order costs" endpoint |
| **Webhooks / status** | Yes — full webhook suite: order lifecycle, shipment, returns, stock |
| **Artwork submission** | Via File Library API; multiple formats supported |
| **Proof / prepress support** | Automated preflight; mockup generator available |
| **MOQ** | None (POD) |
| **Low-quantity margin risk** | Low — POD model means no MOQ exposure; margin depends on catalog pricing |
| **MVP recommendation** | **Primary candidate for stickers / labels.** Confirm sticker and label SKU availability. Note: jewelry not supported via API; some product categories restricted. |
| **Sources** | https://developers.printful.com/docs/ |
| **Open questions** | Confirm sticker die-cut / kiss-cut SKU availability. Confirm label / roll label availability. Confirm business card SKUs. What is the private-token vs. OAuth model for this use case? |

---

#### Printify

| Dimension | Status |
|---|---|
| **Product fit** | Stickers / labels via provider network (provider-dependent quality and availability) |
| **API order placement** | Yes — REST API; provider and variant selection in order |
| **USA fulfillment** | Provider-dependent — not all providers are US-based; must select US providers |
| **White-label / direct ship** | OAuth 2.0 multi-merchant platform; white-label not explicitly confirmed |
| **Real-time quote / pricing** | Shipping cost API: flat cost per blueprint / provider by country; first vs. additional item rates |
| **Webhooks / status** | Yes — instant webhook notifications on order events, tracking updates |
| **Artwork submission** | Uploads resource — image file upload; JSON responses |
| **Proof / prepress support** | Provider-dependent |
| **MOQ** | None (POD) |
| **Low-quantity margin risk** | Low to medium — depends on provider; quality risk at low volumes with some providers |
| **MVP recommendation** | **Co-primary candidate for stickers / labels alongside Printful.** Provider-dependent model introduces quality variability — vet specific providers for sticker/label categories before committing. Sticker/label SKUs not explicitly confirmed in API docs; verify catalog. |
| **Sources** | https://developers.printify.com/ |
| **Open questions** | Which specific providers offer die-cut stickers, kiss-cut stickers, roll labels? Which are US-based? What is the quality tier at 50–500 unit quantities? Does white-label drop-ship suppress Printify branding on packing slips? |

---

#### Gooten

| Dimension | Status |
|---|---|
| **Product fit** | Business cards, stickers, flat/folded cards reported in API docs |
| **API order placement** | Yes — API-based order placement confirmed |
| **USA fulfillment** | Yes — US production network |
| **White-label / direct ship** | Yes — white-label confirmed |
| **Real-time quote / pricing** | Price estimates and shipping estimates via API |
| **Webhooks / status** | Yes — webhook support |
| **Artwork submission** | Via API |
| **Proof / prepress support** | Not confirmed |
| **MOQ** | Low |
| **Low-quantity margin risk** | Medium — confirm unit costs at small quantities |
| **MVP recommendation** | **Fallback candidate for business cards** (if Prodigi / Cloudprinter not confirmed). Evaluate SKU coverage and margin before committing. |
| **Sources** | https://www.gooten.com/print-on-demand/gooten-api/ |
| **Open questions** | Full business card SKU list? Sticker/label SKU availability? Margin at 100–500 unit quantities? Proof flow details? |

---

### Sales-Gated / Needs Confirmation

---

#### Packhelp

| Dimension | Status |
|---|---|
| **Product fit** | Custom packaging — strongest packaging candidate for custom boxes, mailers, tissue, tape |
| **API order placement** | API language present on website; order placement automation unconfirmed — likely sales-led |
| **USA fulfillment** | EU-based producers confirmed; USA production / fulfillment **unconfirmed** |
| **White-label / direct ship** | White-label store option exists ("Packhelp White Label"); direct-to-customer shipment unconfirmed |
| **Real-time quote / pricing** | No pricing API referenced; pricing likely via sales process |
| **Webhooks / status** | Not documented publicly |
| **Artwork submission** | Not documented publicly |
| **Proof / prepress support** | Expert checks mentioned; likely human proof cycle |
| **MOQ** | Low MOQs marketed, but confirm per product type |
| **Low-quantity margin risk** | High — custom packaging at low MOQ typically has high unit cost |
| **MVP recommendation** | **Sales-gated / manual.** Treat as quote-assisted until API access, USA production, customer-level direct shipment, proof flow, and order-status details are confirmed. Do not build an automated adapter until all 5 are confirmed. |
| **Sources** | https://packhelp.com/web-services/ |
| **Open questions** | Is there a self-serve API for order placement? Does Packhelp fulfill to US addresses from US-based production? Can orders ship direct to end customers (not to Paprintpo)? What is the proof / approval cycle time? |

---

### Manual / Partnership Only

---

#### Lob

| Dimension | Status |
|---|---|
| **Product fit** | Direct mail (postcards, letters, checks) — not a print kit vendor |
| **API order placement** | Yes — strong API |
| **USA fulfillment** | Yes |
| **MVP recommendation** | **Out of scope.** Only relevant if direct mail becomes a product line. Do not include in MVP adapter work. |
| **Sources** | https://docs.lob.com/ |

---

### Competitor / Reference Only

---

#### Sticker Mule

| Dimension | Status |
|---|---|
| **Product fit** | Excellent sticker quality and product range; no API for order placement |
| **API order placement** | **No** — FAQ confirmed: "No, we don't provide an API for placing orders." Feature requested but not shipped. |
| **MVP recommendation** | **Competitor / reference only.** Not usable as an API vendor. Use as quality and pricing benchmark for sticker products. |
| **Sources** | https://www.stickermule.com/support/faq/ordering/do-you-offer-an-api-for-placing-orders |

---

#### MOO

| Dimension | Status |
|---|---|
| **Product fit** | Premium business cards, postcards, stickers — strong brand positioning |
| **API order placement** | MOO API exists but primarily for enterprise/B2B integrations; confirm availability for DTC fulfillment |
| **MVP recommendation** | **Competitor / reference only** unless API + DTC fulfillment confirmed. Use as quality benchmark for premium business cards. |

---

#### Packlane

| Dimension | Status |
|---|---|
| **Product fit** | Custom packaging (boxes, mailers) |
| **API order placement** | Not confirmed |
| **MVP recommendation** | **Competitor / reference only.** Packaging benchmark; evaluate if Packhelp proves unavailable. |

---

#### Arka

| Dimension | Status |
|---|---|
| **Product fit** | Sustainable custom packaging |
| **API order placement** | Not confirmed |
| **MVP recommendation** | **Competitor / reference only.** Evaluate if sustainability positioning becomes relevant and vendor specs support claims. |

---

#### PakFactory

| Dimension | Status |
|---|---|
| **Product fit** | Custom packaging — wide range |
| **API order placement** | Not confirmed |
| **MVP recommendation** | **Competitor / reference only.** Manual / partnership candidate if Packhelp is unavailable. |

---

#### Uline

| Dimension | Status |
|---|---|
| **Product fit** | Commodity packaging, shipping supplies — not print-on-demand |
| **API order placement** | No programmatic DTC fulfillment |
| **MVP recommendation** | **Reference only.** Competitor in commodity packaging space; not an API vendor candidate. |

---

## Vendor Architecture Notes

### Adding a New Vendor Adapter

Requires all of the following before any code is written:
1. Explicit approval from Product Manager
2. `@spawn:` review
3. `vendor_product_mappings` migration for new vendor's SKUs
4. Registered adapter identifier added to `fulfillment_provider` enum (or JSONB equivalent)

Never import a vendor adapter directly outside of `lib/fulfillment/router.ts`.

### Adapter Boundary Principles

- Normalize quotes to the `NormalizedQuote` model — do not pass raw vendor responses to domain code
- Store raw vendor payloads in `fulfillment_events` for audit
- Webhook handlers: validate signature before any DB write; acknowledge immediately, process async; idempotent by design
- Quote prices are volatile — always re-quote close to checkout; quoteExpiresAt must be checked before submission
