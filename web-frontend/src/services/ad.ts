import { httpClient, QueryParams } from "../lib/http-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AdCampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";
export type AdPlacement = "dashboard_home" | "hero_banner" | "cart_cross_sell";
export type AdMediaType = "image" | "video";
export type AdTargetingMode = "any" | "all";
export type AdEventType = "impression" | "click" | "dismiss";
export type AdSource = "internal" | "external";
export type AdPrice = { amount?: number; currency?: string; unit?: string };

// A campaign either promotes an internal catalog `product` (adSource:
// "internal") OR links out to this third-party destination (adSource:
// "external") — never both. Category/subCategory are only used to satisfy
// the cart_cross_sell placement's match, since there's no real product.
export type AdExternal = {
  destinationUrl: string;
  advertiserName: string;
  /** `null` is an explicit "clear the saved logo" instruction on update; a fresh logo upload travels as a multipart file, never here. */
  advertiserLogoUrl?: string | null;
  category?: string;
  subCategory?: string;
};

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
  availableQuantity?: number;
  minStockQuantity?: number;
  images?: Array<{ url?: string; fileName?: string }>;
  company?: { id?: string; displayName?: string; complianceStatus?: string } | null;
};

export type AdCreative = {
  priceOverride?: AdPrice | null;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  badge?: string;
  /** `null` explicitly clears a saved value on update; a fresh upload travels as a multipart file, never here. */
  bannerImageUrl?: string | null;
  bannerVideoUrl?: string | null;
  bannerMediaType?: AdMediaType;
  bannerPosterUrl?: string | null;
};

export type AdCampaign = {
  id: string;
  name: string;
  description?: string;
  status: AdCampaignStatus;
  adSource: AdSource;
  product: AdProductSummary | null;
  external?: AdExternal;
  placements: AdPlacement[];
  targeting?: AdTargeting;
  schedule?: { startAt?: string; endAt?: string };
  frequencyCapPerDay: number;
  /** Minimum minutes between interstitial-popup showings, independent of frequencyCapPerDay. */
  popupCooldownMinutes: number;
  priority: number;
  creative?: AdCreative;
  /** Set when this campaign was created (or prefilled) from an approved "advertisement" service request. */
  sourceServiceRequest?: string;
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
  adSource?: AdSource;
  productId?: string;
  external?: AdExternal;
  placements?: AdPlacement[];
  targeting?: AdTargeting;
  schedule?: { startAt?: string; endAt?: string };
  frequencyCapPerDay?: number;
  popupCooldownMinutes?: number;
  priority?: number;
  creative?: AdCreative;
  /** Links this campaign to the approved "advertisement" service request it was created/prefilled from. */
  sourceServiceRequest?: string;
  metadata?: Record<string, unknown>;
};

