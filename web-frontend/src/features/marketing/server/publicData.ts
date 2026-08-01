import { cache } from "react";
import { ApiError } from "@/src/lib/api-error";
import { productService } from "@/src/services/product";
import { companyService } from "@/src/services/company";
import type { ListProductsParams, Product } from "@/src/types/product";
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

export type InitialListing = { products: Product[]; total: number; hasMore: boolean };

/**
 * Server-fetched first page (offset 0) of a product listing, for the
 * `/products` and `/products/category/[categoryId]` routes. Crawlers get a
 * populated `<ul>` of real product links in the very first HTML response
 * instead of the client "Loading…" skeleton (ListingResults otherwise only
 * fetches from a `useEffect`, which SSR never waits on). Params passed here
 * MUST mirror ListingResults' own default-mount fetch exactly (same
 * category/search, no sort, no price/stock filters) — see the `initial` prop
 * doc on ListingResults for why a mismatch would show stale data for one
 * paint. Never throws: an unreachable catalogue at request time should still
 * render the page shell (client-side fetch retries), not crash the route.
 */
export const getInitialListing = cache(async (params: ListProductsParams): Promise<InitialListing | undefined> => {
  try {
    const res = await productService.list({ scope: "marketplace", limit: 20, offset: 0, includeVariantSummary: false, ...params });
    return { products: res.products ?? [], total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false };
  } catch (err) {
    console.error("[getInitialListing] failed:", err);
    return undefined;
  }
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
    // companyService.get() hits the authenticated /companies/:id and 401s on
    // every unauthenticated server render — that was the live bug behind
    // every /sellers/[id] page rendering with no title, no content, and no
    // JSON-LD. getPublic() hits the field-whitelisted public endpoint instead.
    const { company } = await companyService.getPublic(id);
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

// JSON-LD builders moved to ./schema.ts (which also holds the site-level
// Organization/WebSite schema and the shared Breadcrumb/FAQ/ItemList
// builders) — re-exported here so existing imports (product/[id]/page.tsx,
// sellers/[id]/page.tsx) don't need to change.
export { buildProductJsonLd, buildCompanyJsonLd } from "./schema";
