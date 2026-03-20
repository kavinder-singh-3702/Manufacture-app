import { apiClient } from "./apiClient";

export type AdCampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";
export type AdPlacement = "dashboard_home" | "hero_banner";
export type AdMediaType = "image" | "video";
export type AdTargetingMode = "any" | "all";
export type AdEventType = "impression" | "click" | "dismiss";
export type AdPrice = { amount?: number; currency?: string; unit?: string };

export type AdTargetingRuleSet = {
  mode?: AdTargetingMode;
  userIds?: string[];
  shopperCategories?: string[];
  shopperSubCategories?: string[];
  buyIntentCategories?: string[];
  buyIntentSubCategories?: string[];
  listedProductCategories?: string[];
  listedProductSubCategories?: string[];
  requireListedProductInSameCategory?: boolean;
  lookbackDays?: number;
};

export type AdProductSummary = {
  id: string;
  name?: string;
  createdBy?: string;
  category?: string;
  subCategory?: string;
  price?: AdPrice;
  images?: Array<{ url?: string; fileName?: string }>;
  contactPreferences?: { allowChat?: boolean; allowCall?: boolean };
  company?: {
    id?: string;
    displayName?: string;
    complianceStatus?: string;
    contact?: { phone?: string };
  } | null;
};

export type AdCampaign = {
  id: string;
  name: string;
  description?: string;
  status: AdCampaignStatus;
  product: AdProductSummary | null;
  advertiserUser?: string;
  advertiserCompany?: string;
  placements: AdPlacement[];
  targeting: AdTargetingRuleSet;
  schedule?: { startAt?: string; endAt?: string };
  frequencyCapPerDay: number;
  priority: number;
  creative?: {
    priceOverride?: AdPrice;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    badge?: string;
    bannerImageUrl?: string;
    bannerVideoUrl?: string;
    bannerMediaType?: AdMediaType;
  };
  sourceServiceRequest?: string;
  createdBy?: string;
  lastUpdatedBy?: string;
  activatedAt?: string;
  pausedAt?: string;
  archivedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdFeedCard = {
  id: string;
  campaignId: string;
  sessionId: string;
  placement: AdPlacement;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  badge?: string;
  priority?: number;
  priceOverride?: AdPrice;
  pricing?: {
    listed?: AdPrice;
    advertised?: AdPrice;
    isDiscounted?: boolean;
  };
  product: AdProductSummary;
  bannerImageUrl?: string;
  bannerVideoUrl?: string;
  bannerMediaType?: AdMediaType;
  deepLink?: string;
};

export type AdEventPayload = {
  campaignId: string;
  type: AdEventType;
  placement?: AdPlacement;
  sessionId?: string;
  metadata?: Record<string, unknown>;
};

export type AdInsights = {
  campaignId: string;
  status: AdCampaignStatus;
  summary: Record<AdEventType, { count: number; uniqueUsers: number }>;
  ctr: number;
  byDay: Array<{ day: string; type: AdEventType; count: number }>;
};

export type UpsertAdCampaignInput = {
  name: string;
  description?: string;
  status?: AdCampaignStatus;
  productId: string;
  placements?: AdPlacement[];
  targeting?: AdTargetingRuleSet;
  schedule?: { startAt?: string | Date; endAt?: string | Date };
  frequencyCapPerDay?: number;
  priority?: number;
  creative?: {
    priceOverride?: AdPrice;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    badge?: string;
    bannerImageUrl?: string;
    bannerImageBase64?: string;
    bannerVideoUrl?: string;
    bannerVideoBase64?: string;
    bannerMediaType?: AdMediaType;
  };
  sourceServiceRequest?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateAdCampaignInput = Partial<UpsertAdCampaignInput>;

export type CampaignListFilters = {
  status?: AdCampaignStatus;
  search?: string;
  limit?: number;
  offset?: number;
};

export type CampaignListResponse = {
  campaigns: AdCampaign[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type CampaignFromRequestResponse = {
  prefill: UpsertAdCampaignInput;
  campaign?: AdCampaign;
  message?: string;
};

class AdService {
  async getFeed(params?: { placement?: AdPlacement; limit?: number }) {
    return apiClient.get<{ placement: AdPlacement; cards: AdFeedCard[] }>("/ads/feed", { params });
  }

  async logEvent(payload: AdEventPayload) {
    return apiClient.post<{ success: boolean; event: { id: string; campaignId: string; type: AdEventType; placement: AdPlacement; createdAt: string } }>(
      "/ads/events",
      payload
    );
  }

  async listCampaigns(params?: CampaignListFilters): Promise<CampaignListResponse> {
    return apiClient.get<CampaignListResponse>("/ads/admin/campaigns", { params });
  }

  async createCampaign(payload: UpsertAdCampaignInput): Promise<AdCampaign> {
    const response = await apiClient.post<{ campaign: AdCampaign }>("/ads/admin/campaigns", payload);
    return response.campaign;
  }

  async createCampaignWithMedia(
    payload: UpsertAdCampaignInput,
    videoFile: { uri: string; type: string; name: string },
  ): Promise<AdCampaign> {
    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    formData.append("bannerVideo", {
      uri: videoFile.uri,
      type: videoFile.type,
      name: videoFile.name,
    } as unknown as Blob);
    const response = await apiClient.post<{ campaign: AdCampaign }>("/ads/admin/campaigns", formData);
    return response.campaign;
  }

  async getCampaign(campaignId: string): Promise<AdCampaign> {
    const response = await apiClient.get<{ campaign: AdCampaign }>(`/ads/admin/campaigns/${campaignId}`);
    return response.campaign;
  }

  async updateCampaign(campaignId: string, payload: UpdateAdCampaignInput): Promise<AdCampaign> {
    const response = await apiClient.patch<{ campaign: AdCampaign }>(`/ads/admin/campaigns/${campaignId}`, payload);
    return response.campaign;
  }

  async activateCampaign(campaignId: string): Promise<AdCampaign> {
    const response = await apiClient.post<{ campaign: AdCampaign }>(`/ads/admin/campaigns/${campaignId}/activate`);
    return response.campaign;
  }

  async pauseCampaign(campaignId: string): Promise<AdCampaign> {
    const response = await apiClient.post<{ campaign: AdCampaign }>(`/ads/admin/campaigns/${campaignId}/pause`);
    return response.campaign;
  }

  async getInsights(campaignId: string): Promise<AdInsights> {
    const response = await apiClient.get<{ insights: AdInsights }>(`/ads/admin/campaigns/${campaignId}/insights`);
    return response.insights;
  }

  async createFromRequest(
    serviceRequestId: string,
    payload?: { activate?: boolean; prefillOnly?: boolean }
  ): Promise<CampaignFromRequestResponse> {
    return apiClient.post<CampaignFromRequestResponse>(`/ads/admin/campaigns/from-request/${serviceRequestId}`, payload ?? {});
  }
}

export const adService = new AdService();