export type CampaignListResponse = {
  campaigns: AdCampaign[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type CampaignFromRequestResponse = {
  prefill: UpsertAdCampaignInput;
  campaign?: AdCampaign;
  message?: string;
};

// ── User-facing feed (both logged-in and anonymous visitors) ───────────────────

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
  popupCooldownMinutes?: number;
  priceOverride?: AdPrice;
  pricing?: { listed?: AdPrice; advertised?: AdPrice; isDiscounted?: boolean };
  product: AdProductSummary | null;
  external?: Pick<AdExternal, "destinationUrl" | "advertiserName" | "advertiserLogoUrl">;
  bannerImageUrl?: string;
  bannerVideoUrl?: string;
  bannerPosterUrl?: string;
  bannerMediaType?: AdMediaType;
  endsAt?: string;
};

export type AdFeedParams = {
  placement?: AdPlacement;
  limit?: number;
  // Cross-sell: match the category + sub-category of a cart item.
  category?: string;
  subCategory?: string;
  excludeProductId?: string;
};

export type AdEventPayload = {
  campaignId: string;
  type: AdEventType;
  placement?: AdPlacement;
  sessionId?: string;
  metadata?: Record<string, unknown>;
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

// One optional File per media slot a campaign can carry. Every slot travels
// as a real multipart file now — none of them are read into a base64 string
// and embedded in the JSON body anymore (see useCampaignWizard.ts's
// useMediaSlot). Previously only `bannerVideo` did; banner image, poster,
// and advertiser logo were base64-in-JSON, which cost ~33% wire bloat on
// top of a main-thread FileReader encode, and could combine with the
// backend's 10mb JSON body limit to overflow on nothing more than a banner +
// poster in one request.
export type AdMediaFiles = {
  bannerImage?: File;
  bannerVideo?: File;
  bannerPoster?: File;
  advertiserLogo?: File;
};

// Long timeout for uploads — banner videos can be up to ~100MB.
const UPLOAD_TIMEOUT_MS = 120_000;

const hasAnyMediaFile = (files?: AdMediaFiles) =>
  !!files && (!!files.bannerImage || !!files.bannerVideo || !!files.bannerPoster || !!files.advertiserLogo);

// The campaign JSON payload plus whichever media files are present, as
// multipart form data. The backend (parseAdMultipart) JSON-parses `payload`
// and attaches each uploaded field as a raw buffer — no server-side base64
// round-trip either. Field names are shared with the app's FormData builder
// (ad.service.ts) so the backend needs no per-platform branching.
const buildMediaForm = (payload: UpsertAdCampaignInput, files: AdMediaFiles) => {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  if (files.bannerImage) form.append("bannerImage", files.bannerImage);
  if (files.bannerVideo) form.append("bannerVideo", files.bannerVideo);
  if (files.bannerPoster) form.append("bannerPoster", files.bannerPoster);
  if (files.advertiserLogo) form.append("advertiserLogo", files.advertiserLogo);
  return form;
};

// A pure text/field edit (no new media picked) still sends plain JSON — no
// gratuitous multipart overhead when there's nothing binary to send. The
// long upload timeout only applies once a file is actually attached.
const createCampaign = (payload: UpsertAdCampaignInput, files?: AdMediaFiles) =>
  hasAnyMediaFile(files)
    ? httpClient.post<{ campaign: AdCampaign }>(BASE, buildMediaForm(payload, files!), { timeoutMs: UPLOAD_TIMEOUT_MS }).then((r) => r.campaign)
    : httpClient.post<{ campaign: AdCampaign }>(BASE, payload).then((r) => r.campaign);

const updateCampaign = (campaignId: string, payload: Partial<UpsertAdCampaignInput>, files?: AdMediaFiles) =>
  hasAnyMediaFile(files)
    ? httpClient
        .patch<{ campaign: AdCampaign }>(`${BASE}/${campaignId}`, buildMediaForm(payload as UpsertAdCampaignInput, files!), { timeoutMs: UPLOAD_TIMEOUT_MS })
        .then((r) => r.campaign)
    : httpClient.patch<{ campaign: AdCampaign }>(`${BASE}/${campaignId}`, payload).then((r) => r.campaign);

const activateCampaign = (campaignId: string) =>
  httpClient.post<{ campaign: AdCampaign }>(`${BASE}/${campaignId}/activate`).then((r) => r.campaign);

const pauseCampaign = (campaignId: string) =>
  httpClient.post<{ campaign: AdCampaign }>(`${BASE}/${campaignId}/pause`).then((r) => r.campaign);

const stopCampaign = (campaignId: string) =>
  httpClient.patch<{ campaign: AdCampaign }>(`${BASE}/${campaignId}`, { status: "archived" }).then((r) => r.campaign);

// Prefills (or, with prefillOnly:false, directly creates) a campaign from an
// approved "advertisement" service request — mirrors the app's Ad Studio
// "Import from approved request" flow (AdStudioScreen.tsx applyRequestPrefill).
const createFromRequest = (serviceRequestId: string, payload?: { activate?: boolean; prefillOnly?: boolean }) =>
  httpClient.post<CampaignFromRequestResponse>(`${BASE}/from-request/${serviceRequestId}`, payload ?? {});

const getInsights = (campaignId: string, range?: { from?: string; to?: string }) =>
  httpClient
    .get<{ insights: AdInsights }>(`${BASE}/${campaignId}/insights`, { params: toQuery(range as Record<string, unknown>) })
    .then((r) => r.insights);

// Public feed + event logging — no auth required. httpClient sends the session
// cookie automatically when one exists, so a logged-in visitor gets a
// personalized/targeted feed while an anonymous one gets "Everyone" campaigns.
const getFeed = (params?: AdFeedParams) =>
  httpClient.get<{ placement: AdPlacement; cards: AdFeedCard[] }>("/ads/feed", { params: toQuery(params as Record<string, unknown>) });

const logEvent = (payload: AdEventPayload) =>
  httpClient.post<{ success: boolean; event: { id: string; campaignId: string; type: AdEventType; placement: AdPlacement; createdAt: string } }>(
    "/ads/events",
    payload
  );

export const adService = {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  activateCampaign,
  pauseCampaign,
  stopCampaign,
  createFromRequest,
  getInsights,
  getFeed,
  logEvent,
};
