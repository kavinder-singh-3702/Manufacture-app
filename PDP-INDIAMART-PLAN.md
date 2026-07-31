# Product Detail Page — IndiaMART-parity rebuild

**Target route:** `/products/[id]` (public marketplace PDP)
**Reference:** IndiaMART proddetail page (`batman-themed-led-pen-stand-2855445877233`)
**Goal:** Match IndiaMART's information architecture, module set and buyer UX — rendered entirely in ARVANN's teal/coral token theme, fully responsive, and built from one shared component set reused by the dashboard PDP.

---

## 1. Reference teardown — every module, in order

IndiaMART's desktop PDP is a **2-column shell** (`content | sticky seller rail`), where the content column's top block is itself **2 columns** (`gallery | buy box`).

```
┌────────────────────────────────────────────────────────────────┐
│ A  Breadcrumb  ·  Share / Save                                  │
├──────────────────────┬──────────────────┬──────────────────────┤
│ B  Gallery           │ C  Buy box       │ D  Seller rail       │
│    · main image      │  · H1 title      │   (sticky)           │
│    · hover zoom lens │  · rating+count  │  · logo + name       │
│    · thumb rail      │  · ₹ price /unit │  · TrustSEAL badge   │
│    · counter "1/7"   │  · Get Latest    │  · GST · verified    │
│    · lightbox        │    Price link    │  · rating + reviews  │
│                      │  · tax note      │  · city, state       │
│                      │  · MOQ line      │  · member since      │
│                      │  · spec table    │  · response rate     │
│                      │    (View more)   │  · View Mobile No.   │
│                      │  · qty + unit    │  · Contact Supplier  │
│                      │  · "Yes! I am    │                      │
│                      │     Interested"  │                      │
│                      │  · Request       │                      │
│                      │    Callback      │                      │
├──────────────────────┴──────────────────┴──────────────────────┤
│ E  Anchor tabs: Product Details · Company Details · Reviews     │
├────────────────────────────────────────────────────────────────┤
│ F  Product Details — rich description                           │
│    + "Additional Information" table (item code, production      │
│      capacity, delivery time, packaging details)                │
├────────────────────────────────────────────────────────────────┤
│ G  Interest band — "Interested in this product? Get Best Quote" │
├────────────────────────────────────────────────────────────────┤
│ H  Explore More Products — horizontal carousel (same seller)    │
├────────────────────────────────────────────────────────────────┤
│ I  Company Details table — nature of business, legal status,    │
│    year established, annual turnover, GST, employee count       │
│    + About Us paragraph                                         │
├────────────────────────────────────────────────────────────────┤
│ J  Ratings & Reviews — overall score, star histogram,           │
│    per-review cards with sub-ratings                            │
├────────────────────────────────────────────────────────────────┤
│ K  Related searches / category chips                            │
└────────────────────────────────────────────────────────────────┘
   + floating right-edge "Send Inquiry" tab (desktop)
   + sticky bottom action bar (mobile)
```

**Behaviours that define the UX (not just the layout):**

| # | Behaviour | Why it matters |
|---|---|---|
| 1 | Price is a **lead hook**, not a checkout trigger — "Get Latest Price" | Whole page funnels to an inquiry, never a cart |
| 2 | Phone number is **masked until clicked** ("View Mobile Number") | Reveal is the conversion event |
| 3 | Spec table is **truncated with "View more"** | Density without a wall of text |
| 4 | Seller rail is **sticky through the whole page** | CTA never leaves the viewport |
| 5 | Anchor tabs **scroll-spy** the long-form sections | Long page stays navigable |
| 6 | Mobile collapses to a **sticky bottom bar** (price + CTA) | Same conversion guarantee on small screens |
| 7 | Trust signals are **repeated** (rail, tabs, company table) | Trust is the product on a B2B marketplace |

---

## 2. Gap analysis — what our data model already supports

