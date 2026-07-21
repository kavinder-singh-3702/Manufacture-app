import type { ListProductsParams, Product } from "@/src/types/product";

/**
 * Canonical query that defines an "in-house" (admin-listed) product: a public
 * marketplace product created by the platform admin. Single source of truth so
 * the home showcase, the dashboard section and the /shop page never drift.
 * Mirrors the mobile app's In-house Catalog query in `AdminProductsScreen`.
 */
export const INHOUSE_QUERY = {
  scope: "marketplace",
  createdByRole: "admin",
  visibility: "public",
} as const satisfies Partial<ListProductsParams>;

/** Route to the full in-house Shop page. */
export const INHOUSE_SHOP_HREF = "/shop";

/** Marketing copy shared across in-house surfaces. */
export const INHOUSE_COPY = {
  eyebrow: "ARVANN Select",
  heading: "In-house catalog",
  subheading: "Curated, ready-to-ship products sourced and quality-checked by ARVANN.",
  cta: "Shop the in-house catalog",
} as const;

/** How many products the home/dashboard preview shows before "View all". */
export const INHOUSE_PREVIEW_LIMIT = 8;

/** Page size for the full Shop page. */
export const INHOUSE_PAGE_SIZE = 24;

/**
 * Best-effort rating extraction from free-form product attributes. Admin
 * products may carry `rating`/`stars`; returns null when absent so the UI can
 * hide the stars rather than render a fake 0.
 */
export const getProductRating = (product: Product): number | null => {
  const attrs = product.attributes as Record<string, unknown> | undefined;
  const raw =
    typeof attrs?.rating === "number"
      ? attrs.rating
      : typeof attrs?.stars === "number"
        ? attrs.stars
        : null;
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  return Math.max(0, Math.min(5, raw));
};
