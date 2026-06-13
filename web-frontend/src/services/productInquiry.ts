import { httpClient, QueryParams } from "../lib/http-client";
import type { ProductInquiryInput } from "../types/product";

// ── Types ──────────────────────────────────────────────────────────────────────

export type InquiryStatus = "pending" | "seen" | "responded" | "closed";

export type ProductInquiry = {
  _id: string;
  product?: {
    _id: string;
    name: string;
    images?: { url?: string }[];
    price?: { amount: number; currency: string };
    category?: string;
  };
  variant?: { _id: string; title?: string } | null;
  buyer?: { _id: string; displayName?: string; email?: string; phone?: string };
  buyerSnapshot?: { name?: string; email?: string; phone?: string };
  productSnapshot?: { name?: string; amount?: number; currency?: string };
  quantity?: number;
  location?: string;
  message?: string;
  status: InquiryStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type InquiryListResponse = {
  inquiries: ProductInquiry[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type UpdateInquiryStatusPayload = {
  status: InquiryStatus;
  adminNotes?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
  });
  return Object.keys(out).length ? out : undefined;
};

// ── Service ───────────────────────────────────────────────────────────────────

const create = (data: ProductInquiryInput) =>
  httpClient.post<{ success: boolean; message?: string }>("/product-inquiries", data);

const adminList = (params?: { status?: InquiryStatus; productId?: string; buyerId?: string; limit?: number; offset?: number }) =>
  httpClient.get<InquiryListResponse>("/admin/product-inquiries", { params: toQuery(params as Record<string, unknown>) });

const adminUpdateStatus = (inquiryId: string, payload: UpdateInquiryStatusPayload) =>
  httpClient.patch<{ inquiry: ProductInquiry }>(`/admin/product-inquiries/${inquiryId}/status`, payload)
    .then((r) => r.inquiry);

export const productInquiryService = { create, adminList, adminUpdateStatus };
