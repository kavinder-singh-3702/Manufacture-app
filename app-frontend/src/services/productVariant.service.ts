import { apiClient } from "./apiClient";
import { ProductListScope } from "./product.service";

export type ProductVariantStatus = "active" | "inactive" | "archived";

export type ProductVariant = {
  _id: string;
  product: string;
  company: string;
  title?: string;
  sku?: string;
  barcode?: string;
  options: Record<string, unknown>;
  price?: {
    amount: number;
    currency?: string;
    unit?: string;
  } | null;
  minStockQuantity: number;
  availableQuantity: number;
  unit?: string;
  status: ProductVariantStatus;
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProductVariantUpsertInput = {
  title?: string;
  sku?: string;
  barcode?: string;
  options: Record<string, unknown>;
  price?: {
    amount: number;
    currency?: string;
    unit?: string;
  } | null;
  minStockQuantity?: number;
  availableQuantity?: number;
  unit?: string;
  status?: ProductVariantStatus;
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type ProductVariantListResponse = {
  variants: ProductVariant[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

class ProductVariantService {
  async list(
    productId: string,
    params?: {
      limit?: number;
      offset?: number;
      status?: ProductVariantStatus;
      scope?: ProductListScope;
    }
  ): Promise<ProductVariantListResponse> {
    return apiClient.get<ProductVariantListResponse>(`/products/${productId}/variants`, { params });
  }

  async getById(
    productId: string,
    variantId: string,
    params?: { scope?: ProductListScope }
  ): Promise<ProductVariant> {
    const response = await apiClient.get<{ variant: ProductVariant }>(
      `/products/${productId}/variants/${variantId}`,
      { params }
    );
    return response.variant;
  }

  async create(productId: string, payload: ProductVariantUpsertInput): Promise<ProductVariant> {
    const response = await apiClient.post<{ variant: ProductVariant }>(`/products/${productId}/variants`, payload);
    return response.variant;
  }

  async update(productId: string, variantId: string, payload: Partial<ProductVariantUpsertInput>): Promise<ProductVariant> {
    const response = await apiClient.put<{ variant: ProductVariant }>(
      `/products/${productId}/variants/${variantId}`,
      payload
    );
    return response.variant;
  }

  async adjustQuantity(productId: string, variantId: string, adjustment: number): Promise<ProductVariant> {
    const response = await apiClient.patch<{ variant: ProductVariant }>(
      `/products/${productId}/variants/${variantId}/quantity`,
      { adjustment }
    );
    return response.variant;
  }

  async delete(productId: string, variantId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/products/${productId}/variants/${variantId}`);
  }
}

export const productVariantService = new ProductVariantService();
