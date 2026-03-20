import { Product } from "../../../services/product.service";

export const isPublicListingProduct = (product?: Pick<Product, "visibility"> | null): boolean =>
  product?.visibility === "public";
