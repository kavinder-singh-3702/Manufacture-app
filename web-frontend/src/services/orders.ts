import { httpClient, QueryParams } from "../lib/http-client";
import type { OrderListResponse, ProductOrder } from "../types/order";

const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
  });
  return out;
};

const list = async (params?: { limit?: number; offset?: number; status?: string; paymentStatus?: string }) =>
  httpClient.get<OrderListResponse>("/product-orders", { params: toQuery(params) });

const get = async (orderId: string) =>
  httpClient.get<{ order: ProductOrder }>(`/product-orders/${orderId}`);

export const ordersService = { list, get };
