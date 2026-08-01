/**
 * Single source of truth for product-detail URLs. Before this, four call
 * sites hand-rolled the same two templates and two of them forgot
 * `encodeURIComponent` on the id — harmless today since ids are Mongo
 * ObjectIds, but a latent bug the moment that assumption changes.
 */
export const productDetailHref = (
  productId: string,
  context: "dashboard" | "public" = "dashboard"
): string =>
  context === "public"
    ? `/products/${encodeURIComponent(productId)}`
    : `/dashboard/products/detail?productId=${encodeURIComponent(productId)}`;
