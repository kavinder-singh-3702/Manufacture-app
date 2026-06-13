import { httpClient, QueryParams } from "../lib/http-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AdCampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";
export type AdPlacement = "dashboard_home" | "hero_banner";
export type AdMediaType = "image" | "video";
export type AdEventType = "impression" | "click" | "dismiss";
export type AdPrice = { amount?: number; currency?: string; unit?: string };

export type AdProductSummary = {
  id: string;
  name?: string;
  category?: string;
  subCategory?: string;
  price?: AdPrice;
  images?: Array<{ url?: string; fileName?: string }>;
  company?: { id?: string; displayName?: string } | null;
};

export type AdCreative = {
  priceOverride?: AdPrice;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  badge?: string;
  bannerImageUrl?: string;
  bannerImageBase64?: string;
  bannerVideoUrl?: string;
  bannerMediaType?: AdMediaType;
};

export type AdCampaign = {
  id: string;
  name: string;
  description?: string;
  status: AdCampaignStatus;
  product: AdProductSummary | null;
  placements: AdPlacement[];
  schedule?: { startAt?: string; endAt?: string };
  frequencyCapPerDay: number;
  priority: number;
  creative?: AdCreative;
  activatedAt?: string;
  pausedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  schedule?: { startAt?: string; endAt?: string };
  frequencyCapPerDay?: number;
  priority?: number;
  creative?: AdCreative;
};

export type CampaignListResponse = {
  campaigns: AdCampaign[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
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

const BASE = "/ads/admin/campaigns";

// ── Service ───────────────────────────────────────────────────────────────────

const listCampaigns = (params?: { status?: AdCampaignStatus; search?: string; limit?: number; offset?: number }) =>
  httpClient.get<CampaignListResponse>(BASE, { params: toQuery(params as Record<string, unknown>) });

const getCampaign = (campaignId: string) =>
  httpClient.get<{ campaign: AdCampaign }>(`${BASE}/${campaignId}`).then((r) => r.campaign);

const createCampaign = (payload: UpsertAdCampaignInput) =>
  httpClient.post<{ campaign: AdCampaign }>(BASE, payload).then((r) => r.campaign);

const updateCampaign = (campaignId: string, payload: Partial<UpsertAdCampaignInput>) =>
  httpClient.patch<{ campaign: AdCampaign }>(`${BASE}/${campaignId}`, payload).then((r) => r.campaign);

const activateCampaign = (campaignId: string) =>
  httpClient.post<{ campaign: AdCampaign }>(`${BASE}/${campaignId}/activate`).then((r) => r.campaign);

const pauseCampaign = (campaignId: string) =>
  httpClient.post<{ campaign: AdCampaign }>(`${BASE}/${campaignId}/pause`).then((r) => r.campaign);

const stopCampaign = (campaignId: string) =>
  httpClient.patch<{ campaign: AdCampaign }>(`${BASE}/${campaignId}`, { status: "archived" }).then((r) => r.campaign);

const getInsights = (campaignId: string) =>
  httpClient.get<{ insights: AdInsights }>(`${BASE}/${campaignId}/insights`).then((r) => r.insights);

export const adService = {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  activateCampaign,
  pauseCampaign,
  stopCampaign,
  getInsights,
};
