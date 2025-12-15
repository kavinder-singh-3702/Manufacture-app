import { apiClient } from "./apiClient";

export type ProductCategory = {
  id: string;
  title: string;
  count: number;
  totalQuantity?: number;
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

export type Product = {
  _id: string;
  name: string;
  description?: string;
  sku?: string;
  category: string;
  price: ProductPrice;
  minStockQuantity: number;
  availableQuantity: number;
  unit?: string;
  visibility: "public" | "private";
  status: "draft" | "active" | "inactive" | "archived";
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  contactPreferences?: {
    allowChat?: boolean;
    allowCall?: boolean;
  };
  attributes?: Record<string, unknown>;
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  description?: string;
  sku?: string;
  category: string;
  price: { amount: number; currency?: string; unit?: string };
  minStockQuantity?: number;
  availableQuantity?: number;
  unit?: string;
  visibility?: "public" | "private";
  status?: "draft" | "active" | "inactive" | "archived";
  contactPreferences?: {
    allowChat?: boolean;
    allowCall?: boolean;
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

type PaginatedResponse = {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

class ProductService {
  async getCategoryStats(): Promise<{ categories: ProductCategory[] }> {
    return apiClient.get<{ categories: ProductCategory[] }>("/products/categories");
  }

  async getProductsByCategory(
    categoryId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedResponse> {
    return apiClient.get<PaginatedResponse>(`/products/categories/${categoryId}/products`, { params });
  }

  async getAll(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: string;
    search?: string;
    visibility?: string;
  }): Promise<PaginatedResponse> {
    return apiClient.get<PaginatedResponse>("/products", { params });
  }

  async getById(productId: string): Promise<Product> {
    const response = await apiClient.get<{ product: Product }>(`/products/${productId}`);
    return response.product;
  }

  async create(data: CreateProductInput): Promise<Product> {
    const response = await apiClient.post<{ product: Product }>("/products", data);
    return response.product;
  }

  async update(productId: string, data: Partial<CreateProductInput>): Promise<Product> {
    const response = await apiClient.put<{ product: Product }>(`/products/${productId}`, data);
    return response.product;
  }

  async adjustQuantity(productId: string, adjustment: number): Promise<Product> {
    const response = await apiClient.patch<{ product: Product }>(`/products/${productId}/quantity`, { adjustment });
    return response.product;
  }

  async delete(productId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/products/${productId}`);
  }

  async getStats(): Promise<ProductStats> {
    return apiClient.get<ProductStats>("/products/stats");
  }
}

export const productService = new ProductService();
