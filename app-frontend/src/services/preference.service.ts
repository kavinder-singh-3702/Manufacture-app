import { apiClient } from "./apiClient";

export type PreferenceEventType = "search" | "view_category" | "view_product";

export type LogPreferenceEventInput = {
  type: PreferenceEventType;
  productId?: string;
  category?: string;
  searchTerm?: string;
  quantity?: number;
  meta?: Record<string, unknown>;
};

export type PersonalizedOffer = {
  id: string;
  user?: string;
  product?: { id: string; name?: string; category?: string };
  title: string;
  message?: string;
  offerType?: "price_drop" | "combo" | "min_value";
  oldPrice?: number;
  newPrice: number;
  currency?: string;
  minOrderValue?: number;
  discountPercent?: number;
  expiresAt?: string;
  status?: string;
  createdAt?: string;
};

export type PreferenceSummary = {
  userId?: string;
  windowDays?: number;
  topCategories: Array<{ category: string; count: number; lastEvent?: string }>;
  topSearchTerms: Array<{ term: string; count: number; lastEvent?: string }>;
  topProducts: Array<{
    id?: string;
    name?: string;
    category?: string;
    addsToCart?: number;
    views?: number;
    total?: number;
    lastEvent?: string;
  }>;
  actionCounts: Record<string, number>;
  recentEvents: Array<{
    id: string;
    type: PreferenceEventType;
    product?: { id: string; name?: string; category?: string };
    category?: string;
    searchTerm?: string;
    quantity?: number;
    meta?: Record<string, unknown>;
    createdAt: string;
  }>;
};

class PreferenceService {
  async logEvent(payload: LogPreferenceEventInput) {
    // Fire and forget is handled by caller; errors will surface if awaited.
    return apiClient.post<{ success: boolean }>("/preferences/events", payload);
  }

  async getUserSummary(userId: string, params?: { days?: number; limit?: number; companyId?: string }) {
    const response = await apiClient.get<{ summary: PreferenceSummary }>(`/preferences/admin/users/${userId}`, {
      params,
    });
    return response.summary;
  }

  async getMyOffers(): Promise<{ offers: PersonalizedOffer[] }> {
    return apiClient.get<{ offers: PersonalizedOffer[] }>("/preferences/my-offers");
  }

  async listUserOffers(userId: string, params?: { includeExpired?: boolean }): Promise<{ offers: PersonalizedOffer[] }> {
    return apiClient.get<{ offers: PersonalizedOffer[] }>(`/preferences/admin/users/${userId}/offers`, { params });
  }

  async createUserOffer(
    userId: string,
    payload: {
      productId: string;
      title: string;
      message?: string;
      offerType?: "price_drop" | "combo" | "min_value";
      newPrice: number;
      oldPrice?: number;
      currency?: string;
      minOrderValue?: number;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ offer: PersonalizedOffer }> {
    return apiClient.post<{ offer: PersonalizedOffer }>(`/preferences/admin/users/${userId}/offers`, payload);
  }
}

export const preferenceService = new PreferenceService();
