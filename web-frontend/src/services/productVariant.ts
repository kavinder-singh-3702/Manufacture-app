import { httpClient, QueryParams } from "../lib/http-client";
import type { CreateVariantInput, ProductVariant } from "../types/product";

const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
  });
  return out;
};

const list = async (productId: string, params?: { limit?: number; offset?: number; scope?: string }) => {
  return httpClient.get<{ variants: ProductVariant[]; pagination: { total: number; hasMore: boolean } }>(
    `/products/${productId}/variants`,
    { params: toQuery(params) }
  );
};

const create = async (productId: string, data: CreateVariantInput) => {
  const res = await httpClient.post<{ variant: ProductVariant }>(`/products/${productId}/variants`, data);
  return res.variant;
};

const update = async (productId: string, variantId: string, data: Partial<CreateVariantInput>) => {
  const res = await httpClient.request<{ variant: ProductVariant }>({
    path: `/products/${productId}/variants/${variantId}`,
    method: "PUT",
    data,
  });
  return res.variant;
};

const remove = async (productId: string, variantId: string) => {
  return httpClient.delete<{ success: boolean }>(`/products/${productId}/variants/${variantId}`);
};

export const productVariantService = { list, create, update, remove };
