import { apiClient } from "./apiClient";

export type PreferenceEventType =
  | "search"
  | "view_category"
  | "view_product"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_start";

export type LogPreferenceEventInput = {
  type: PreferenceEventType;
  productId?: string;
  category?: string;
  searchTerm?: string;
  quantity?: number;
  meta?: Record<string, unknown>;
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
    checkoutStarts?: number;
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
    return apiClient.post<{ success: boolean }>("/preferences/events", payload);
  }

  async getUserSummary(userId: string, params?: { days?: number; limit?: number; companyId?: string }) {
    const response = await apiClient.get<{ summary: PreferenceSummary }>(`/preferences/admin/users/${userId}`, {
      params,
    });
    return response.summary;
  }
}

export const preferenceService = new PreferenceService();
