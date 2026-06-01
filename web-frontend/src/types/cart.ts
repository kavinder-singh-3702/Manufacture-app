import type { Product } from "./product";

export type CartVariantSnapshot = {
  id: string;
  name: string;
  options?: Record<string, string>;
  price?: { amount: number; currency?: string; unit?: string };
  unit?: string;
};

export type CartItem = {
  lineKey: string;
  product: Product;
  variant?: CartVariantSnapshot;
  quantity: number;
  addedAt: string;
};

export const getCartLineKey = (productId: string, variantId?: string | null) =>
  `${productId}::${variantId ?? "base"}`;

export type CheckoutLineInput = {
  lineKey?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  productName?: string;
  unitPrice?: number;
  currency?: string;
};

export type CheckoutAddressInput = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CheckoutSource = "buy_now" | "cart";
