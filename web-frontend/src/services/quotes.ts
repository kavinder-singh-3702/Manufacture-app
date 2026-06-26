import { httpClient, QueryParams } from "../lib/http-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type QuoteStatus = "pending" | "quoted" | "accepted" | "rejected" | "cancelled" | "expired";
export type QuoteMode = "asked" | "received" | "incoming";

export type QuoteParty = {
  _id: string;
  displayName?: string;
  phone?: string;
  email?: string;
};

export type QuoteProductSummary = {
  _id: string;
  name: string;
  images?: { url: string }[];
  price?: { amount: number; currency?: string };
  category?: string;
};

export type QuoteVariantSummary = {
  _id: string;
  title?: string;
};

export type QuoteRequestSnapshot = {
  quantity: number;
  targetPrice?: number;
  currency?: string;
  requirements: string;
  requiredBy?: string;
  buyerContact?: { name?: string; phone?: string; email?: string };
};

export type QuoteResponseSnapshot = {
  unitPrice?: number;
  currency?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  validUntil?: string;
  notes?: string;
  respondedAt?: string;
};

export type QuoteHistoryEntry = {
  action: string;
  statusTo?: QuoteStatus;
  note?: string;
  timestamp: string;
};

export type Quote = {
  _id: string;
  product: QuoteProductSummary;
  variant?: QuoteVariantSummary | null;
  buyer: QuoteParty;
  seller: QuoteParty;
  sellerCompany?: { _id: string; displayName?: string; contact?: { phone?: string } };
  request: QuoteRequestSnapshot;
  response?: QuoteResponseSnapshot;
  status: QuoteStatus;
  history: QuoteHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type QuoteListParams = {
  mode?: QuoteMode;
  status?: QuoteStatus;
  limit?: number;
  offset?: number;
  search?: string;
};

export type QuoteListResponse = {
  quotes: Quote[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type RespondQuotePayload = {
  unitPrice: number;
  currency?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  validUntil?: string;
  notes?: string;
};

export type CreateQuotePayload = {
  productId: string;
  variantId?: string;
  quantity: number;
  targetPrice?: number;
  currency?: string;
  requirements: string;
  requiredBy?: string;
  buyerContact?: { name?: string; phone?: string; email?: string };
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

const list = (params?: QuoteListParams) =>
  httpClient.get<QuoteListResponse>("/quotes", { params: toQuery(params) });

const create = (payload: CreateQuotePayload) =>
  httpClient.post<{ quote: Quote }>("/quotes", payload).then((r) => r.quote);

const respond = (quoteId: string, payload: RespondQuotePayload) =>
  httpClient.patch<{ quote: Quote }>(`/quotes/${quoteId}/respond`, payload).then((r) => r.quote);

const updateStatus = (quoteId: string, payload: { status: "accepted" | "rejected" | "cancelled" | "expired"; note?: string }) =>
  httpClient.patch<{ quote: Quote }>(`/quotes/${quoteId}/status`, payload).then((r) => r.quote);

export const quoteService = { list, create, respond, updateStatus };
