import { cache } from "react";
import { ApiError } from "@/src/lib/api-error";
import { productService } from "@/src/services/product";
import { companyService } from "@/src/services/company";
import type { Product } from "@/src/types/product";
import type { Company } from "@/src/types/company";

export type MarketplaceSnapshot = {
  liveListings: number | null;
  industries: number | null;
  specializations: number | null;
  categoryNames: string[];
};

/**
 * Real, public numbers for the landing hero — replaces the hardcoded
 * "6,200+ verified suppliers" / "94% on-time delivery" copy, which was
 * fabricated and never backed by data. Every field degrades to `null`
 * independently (never throws) so a slow/failed fetch just drops that one
 * stat tile instead of taking the whole hero down.
 *
 * No public "verified companies" count endpoint exists (the /api/companies
 * router is auth-only), so this deliberately only surfaces numbers we can
 * actually source from the public /products + /products/categories
 * endpoints: total live listings, industries (category) coverage, and
 * distinct sub-category specializations.
 */
export const getMarketplaceSnapshot = cache(async (): Promise<MarketplaceSnapshot> => {
  const [listings, categories] = await Promise.all([
    productService.list({ scope: "marketplace", limit: 1 }).catch(() => null),
    productService.getCategoryStats({ scope: "marketplace" }).catch(() => null),
  ]);

  const categoryList = categories?.categories ?? [];
  const specializations = categoryList.length
    ? new Set(categoryList.flatMap((c) => c.subCategories ?? [])).size
    : null;

  return {
    liveListings: listings?.pagination.total ?? null,
    industries: categoryList.length || null,
    specializations,
    categoryNames: categoryList.slice(0, 6).map((c) => c.title),
  };
});

// Server-side loaders for public detail pages. Wrapped in React `cache` so the
// metadata pass and the render pass within a single request share one fetch.
// A genuine 404 resolves to null (→ notFound()); transient/other errors are
// rethrown so the route isn't cached as missing and retries on the next request.

export const getPublicProduct = cache(async (id: string): Promise<Product | null> => {
  try {
    return await productService.get(id, { scope: "marketplace", includeVariantSummary: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    // Anything else trips the route's error boundary ("We hit an unexpected
    // error") — log it so a recurrence has a real stack trace instead of
    // being an unreproducible mystery.
    console.error(`[getPublicProduct] failed for product ${id}:`, err);
    throw err;
  }
});

export const getPublicCompany = cache(async (id: string): Promise<Company | null> => {
  try {
    const { company } = await companyService.get(id);
    return company;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    console.error(`[getPublicCompany] failed for company ${id}:`, err);
    throw err;
  }
});

const clamp = (text: string | undefined, max: number): string | undefined =>
  text ? (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text) : undefined;

export const productMetaDescription = (product: Product): string =>
  clamp(product.description, 160) ??
  `Source ${product.name} from ${product.company?.displayName ?? "a verified manufacturer"} on the ARVANN marketplace.`;

export const companyMetaDescription = (company: Company): string =>
  clamp(company.description, 160) ??
  `Browse products from ${company.displayName}, a verified manufacturer on the ARVANN marketplace.`;

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
