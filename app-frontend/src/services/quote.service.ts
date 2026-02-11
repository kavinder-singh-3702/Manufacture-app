import { apiClient } from "./apiClient";
import type { Product } from "./product.service";

export type QuoteStatus = "pending" | "quoted" | "accepted" | "rejected" | "cancelled" | "expired";
export type QuoteMode = "asked" | "received" | "incoming";

export type QuoteParty = {
  _id: string;
  displayName?: string;
  phone?: string;
  email?: string;
};

export type QuoteProductSummary = Pick<Product, "_id" | "name" | "images" | "price" | "category" | "contactPreferences">;

export type QuoteVariantSummary = {
  _id: string;
  title?: string;
  options?: Record<string, unknown>;
};

export type QuoteRequestSnapshot = {
  quantity: number;
  targetPrice?: number;
  currency?: string;
  requirements: string;
  requiredBy?: string;
  buyerContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
};

export type QuoteResponseSnapshot = {
  unitPrice?: number;
  currency?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  validUntil?: string;
  notes?: string;
  respondedAt?: string;
  respondedBy?: QuoteParty;
};

export type QuoteHistoryEntry = {
  actor?: QuoteParty | string;
  action: string;
  statusFrom?: QuoteStatus;
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
  sellerCompany?: {
    _id: string;
    displayName?: string;
    contact?: { phone?: string };
  };
  request: QuoteRequestSnapshot;
  response?: QuoteResponseSnapshot;
  status: QuoteStatus;
  history: QuoteHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type CreateQuotePayload = {
  productId: string;
  variantId?: string;
  quantity: number;
  targetPrice?: number;
  currency?: string;
  requirements: string;
  requiredBy?: string | Date;
  buyerContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
};

export type RespondQuotePayload = {
  unitPrice: number;
  currency?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  validUntil?: string | Date;
  notes?: string;
};

export type UpdateQuoteStatusPayload = {
  status: "accepted" | "rejected" | "cancelled" | "expired";
  note?: string;
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
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

class QuoteService {
  async create(payload: CreateQuotePayload): Promise<Quote> {
    const response = await apiClient.post<{ quote: Quote }>("/quotes", payload);
    return response.quote;
  }

  async list(params?: QuoteListParams): Promise<QuoteListResponse> {
    return apiClient.get<QuoteListResponse>("/quotes", { params });
  }

  async getById(quoteId: string): Promise<Quote> {
    const response = await apiClient.get<{ quote: Quote }>(`/quotes/${quoteId}`);
    return response.quote;
  }

  async respond(quoteId: string, payload: RespondQuotePayload): Promise<Quote> {
    const response = await apiClient.patch<{ quote: Quote }>(`/quotes/${quoteId}/respond`, payload);
    return response.quote;
  }

  async updateStatus(quoteId: string, payload: UpdateQuoteStatusPayload): Promise<Quote> {
    const response = await apiClient.patch<{ quote: Quote }>(`/quotes/${quoteId}/status`, payload);
    return response.quote;
  }
}

export const quoteService = new QuoteService();
