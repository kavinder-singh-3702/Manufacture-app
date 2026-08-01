import type { Product } from "@/src/types/product";
import type { Company } from "@/src/types/company";
import { SITE_URL } from "@/src/lib/site";

// ── Detail-page schema (Product, Organization/seller) ───────────────────────

// Schema.org availability, derived from actual stock — was hard-coded to
// InStock for every product (including out-of-stock ones), a live rich-result
// bug. "low_stock" still maps to InStock since it is real, purchasable stock.
const schemaAvailability = (status: Product["stockStatus"]): string =>
  status === "out_of_stock"
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

export const buildProductJsonLd = (product: Product, canonicalUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  ...(product.description ? { description: product.description } : {}),
  image: (product.images ?? []).map((img) => img.url).filter(Boolean),
  ...(product.category ? { category: product.category } : {}),
  ...(product.sku ? { sku: product.sku } : {}),
  ...(product.company?.displayName
    ? { brand: { "@type": "Brand", name: product.company.displayName } }
    : {}),
  offers: {
    "@type": "Offer",
    price: product.price.amount,
    priceCurrency: product.price.currency || "INR",
    availability: schemaAvailability(product.stockStatus),
    url: canonicalUrl,
    ...(product.company?.displayName
      ? { seller: { "@type": "Organization", name: product.company.displayName } }
      : {}),
  },
});

export const buildCompanyJsonLd = (company: Company, canonicalUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.displayName,
  ...(company.legalName ? { legalName: company.legalName } : {}),
  ...(company.description ? { description: company.description } : {}),
  ...(company.logoUrl ? { logo: company.logoUrl } : {}),
  url: canonicalUrl,
});

// ── Site-level schema (emitted once, in the root layout) ────────────────────

/**
 * Emitted once in the root layout. `sameAs` (links to verified social
 * profiles) is deliberately omitted — SiteFooter used to link LinkedIn/X
 * icons to those platforms' generic homepages, not an ARVANN profile, and a
 * `sameAs` entry pointing at a non-ARVANN URL is worse than none. Add it back
 * once real handles exist.
 */
export const buildOrganizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ARVANN",
  url: SITE_URL,
  logo: `${SITE_URL}/arvann-logo.png`,
});

/**
 * Emitted once in the root layout. The `SearchAction` is what makes Google
 * eligible to show a sitelinks search box under the ARVANN result — it must
 * point at a URL pattern the site genuinely honors: `/products?q=` already
 * drives `PublicMarketplace` via `useUrlSearchQuery`.
 */
export const buildWebSiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ARVANN",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/products?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

// ── Reusable per-page schema ─────────────────────────────────────────────────

export type BreadcrumbItem = { name: string; path: string };

/** `path` is site-relative (e.g. "/industries/textile-apparel-manufacturing"). */
export const buildBreadcrumbJsonLd = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

export type FaqItem = { question: string; answer: string };

/**
 * Only ever pass genuinely useful, human-written Q&A here — never
 * auto-generated filler. A thin/templated FAQPage is the same doorway-page
 * risk the industry/subcategory pages are already gated against.
 */
export const buildFaqJsonLd = (items: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
});

/** For category/industry/subcategory listing pages — pass the products actually rendered on that page. */
export const buildItemListJsonLd = (products: Pick<Product, "_id" | "name">[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: products.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE_URL}/products/${p._id}`,
    name: p.name,
  })),
});
