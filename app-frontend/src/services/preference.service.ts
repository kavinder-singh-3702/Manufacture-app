import { apiClient } from "./apiClient";
import { Product } from "./product.service";
import { ServiceType } from "./serviceRequest.service";

export type PreferenceEventType =
  | "search"
  | "view_category"
  | "view_product"
  | "add_to_cart"
  | "remove_from_cart"
  | "campaign_impression"
  | "campaign_click"
  | "campaign_message"
  | "campaign_call"
  | "checkout_start";

export type LogPreferenceEventInput = {
  type: PreferenceEventType;
  productId?: string;
  category?: string;
  searchTerm?: string;
  quantity?: number;
  meta?: Record<string, unknown>;
};

export type CampaignContentType = "product" | "service";
export type CampaignStatus = "draft" | "active" | "expired" | "archived";
export type CampaignPriority = "low" | "normal" | "high" | "urgent";
export type KnownCampaignThemeKey =
  | "campaignFocus"
  | "campaignWarmEmber"
  | "campaignCyan"
  | "default"
  | "premium"
  | "warm"
  | "emerald";
export type CampaignThemeKey = KnownCampaignThemeKey | (string & {});

export type CampaignCreative = {
  headline?: string;
  subheadline?: string;
  badge?: string;
  themeKey?: CampaignThemeKey;
  ctaLabel?: string;
};

export type CampaignContact = {
  adminUserId?: string;
  adminName?: string;
  phone?: string;
  allowChat?: boolean;
  allowCall?: boolean;
};

export type PersonalizedOffer = {
  id: string;
  user?: string | { id: string; displayName?: string; email?: string; phone?: string };
  company?: string | { id: string; displayName?: string; contact?: { phone?: string } };
  createdBy?: string | { id: string; displayName?: string; email?: string; phone?: string };
  contentType?: CampaignContentType;
  serviceType?: ServiceType;
  product?: { id: string; name?: string; category?: string; price?: { amount?: number; currency?: string; unit?: string } };
  title: string;
  message?: string;
  creative?: CampaignCreative;
  offerType?: "price_drop" | "combo" | "min_value";
  oldPrice?: number;
  newPrice?: number;
  currency?: string;
  minOrderValue?: number;
  discountPercent?: number;
  priority?: CampaignPriority;
  startsAt?: string;
  expiresAt?: string;
  status?: CampaignStatus;
  contact?: CampaignContact;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type CampaignListFilters = {
  userId?: string;
  includeExpired?: boolean;
  status?: CampaignStatus;
  contentType?: CampaignContentType;
  search?: string;
  sort?: "createdAt:desc" | "createdAt:asc" | "updatedAt:desc" | "updatedAt:asc" | "priority:desc";
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export type CampaignFiltersV2 = CampaignListFilters;

export type CampaignListResponse = {
  campaigns?: PersonalizedOffer[];
  offers?: PersonalizedOffer[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
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

export type HomeFeedRecommendation = {
  product: Product;
  reason: string;
  score?: number;
};

export type HomeFeedResponse = {
  campaigns: PersonalizedOffer[];
  recommendations: HomeFeedRecommendation[];
  signals?: {
    topCategories?: Array<{ category: string; count: number; lastEvent?: string }>;
    topProducts?: Array<{ id?: string; name?: string; category?: string }>;
    actionCounts?: Record<string, number>;
  };
  meta?: {
    generatedAt?: string;
    hasCampaigns?: boolean;
    fallbackUsed?: boolean;
  };
};

export type CreateCampaignPayload = {
  contentType?: CampaignContentType;
  serviceType?: ServiceType;
  productId?: string;
  title: string;
  message?: string;
  creative?: CampaignCreative;
  offerType?: "price_drop" | "combo" | "min_value";
  newPrice?: number;
  oldPrice?: number;
  currency?: string;
  minOrderValue?: number;
  priority?: CampaignPriority;
  startsAt?: string;
  expiresAt?: string;
  status?: CampaignStatus;
  contact?: CampaignContact;
  metadata?: Record<string, unknown>;
};

export type UpdateCampaignPayload = Partial<CreateCampaignPayload>;
export type UpdateCampaignWithOptimisticPayload = UpdateCampaignPayload & { expectedUpdatedAt?: string };

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

  async getHomeFeed(params?: { campaignLimit?: number; recommendationLimit?: number }): Promise<HomeFeedResponse> {
    return apiClient.get<HomeFeedResponse>("/preferences/home-feed", { params });
  }

  async getMyOffers(params?: { limit?: number }): Promise<{ offers: PersonalizedOffer[] }> {
    return apiClient.get<{ offers: PersonalizedOffer[] }>("/preferences/my-offers", { params });
  }

  async getMyCampaigns(params?: { limit?: number }): Promise<{ offers: PersonalizedOffer[] }> {
    return apiClient.get<{ offers: PersonalizedOffer[] }>("/preferences/my-campaigns", { params });
  }

  async listUserOffers(userId: string, params?: CampaignListFilters): Promise<{ offers: PersonalizedOffer[]; pagination?: CampaignListResponse["pagination"] }> {
    const response = await apiClient.get<{ offers: PersonalizedOffer[]; pagination?: CampaignListResponse["pagination"] }>(
      `/preferences/admin/users/${userId}/offers`,
      { params }
    );
    return response;
  }

  async listCampaigns(params?: CampaignListFilters): Promise<{ campaigns: PersonalizedOffer[]; pagination?: CampaignListResponse["pagination"] }> {
    const response = await apiClient.get<CampaignListResponse>("/preferences/admin/campaigns", { params });
    return {
      campaigns: response.campaigns || response.offers || [],
      pagination: response.pagination,
    };
  }

  async createCampaign(userId: string, payload: CreateCampaignPayload): Promise<{ offer: PersonalizedOffer }> {
    return apiClient.post<{ offer: PersonalizedOffer }>(`/preferences/admin/users/${userId}/campaigns`, payload);
  }

  async updateCampaign(
    userId: string,
    campaignId: string,
    payload: UpdateCampaignWithOptimisticPayload
  ): Promise<{ campaign: PersonalizedOffer }> {
    return apiClient.patch<{ campaign: PersonalizedOffer }>(
      `/preferences/admin/users/${userId}/campaigns/${campaignId}`,
      payload
    );
  }

  async duplicateCampaign(campaignId: string): Promise<{ campaign: PersonalizedOffer }> {
    return apiClient.post<{ campaign: PersonalizedOffer }>(`/preferences/admin/campaigns/${campaignId}/duplicate`);
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
    return this.createCampaign(userId, {
      contentType: "product",
      productId: payload.productId,
      title: payload.title,
      message: payload.message,
      offerType: payload.offerType,
      newPrice: payload.newPrice,
      oldPrice: payload.oldPrice,
      currency: payload.currency,
      minOrderValue: payload.minOrderValue,
      expiresAt: payload.expiresAt,
      metadata: payload.metadata,
    });
  }
}

export const preferenceService = new PreferenceService();
