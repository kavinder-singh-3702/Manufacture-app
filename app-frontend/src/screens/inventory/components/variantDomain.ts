import { Product, productService } from "../../../services/product.service";
import { ProductListScope } from "../../../services/product.service";
import { ProductVariant, productVariantService } from "../../../services/productVariant.service";

export const hasVariants = (product?: Product | null): boolean => {
  if (!product) return false;
  if (Number(product.variantSummary?.totalVariants || 0) > 0) return true;
  const attrs = product.attributes as Record<string, unknown> | undefined;
  return typeof attrs?.variants === "number" && attrs.variants > 0;
};

export const variantDisplayLabel = (variant: ProductVariant): string => {
  if (variant.title?.trim()) return variant.title.trim();
  const entries = Object.entries((variant.options || {}) as Record<string, unknown>);
  if (!entries.length) return "Variant";
  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" • ");
};

export const listAllVariants = async (
  productId: string,
  scope: ProductListScope = "company"
): Promise<ProductVariant[]> => {
  return productVariantService.listAll(productId, { scope });
};

const getVariantPriceCandidates = (variants: ProductVariant[]): number[] => {
  return variants
    .map((variant) => Number(variant.price?.amount))
    .filter((value) => Number.isFinite(value) && value >= 0);
};

const getFirstNonEmpty = (values: Array<string | undefined | null>): string | undefined => {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
};

/**
 * Keep product-level stock and base price aligned with variant data.
 * This allows existing product-level screens/filters to stay correct.
 */
export const syncProductFromVariants = async (
  productId: string,
  scope: ProductListScope = "company"
): Promise<{ product: Product; variants: ProductVariant[] }> => {
  const [product, allVariants] = await Promise.all([
    productService.getById(productId, { scope, includeVariantSummary: true }),
    listAllVariants(productId, scope),
  ]);

  const activeVariants = allVariants.filter((variant) => variant.status === "active");
  if (!activeVariants.length) {
    return { product, variants: allVariants };
  }

  const availableQuantity = activeVariants.reduce((sum, variant) => {
    const qty = Number(variant.availableQuantity || 0);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);

  const minStockQuantity = activeVariants.reduce((sum, variant) => {
    const qty = Number(variant.minStockQuantity || 0);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);

  const variantPrices = getVariantPriceCandidates(activeVariants);
  const minPrice = variantPrices.length ? Math.min(...variantPrices) : Number(product.price?.amount || 0);

  const currency =
    getFirstNonEmpty(activeVariants.map((variant) => variant.price?.currency)) ||
    product.price?.currency ||
    "INR";

  const priceUnit =
    getFirstNonEmpty(activeVariants.map((variant) => variant.price?.unit)) ||
    product.price?.unit ||
    product.unit ||
    "units";

  const productUnit =
    getFirstNonEmpty(activeVariants.map((variant) => variant.unit)) ||
    product.unit ||
    priceUnit ||
    "units";

  const syncedProduct = await productService.update(productId, {
    availableQuantity,
    minStockQuantity,
    unit: productUnit,
    price: {
      amount: minPrice,
      currency,
      unit: priceUnit,
    },
  });

  return {
    product: syncedProduct,
    variants: allVariants,
  };
};
