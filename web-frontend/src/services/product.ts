import { httpClient, QueryParams } from "../lib/http-client";
import type {
  CreateProductInput,
  ListProductsParams,
  Product,
  ProductCategory,
  ProductImage,
  ProductListResponse,
  ProductListScope,
  ProductSort,
  ProductStats,
  ProductVisibility,
  UploadProductImagePayload,
} from "../types/product";

const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else {
      out[k] = String(v);
    }
  });
  return out;
};

const getCategoryStats = async (params?: { scope?: ProductListScope; createdByRole?: "admin" | "user" }) => {
  return httpClient.get<{ categories: ProductCategory[] }>("/products/categories", { params: toQuery(params) });
};

const getProductsByCategory = async (
  categoryId: string,
  params?: {
    limit?: number;
    offset?: number;
    status?: string;
    sort?: ProductSort;
    minPrice?: number;
    maxPrice?: number;
    scope?: ProductListScope;
    includeVariantSummary?: boolean;
  }
) => {
  return httpClient.get<ProductListResponse>(`/products/categories/${categoryId}/products`, { params: toQuery(params) });
};

const list = async (params?: ListProductsParams) => {
  return httpClient.get<ProductListResponse>("/products", { params: toQuery(params) });
};

const get = async (productId: string, params?: { scope?: ProductListScope; includeVariantSummary?: boolean }) => {
  const response = await httpClient.get<{ product: Product }>(`/products/${productId}`, { params: toQuery(params) });
  return response.product;
};

const create = async (data: CreateProductInput) => {
  const response = await httpClient.post<{ product: Product; message?: string }>("/products", data);
  return response.product;
};

const update = async (productId: string, data: Partial<CreateProductInput>) => {
  const response = await httpClient.request<{ product: Product }>({
    path: `/products/${productId}`,
    method: "PUT",
    data,
  });
  return response.product;
};

const adjustQuantity = async (productId: string, adjustment: number) => {
  const response = await httpClient.patch<{ product: Product }>(`/products/${productId}/quantity`, { adjustment });
  return response.product;
};

const remove = async (productId: string) => {
  return httpClient.delete<{ success: boolean }>(`/products/${productId}`);
};

const stats = async () => {
  return httpClient.get<ProductStats>("/products/stats");
};

const uploadImage = async (productId: string, payload: UploadProductImagePayload) => {
  return httpClient.post<{ product: Product; image: ProductImage }>(`/products/${productId}/images`, payload);
};

export const productService = {
  getCategoryStats,
  getProductsByCategory,
  list,
  get,
  create,
  update,
  adjustQuantity,
  remove,
  stats,
  uploadImage,
};

export type ProductVisibilityValue = ProductVisibility;
