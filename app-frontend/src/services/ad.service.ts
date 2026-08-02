import { apiClient } from "./apiClient";

export type AdCampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";
export type AdPlacement = "dashboard_home" | "hero_banner" | "cart_cross_sell";
export type AdMediaType = "image" | "video";
export type AdTargetingMode = "any" | "all";
export type AdEventType = "impression" | "click" | "dismiss";
export type AdSource = "internal" | "external";
export type AdPrice = { amount?: number; currency?: string; unit?: string };

// A campaign either promotes an internal catalog `product` (adSource:
// "internal") OR links out to this third-party destination (adSource:
// "external") — never both. Mirrors the web service's AdExternal type.
export type AdExternal = {
  destinationUrl: string;
  advertiserName: string;
  /** `null` explicitly clears a saved logo on update; a fresh logo upload travels as a multipart file (see AdMediaFiles), never base64 here. */
  advertiserLogoUrl?: string | null;
  category?: string;
  subCategory?: string;
};

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
  availableQuantity?: number;
  minStockQuantity?: number;
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
  adSource: AdSource;
  product: AdProductSummary | null;
  external?: AdExternal;
  advertiserUser?: string;
  advertiserCompany?: string;
  placements: AdPlacement[];
  targeting: AdTargetingRuleSet;
  schedule?: { startAt?: string; endAt?: string };
  frequencyCapPerDay: number;
  /** Minimum minutes between interstitial-popup showings, independent of frequencyCapPerDay. */
  popupCooldownMinutes: number;
  priority: number;
  creative?: {
    priceOverride?: AdPrice;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    badge?: string;
    bannerImageUrl?: string;
    bannerVideoUrl?: string;
    bannerPosterUrl?: string;
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
  adSource: AdSource;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  badge?: string;
  priority?: number;
  frequencyCapPerDay?: number;
  /** Minimum minutes between interstitial-popup showings for this campaign. */
  popupCooldownMinutes?: number;
  priceOverride?: AdPrice;
  pricing?: {
    listed?: AdPrice;
    advertised?: AdPrice;
    isDiscounted?: boolean;
  };
  product: AdProductSummary | null;
  external?: Pick<AdExternal, "destinationUrl" | "advertiserName" | "advertiserLogoUrl">;
  bannerImageUrl?: string;
  bannerVideoUrl?: string;
  bannerPosterUrl?: string;
  bannerMediaType?: AdMediaType;
  endsAt?: string;
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
  adSource?: AdSource;
  productId?: string;
  external?: AdExternal;
  placements?: AdPlacement[];
  targeting?: AdTargetingRuleSet;
  schedule?: { startAt?: string | Date; endAt?: string | Date };
  frequencyCapPerDay?: number;
  popupCooldownMinutes?: number;
  priority?: number;
  creative?: {
    priceOverride?: AdPrice;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    badge?: string;
    /** `null` explicitly clears a saved value on update; a fresh upload travels as a multipart file (see AdMediaFiles), never base64 here. */
    bannerImageUrl?: string | null;
    bannerVideoUrl?: string | null;
    bannerPosterUrl?: string | null;
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

// A locally-picked file, in the shape React Native's `FormData` expects.
export type AdMediaFile = { uri: string; type: string; name: string };

// One optional file per media slot a campaign can carry. Every slot travels
// as a real multipart file now — none of them are base64-encoded and
// embedded in the JSON body anymore. Previously only the banner video did;
// banner image, poster, and advertiser logo were read into a base64 string
// via `expo-image-manipulator`'s `base64: true` output, which cost an
// on-device encode for data that was just going to be re-decoded server
// side, plus the same ~33% wire bloat the web client had. Field names match
// the web client's `AdMediaFiles` (`src/services/ad.ts`) so the backend
// needs no per-platform branching.
export type AdMediaFiles = {
  bannerImage?: AdMediaFile;
  bannerVideo?: AdMediaFile;
  bannerPoster?: AdMediaFile;
  advertiserLogo?: AdMediaFile;
};

const hasAnyMediaFile = (files?: AdMediaFiles) =>
  !!files && (!!files.bannerImage || !!files.bannerVideo || !!files.bannerPoster || !!files.advertiserLogo);

const appendMediaFile = (form: FormData, field: string, file?: AdMediaFile) => {
  if (!file) return;
  form.append(field, { uri: file.uri, type: file.type, name: file.name } as unknown as Blob);
};

// The campaign JSON payload plus whichever media files are present, as
// multipart form data — mirrors the web client's `buildMediaForm`
// (`src/services/ad.ts`). The backend (parseAdMultipart) JSON-parses
// `payload` and attaches each uploaded field as a raw buffer.
const buildMediaForm = (payload: UpsertAdCampaignInput, files: AdMediaFiles) => {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  appendMediaFile(form, "bannerImage", files.bannerImage);
  appendMediaFile(form, "bannerVideo", files.bannerVideo);
  appendMediaFile(form, "bannerPoster", files.bannerPoster);
  appendMediaFile(form, "advertiserLogo", files.advertiserLogo);
  return form;
};

class AdService {
  async getFeed(params?: {
    placement?: AdPlacement;
    limit?: number;
    // Cross-sell: match an ad to the category + sub-category of a cart item.
    category?: string;
    subCategory?: string;
    excludeProductId?: string;
  }) {
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

  async createCampaign(payload: UpsertAdCampaignInput, mediaFiles?: AdMediaFiles): Promise<AdCampaign> {
    const response = hasAnyMediaFile(mediaFiles)
      ? await apiClient.post<{ campaign: AdCampaign }>("/ads/admin/campaigns", buildMediaForm(payload, mediaFiles!))
      : await apiClient.post<{ campaign: AdCampaign }>("/ads/admin/campaigns", payload);
    return response.campaign;
  }

  async getCampaign(campaignId: string): Promise<AdCampaign> {
    const response = await apiClient.get<{ campaign: AdCampaign }>(`/ads/admin/campaigns/${campaignId}`);
    return response.campaign;
  }

  async updateCampaign(campaignId: string, payload: UpdateAdCampaignInput, mediaFiles?: AdMediaFiles): Promise<AdCampaign> {
    const response = hasAnyMediaFile(mediaFiles)
      ? await apiClient.patch<{ campaign: AdCampaign }>(`/ads/admin/campaigns/${campaignId}`, buildMediaForm(payload as UpsertAdCampaignInput, mediaFiles!))
      : await apiClient.patch<{ campaign: AdCampaign }>(`/ads/admin/campaigns/${campaignId}`, payload);
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

  async stopCampaign(campaignId: string): Promise<AdCampaign> {
    const response = await apiClient.patch<{ campaign: AdCampaign }>(`/ads/admin/campaigns/${campaignId}`, { status: "archived" });
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
