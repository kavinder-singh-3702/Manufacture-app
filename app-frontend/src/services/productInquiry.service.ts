import { apiClient } from "./apiClient";

export type InquiryStatus = "pending" | "seen" | "responded" | "closed";

export type InquiryBuyerSnapshot = {
  name?: string;
  email?: string;
  phone?: string;
};

export type InquiryProductSnapshot = {
  name?: string;
  amount?: number;
  currency?: string;
};

export type ProductInquiry = {
  _id: string;
  product?: { _id: string; name: string; images?: { url?: string }[]; price?: { amount: number; currency: string }; category?: string };
  variant?: { _id: string; title?: string; options?: Record<string, unknown> } | null;
  buyer?: { _id: string; displayName?: string; email?: string; phone?: string };
  buyerSnapshot?: InquiryBuyerSnapshot;
  productSnapshot?: InquiryProductSnapshot;
  quantity?: number;
  location?: string;
  message?: string;
  status: InquiryStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInquiryPayload = {
  productId: string;
  variantId?: string;
  quantity?: number;
  location?: string;
  message?: string;
  contact?: { name?: string; phone?: string; email?: string };
};

export type InquiryListParams = {
  status?: InquiryStatus;
  limit?: number;
  offset?: number;
};

export type AdminInquiryListParams = InquiryListParams & {
  productId?: string;
  buyerId?: string;
};

export type InquiryListResponse = {
  inquiries: ProductInquiry[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type UpdateInquiryStatusPayload = {
  status: InquiryStatus;
  adminNotes?: string;
};

class ProductInquiryService {
  async create(payload: CreateInquiryPayload): Promise<ProductInquiry> {
    const response = await apiClient.post<{ inquiry: ProductInquiry }>("/product-inquiries", payload);
    return response.inquiry;
  }

  async listMine(params?: InquiryListParams): Promise<InquiryListResponse> {
    return apiClient.get<InquiryListResponse>("/product-inquiries", { params });
  }

  async adminList(params?: AdminInquiryListParams): Promise<InquiryListResponse> {
    return apiClient.get<InquiryListResponse>("/admin/product-inquiries", { params });
  }

  async adminGet(inquiryId: string): Promise<ProductInquiry> {
    const response = await apiClient.get<{ inquiry: ProductInquiry }>(`/admin/product-inquiries/${inquiryId}`);
    return response.inquiry;
  }

  async adminUpdateStatus(inquiryId: string, payload: UpdateInquiryStatusPayload): Promise<ProductInquiry> {
    const response = await apiClient.patch<{ inquiry: ProductInquiry }>(`/admin/product-inquiries/${inquiryId}/status`, payload);
    return response.inquiry;
  }
}

export const productInquiryService = new ProductInquiryService();