| Module | Status | Source |
|---|---|---|
| Breadcrumb, share | ✅ have | [PublicProductDetail.tsx:203-238](web-frontend/src/features/marketing/components/PublicProductDetail.tsx#L203-L238) |
| Gallery (main + thumbs) | 🟡 basic — no zoom, no lightbox, no swipe, no counter | [PublicProductDetail.tsx:244-280](web-frontend/src/features/marketing/components/PublicProductDetail.tsx#L244-L280) |
| Title, category, price, unit | ✅ have | `Product.price {amount, currency, unit}` |
| Variants selector | ✅ have (IndiaMART has no equivalent — keep it, it's better) | [VariantSelector.tsx](web-frontend/src/features/product/components/VariantSelector.tsx) |
| Stock status | ✅ have — buyer-safe, hides exact qty | [categories.ts:77-116](web-frontend/src/features/product/utils/categories.ts#L77-L116) |
| "Yes! I am Interested" | ✅ maps to existing inquiry | [ProductInquiryForm.tsx](web-frontend/src/features/product/components/ProductInquiryForm.tsx) |
| "Get Latest Price" | ✅ maps to existing RFQ | [QuoteRequestForm.tsx](web-frontend/src/features/product/components/QuoteRequestForm.tsx) |
| Chat / Call CTAs | ✅ have | `chatService.startConversation` |
| Spec table | 🟡 rendered as 6 loose cards, not a table; `attributes` Map unused in UI | [PublicProductDetail.tsx:295-311](web-frontend/src/features/marketing/components/PublicProductDetail.tsx#L295-L311) |
| Additional info (item code, delivery time, packaging, production capacity) | ❌ missing — belongs in `attributes` | [product.model.js:78-82](backend/src/models/product.model.js#L78-L82) |
| MOQ (minimum order quantity) | ❌ missing entirely | — |
| Seller card — name, link | 🟡 minimal (monogram + name only) | [PublicProductDetail.tsx:330-341](web-frontend/src/features/marketing/components/PublicProductDetail.tsx#L330-L341) |
| Seller — city/state, GST, year established, business type, turnover, employees | ❌ **blocked**: company populate only selects 5 fields | [product.service.js:240](backend/src/modules/product/services/product.service.js#L240), `:351`, `:383` |
| Masked "View Mobile Number" | ❌ missing — phone is exposed directly via `tel:` | [PublicProductDetail.tsx:124-129](web-frontend/src/features/marketing/components/PublicProductDetail.tsx#L124-L129) |
| Trust badges (verified / GST / member since) | 🟡 `complianceStatus` populated but never rendered | — |
| Anchor tabs + scroll-spy | ❌ missing | — |
| Related products carousel | ✅ have (no arrows/snap) | [RelatedProducts.tsx](web-frontend/src/features/product/components/RelatedProducts.tsx) |
| Ratings & reviews | ❌ **no model exists** — `feedback.model.js` is app feedback, not product reviews. `ratingDesc` sorts on an ad-hoc `attributes.rating` | [product.service.js:68](backend/src/modules/product/services/product.service.js#L68) |
| Mobile sticky action bar | ❌ missing | — |

> **Integrity rule for this build:** ratings, review counts, "response rate", and "member since" render **only when real data exists**. No placeholder stars, no seeded review counts, no fake trust scores. Modules with no data are omitted, not faked.

---

## 3. Architecture — the DRY core

The current PDP code is duplicated twice over: [PublicProductDetail.tsx](web-frontend/src/features/marketing/components/PublicProductDetail.tsx) (537 lines) and [ProductDetailContainer.tsx](web-frontend/src/features/product/components/ProductDetailContainer.tsx) (595 lines) each hand-roll their own gallery, price block, spec grid, stock badge and CTA stack. Adding 10 more modules to both is not viable.

**New shared package:** `web-frontend/src/features/product/components/pdp/`

Every primitive is presentational, token-only (`var(--…)`), no data fetching, no auth logic.

```
src/features/product/
├─ components/
│  ├─ pdp/
│  │  ├─ index.ts                 barrel
│  │  ├─ PdpSection.tsx           titled section card + anchor id      → F, I, J, H
│  │  ├─ SpecTable.tsx            zebra key/value table, collapsible   → C, F, I  ★
│  │  ├─ ProductGallery.tsx       zoom · thumbs · swipe · lightbox     → B
│  │  ├─ PriceBlock.tsx           ₹ + unit + "get latest" + tax + MOQ  → C, mobile bar
│  │  ├─ QuantityUnitInput.tsx    stepper + unit select                → C, inquiry, quote
│  │  ├─ TrustBadgeRow.tsx        verified / GST / member-since pills  → D, I
│  │  ├─ RatingStars.tsx          value + count, half-star             → C, D, J, cards
│  │  ├─ SellerCard.tsx           variant: "rail" | "band"             → D
│  │  ├─ RevealPhoneButton.tsx    masked → reveal, auth-gated          → D
│  │  ├─ SectionNav.tsx           sticky anchor tabs + scroll-spy      → E
│  │  ├─ InterestBand.tsx         full-width "Get best quote" CTA      → G
│  │  ├─ LeadCaptureCard.tsx      inline requirement form wrapper      → C, G
│  │  ├─ ProductCarousel.tsx      snap scroller + arrow buttons        → H
│  │  ├─ ReviewsSection.tsx       summary + histogram + review list    → J
│  │  └─ StickyActionBar.tsx      mobile bottom bar (portal)           → mobile
│  └─ …existing
└─ utils/
   ├─ specs.ts    buildSpecRows / buildAdditionalInfoRows / buildCompanyRows / SPEC_LABELS
   └─ seller.ts   buildTrustBadges / maskPhone / memberSince / formatTurnover
```

★ `SpecTable` is the single biggest DRY win — one component serves the buy-box spec table, the Additional Information table, and the Company Details table.

**After the refactor:**

- `PublicProductDetail.tsx` → thin orchestrator, ~200 lines (from 537): data loading, auth gating, layout grid, composition.
- `ProductDetailContainer.tsx` (dashboard) → drops its private gallery / price / spec-grid code and imports the same primitives. Net deletion, not addition.
- `RelatedProducts.tsx` → its internal `Section` becomes `ProductCarousel`, reused by "More from this seller", "Similar products" and "Explore more".
- `ProductInquiryForm` / `QuoteRequestForm` → adopt `QuantityUnitInput` instead of bespoke number inputs.

**Spec derivation, single source of truth** — `utils/specs.ts`:

```ts
// Turns the free-form attributes Map + known typed fields into ordered,
// human-labelled rows. Nothing else in the app decides "what is a spec".
buildSpecRows(product)           → [{ label: "Material", value: "MDF" }, …]
buildAdditionalInfoRows(product) → item code · production capacity · delivery time · packaging
buildCompanyRows(company)        → nature of business · legal status · year established · GST · employees
```

Unknown `attributes` keys are humanised (`camelCase`/`snake_case` → `Title Case`) so sellers can add arbitrary specs without a frontend change.

---

## 4. Layout & responsive spec

Container widens from `max-w-[1200px]` to `max-w-[1280px]` to fit three columns comfortably.

| Breakpoint | Shell | Gallery ↔ buy box | Seller | Sticky bar |
|---|---|---|---|---|
| `< 640` (mobile) | 1 col | stacked | full-width band, after CTAs | **on** — price + "Get best price" |
| `640–1023` (sm/md) | 1 col | `grid-cols-[minmax(0,300px)_minmax(0,1fr)]` | full-width band below buy box | **on** |
| `1024–1279` (lg) | `grid-cols-[minmax(0,1fr)_300px]` | `grid-cols-[minmax(0,340px)_minmax(0,1fr)]` | sticky rail, `top-20` | off |
| `≥ 1280` (xl) | `grid-cols-[minmax(0,1fr)_340px]` | `grid-cols-[440px_minmax(0,1fr)]` | sticky rail | off |

**Per-module responsive rules**

- **Gallery** — `<768`: swipe carousel, snap scroll, dot indicators, `1/7` counter chip; no hover zoom (pointer: coarse). `≥768`: thumb rail below main image. `≥1280`: vertical thumb rail left of the main image + hover-zoom lens; click → lightbox with arrow-key nav.
- **SpecTable** — 1 column `<768`, 2 columns `≥768`. Collapsed to 6 rows with "View more specifications ▾".
- **SectionNav** — sticky under the TopBar (`top-16`); `<640` becomes a horizontally scrollable chip row with edge fade masks.
- **Carousels** — arrow buttons `≥1024` only; touch/snap scroll everywhere; `scroll-snap-type: x mandatory`.
- **Tables and carousels never widen the page** — each sits in its own `overflow-x-auto`; the body must never scroll horizontally.
- Safe areas: sticky bar uses `padding-bottom: env(safe-area-inset-bottom)`.

**Accessibility**
- Gallery thumbs: `role="tablist"` / `role="tab"`, `aria-selected`, ←/→ keys.
- `SectionNav` links are real `<a href="#id">` anchors (works without JS); scroll-spy is progressive enhancement via `IntersectionObserver`.
- Phone reveal announces via `aria-live="polite"`.
- Every hover-zoom / carousel / motion effect gated on `prefers-reduced-motion`.
- Spec tables use real `<table>` with `<th scope="row">`, not divs.

---

## 5. Theme mapping — IndiaMART look, ARVANN palette

We keep their *layout, density and hierarchy* and drop their palette entirely. Nothing is hard-coded; everything resolves through [globals.css](web-frontend/app/globals.css) tokens so dark mode works for free.

| IndiaMART | ARVANN token | Used for |
|---|---|---|
| Yellow CTA `#f5b120` | `var(--primary)` + `var(--shadow-primary)` | "Get best price" — the one hero CTA |
| Blue secondary | `var(--accent)` coral | "Request callback" — second-highest intent |
| Blue links | `var(--primary)` | breadcrumb, seller link, "View more" |
| Green "Contact Supplier" | `#16A34A` → `var(--success)` | Chat CTA (already the convention in the codebase) |
| Grey zebra table rows | `var(--card)` / `var(--background)` alternating | all three spec tables |
| Section dividers | `var(--border)` | between modules |
| TrustSEAL badge | `var(--success)` at 13% tint + 30% border, via `color-mix` | verified / GST badges |
| Card chrome | `1px solid var(--border)` + `var(--shadow-sm)` + `rounded-2xl` | matches existing PDP cards |

Rationale for the CTA choice: teal is the action colour on every other surface in this app (dashboard, auth, marketplace). Making the PDP's money button coral would break that muscle memory to chase IndiaMART's yellow. Coral stays as the deliberate second accent ("Request callback"), which preserves the two-tier CTA contrast IndiaMART gets from yellow-vs-blue.

Density shift: IndiaMART is *tighter* than our current PDP. Buy-box vertical rhythm moves from `space-y-5` → `space-y-4`, spec rows are `py-2.5`, and the H1 drops from `text-2xl` to `text-xl md:text-[22px]` — information-dense, not airy.

---

## 6. Backend work

**Phase 0 — required to render the seller card at all (small, low-risk)**

`backend/src/modules/product/services/product.service.js` lines [240](backend/src/modules/product/services/product.service.js#L240), 351, 383 — widen the company populate:

```js
.populate({
  path: 'company',
  select: 'displayName complianceStatus contact.phone contact.website owner metadata '
        + 'logoUrl type sizeBucket foundedAt createdAt description '
        + 'headquarters.city headquarters.state documents.gstNumber'
})
```

Then extend `CompanySummary`-on-product in [src/types/product.ts:65-70](web-frontend/src/types/product.ts#L65-L70) to match. Guard: `contact.email` stays unselected — do not widen guest-visible PII beyond the phone that is already exposed.

**Phase 0b — MOQ + trade info, zero migration**

Use the existing free-form `attributes` Map ([product.model.js:78-82](backend/src/models/product.model.js#L78-L82)) for `moq`, `itemCode`, `deliveryTime`, `packagingDetails`, `productionCapacity`, plus arbitrary seller specs. `utils/specs.ts` owns the label map and ordering. No schema change, no migration, and `ProductFormDrawer` gets a simple key/value spec editor.

Promote to typed schema fields later only if we need to validate or query on them.

**Phase 4 — reviews (deferred)**

New `productReview.model.js` (`product`, `company`, `author`, `rating`, `subRatings {quality, delivery, response}`, `body`, `verifiedPurchase`, `createdAt`) + `GET /products/:id/reviews` + an `aggregateRating` on the product read. Until it lands, `ReviewsSection` receives no data and renders nothing.

**Phase 5 — JSON-LD correctness**

[publicData.ts:57](web-frontend/src/features/marketing/server/publicData.ts#L57) hard-codes `availability: "https://schema.org/InStock"` for every product, including out-of-stock ones — that's a live SEO/rich-result bug worth fixing here. Derive from `stockStatus`, and add `aggregateRating`, `sku`, `mpn` and seller `Organization` once the data exists.

---

## 7. Delivery phases

| Phase | Scope | Ships |
|---|---|---|
| **0** | Backend company populate + product type widening + `utils/specs.ts` + `utils/seller.ts` | Data available; nothing visible yet |
| **1** | `pdp/` primitives: `PdpSection`, `SpecTable`, `PriceBlock`, `RatingStars`, `TrustBadgeRow`, `QuantityUnitInput`, `ProductGallery` | Unit-testable, storybook-able in isolation |
| **2** | Rebuild `PublicProductDetail` as orchestrator: new grid, `SellerCard`, `RevealPhoneButton`, `SectionNav`, `InterestBand`, `StickyActionBar`, `ProductCarousel` | **The IndiaMART-parity page, responsive** |
| **3** | Refactor `ProductDetailContainer` (dashboard) onto the same primitives; `RelatedProducts` → `ProductCarousel`; inquiry/quote forms → `QuantityUnitInput` | DRY payoff — net line deletion |
| **4** | Product reviews: model, routes, `ReviewsSection`, aggregate rating in seller card | Module J |
| **5** | Polish: lightbox, related-search chips, JSON-LD fixes, `next/image` migration, Lighthouse pass | — |

Phases 0–2 are the deliverable the request describes; 3 is what keeps it maintainable; 4–5 are follow-ons.

---

## 8. Acceptance criteria

- [ ] Every module A–K from §1 is present, or deliberately omitted with a one-line reason (reviews until Phase 4).
- [ ] Zero hard-coded hex values in `pdp/` outside the existing `#16A34A` success convention — everything reads from theme tokens.
- [ ] Page renders correctly in **both light and dark** at 375 / 768 / 1024 / 1440 px.
- [ ] Body never scrolls horizontally at any width; tables and carousels scroll inside their own containers.
- [ ] `PublicProductDetail.tsx` and `ProductDetailContainer.tsx` share the gallery, price block and spec table — no duplicated implementations remain.
- [ ] No fabricated ratings, review counts, or trust metrics anywhere.
- [ ] Guest gating unchanged: inquiry stays open to guests; chat, call, phone-reveal and RFQ stay auth-gated ([current behaviour](web-frontend/src/features/marketing/components/PublicProductDetail.tsx#L98-L129)).
- [ ] SSR/ISR preserved — the page still paints server-rendered and stays crawlable ([app/products/[id]/page.tsx:12](web-frontend/app/products/[id]/page.tsx#L12)).
- [ ] Keyboard-navigable gallery and section nav; `prefers-reduced-motion` respected.

---

## 9. Open decisions

1. **CTA colour** — plan assumes teal hero / coral secondary (§5). Flip if you want the louder IndiaMART-style contrast break.
2. **Phone reveal gating** — currently `tel:` is auth-gated. Options: (a) keep auth-gated, (b) reveal to guests but log the lead. IndiaMART does (b) with a phone-number capture. Plan assumes (a) — no behaviour change.
3. **`app-frontend` (React Native)** — out of scope here; the reference is a web page. Worth a follow-on once the module set is settled.
4. **Spec authoring UX** — Phase 0b assumes a key/value editor in `ProductFormDrawer`. If sellers should instead pick from category-specific spec templates, that's a larger design task.
