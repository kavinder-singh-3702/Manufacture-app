import { httpClient, QueryParams } from "../lib/http-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AdCampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";
export type AdPlacement = "dashboard_home" | "hero_banner";
export type AdMediaType = "image" | "video";
export type AdTargetingMode = "any" | "all";
export type AdEventType = "impression" | "click" | "dismiss";
export type AdPrice = { amount?: number; currency?: string; unit?: string };

export type AdTargeting = {
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
  category?: string;
  subCategory?: string;
  price?: AdPrice;
  images?: Array<{ url?: string; fileName?: string }>;
  company?: { id?: string; displayName?: string } | null;
};

export type AdCreative = {
  priceOverride?: AdPrice | null;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  badge?: string;
  bannerImageUrl?: string;
  bannerImageBase64?: string;
  bannerVideoUrl?: string;
  bannerVideoBase64?: string;
  bannerMediaType?: AdMediaType;
  bannerPosterUrl?: string;
  bannerPosterBase64?: string;
};

export type AdCampaign = {
  id: string;
  name: string;
  description?: string;
  status: AdCampaignStatus;
  product: AdProductSummary | null;
  placements: AdPlacement[];
  targeting?: AdTargeting;
  schedule?: { startAt?: string; endAt?: string };
  frequencyCapPerDay: number;
  priority: number;
  creative?: AdCreative;
  activatedAt?: string;
  pausedAt?: string;
  archivedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdPlacementInsight = {
  placement: AdPlacement;
  impression: number;
  click: number;
  dismiss: number;
  ctr: number;
};

export type AdAttribution = {
  clickers: number;
  quotes: number;
  inquiries: number;
  orders: number;
  leads: number;
  clickToLeadRate: number;
};

export type AdInsights = {
  campaignId: string;
  status: AdCampaignStatus;
  range?: { from?: string | null; to?: string | null };
  summary: Record<AdEventType, { count: number; uniqueUsers: number }>;
  ctr: number;
  dismissRate?: number;
  byPlacement?: AdPlacementInsight[];
  attribution?: AdAttribution;
  byDay: Array<{ day: string; type: AdEventType; count: number }>;
};

export type UpsertAdCampaignInput = {
  name: string;
  description?: string;
  status?: AdCampaignStatus;
  productId: string;
  placements?: AdPlacement[];
  targeting?: AdTargeting;
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

// Long timeout for uploads — banner videos can be up to ~100MB.
const UPLOAD_TIMEOUT_MS = 120_000;

// Multipart variants: send the JSON campaign payload alongside a banner video
// file. The backend (parseAdMultipart) JSON-parses `payload` and stores the
// uploaded `bannerVideo` as the campaign's video creative.
const buildMediaForm = (payload: UpsertAdCampaignInput, video: File) => {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  form.append("bannerVideo", video);
  return form;
};

const createCampaignWithMedia = (payload: UpsertAdCampaignInput, video: File) =>
  httpClient
    .post<{ campaign: AdCampaign }>(BASE, buildMediaForm(payload, video), { timeoutMs: UPLOAD_TIMEOUT_MS })
    .then((r) => r.campaign);

const updateCampaignWithMedia = (campaignId: string, payload: Partial<UpsertAdCampaignInput>, video: File) =>
  httpClient
    .patch<{ campaign: AdCampaign }>(`${BASE}/${campaignId}`, buildMediaForm(payload as UpsertAdCampaignInput, video), {
      timeoutMs: UPLOAD_TIMEOUT_MS,
    })
    .then((r) => r.campaign);

const activateCampaign = (campaignId: string) =>
  httpClient.post<{ campaign: AdCampaign }>(`${BASE}/${campaignId}/activate`).then((r) => r.campaign);

const pauseCampaign = (campaignId: string) =>
  httpClient.post<{ campaign: AdCampaign }>(`${BASE}/${campaignId}/pause`).then((r) => r.campaign);

const stopCampaign = (campaignId: string) =>
  httpClient.patch<{ campaign: AdCampaign }>(`${BASE}/${campaignId}`, { status: "archived" }).then((r) => r.campaign);

const getInsights = (campaignId: string, range?: { from?: string; to?: string }) =>
  httpClient
    .get<{ insights: AdInsights }>(`${BASE}/${campaignId}/insights`, { params: toQuery(range as Record<string, unknown>) })
    .then((r) => r.insights);

export const adService = {
  listCampaigns,
  getCampaign,
  createCampaign,
  createCampaignWithMedia,
  updateCampaign,
  updateCampaignWithMedia,
  activateCampaign,
  pauseCampaign,
  stopCampaign,
  getInsights,
};
