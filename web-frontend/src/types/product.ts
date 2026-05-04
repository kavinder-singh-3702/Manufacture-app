export type ProductCategory = {
  id: string;
  title: string;
  count: number;
  totalQuantity?: number;
  subCategories?: string[];
};

export type ProductPrice = {
  amount: number;
  currency: string;
  unit?: string;
};

export type ProductImage = {
  key?: string;
  url?: string;
  fileName?: string;
  contentType?: string;
  uploadedAt?: string;
  uploadedBy?: string;
};

export type ProductVariantSummary = {
  totalVariants: number;
  inStockVariants: number;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string | null;
};

export type ProductCheckoutReason = "not_inhouse" | "prepaid_disabled" | "inactive";

export type ProductPurchaseOptions = {
  prepaidEnabled: boolean;
  paymentMode: "none" | "full_prepay";
  provider: "none" | "razorpay";
  checkoutEligible: boolean;
  checkoutReason?: ProductCheckoutReason;
};

export type ProductStatus = "draft" | "active" | "inactive" | "archived";
export type ProductVisibility = "public" | "private";
export type ProductStockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type ProductListScope = "company" | "marketplace";
export type ProductSort = "priceAsc" | "priceDesc" | "ratingDesc" | "createdAt:desc" | "createdAt:asc";

export type Product = {
  _id: string;
  name: string;
  description?: string;
  sku?: string;
  category: string;
  subCategory?: string;
  createdByRole?: "admin" | "user";
  createdBy?: string;
  price: ProductPrice;
  minStockQuantity: number;
  availableQuantity: number;
  unit?: string;
  visibility: ProductVisibility;
  status: ProductStatus;
  isFavorite?: boolean;
  stockStatus?: ProductStockStatus;
  company?: {
    _id: string;
    displayName?: string;
    complianceStatus?: string;
    contact?: { phone?: string };
  };
  contactPreferences?: {
    allowChat?: boolean;
    allowCall?: boolean;
  };
  purchaseOptions?: ProductPurchaseOptions;
  attributes?: Record<string, unknown>;
  images?: ProductImage[];
  variantSummary?: ProductVariantSummary;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  description?: string;
  sku?: string;
  category: string;
  subCategory?: string;
  price: { amount: number; currency?: string; unit?: string };
  minStockQuantity?: number;
  availableQuantity?: number;
  unit?: string;
  visibility?: ProductVisibility;
  status?: ProductStatus;
  contactPreferences?: { allowChat?: boolean; allowCall?: boolean };
  purchaseOptions?: {
    prepaidEnabled?: boolean;
    paymentMode?: "none" | "full_prepay";
    provider?: "none" | "razorpay";
  };
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ProductStats = {
  totalItems: number;
  totalQuantity: number;
  totalCostValue: number;
  totalSellingValue: number;
  categoryDistribution: Array<{
    id: string;
    label: string;
    count: number;
    totalQuantity: number;
  }>;
  statusBreakdown: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
  };
  lowStockCount: number;
  outOfStockCount: number;
};

export type ProductListResponse = {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type ListProductsParams = {
  limit?: number;
  offset?: number;
  category?: string;
  status?: string;
  search?: string;
  visibility?: ProductVisibility;
  scope?: ProductListScope;
  sort?: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  includeVariantSummary?: boolean;
};

export type UploadProductImagePayload = {
  fileName: string;
  mimeType?: string;
  content: string;
};
