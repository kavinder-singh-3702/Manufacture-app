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

/**
 * Seller-side "My Products" routes. Distinct from `productDetailHref` above:
 * those are the buyer-facing PDP, these are the owner's manage-my-catalog
 * pages (read-only detail + variants, create, edit).
 */
export const MY_PRODUCTS_HREF = "/dashboard/products/mine";
export const NEW_MY_PRODUCT_HREF = "/dashboard/products/mine/new";

export const myProductHref = (productId: string): string =>
  `${MY_PRODUCTS_HREF}/${encodeURIComponent(productId)}`;

export const myProductEditHref = (productId: string): string =>
  `${myProductHref(productId)}/edit`;
