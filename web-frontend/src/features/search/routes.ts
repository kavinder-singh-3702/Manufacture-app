/**
 * Where a submitted search lands. Kept in one place so the dashboard topbar,
 * the marketing topbar and the category dropdown can't drift apart — the
 * marketing dropdown used to link at `/dashboard/products/search`, bouncing
 * signed-out visitors into an authenticated route.
 */
export const PRODUCT_SEARCH_ROUTES = {
  /** Public marketplace listing — signed out or marketing pages. */
  public: "/products",
  /** In-dashboard search page. */
  dashboard: "/dashboard/products/search",
} as const;

export type ProductSearchSurface = keyof typeof PRODUCT_SEARCH_ROUTES;

export const buildSearchHref = (surface: ProductSearchSurface, query: string) => {
  const base = PRODUCT_SEARCH_ROUTES[surface];
  const q = query.trim();
  return q ? `${base}?q=${encodeURIComponent(q)}` : base;
};
