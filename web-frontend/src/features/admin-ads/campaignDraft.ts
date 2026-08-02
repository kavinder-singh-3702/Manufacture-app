"use client";

/**
 * Local draft recovery for the "New campaign" wizard — mirrors the SSR-safe
 * isBrowser()/readJson()/writeJson() shape already used by
 * `src/features/ads/adFrequency.ts` for client-side ad state (those helpers
 * aren't exported from that module, so this is a small sibling copy rather
 * than a shared import).
 *
 * Create mode only — editing an existing campaign is never draft-restorable,
 * there's a real record on the server already. Never stores base64 or File
 * data: uploaded creative isn't part of the draft, and the resume banner
 * says so.
 */

const DRAFT_KEY = "arvann_adstudio_draft_v1";
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isBrowser = () => typeof window !== "undefined";

const readJson = <T,>(key: string): T | null => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort — private browsing / storage-full shouldn't break the wizard.
  }
};

// Every field here is a plain string/number/boolean/array — deliberately
// nothing that can't survive `JSON.stringify` losslessly, so this type
// doubles as the contract for what the draft can and can't restore.
export type CampaignDraftData = {
  adSource: "internal" | "external";
  productSource: "user_listings" | "admin_listings";
  ownerUserId: string;
  ownerUserName: string;
  productId: string;
  productName: string;
  destinationUrl: string;
  advertiserName: string;
  externalCategory: string;
  externalSubCategory: string;
  name: string;
  description: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  badge: string;
  useDiscount: boolean;
  discountAmount: string;
  mediaType: "image" | "video";
  bannerVideoUrl: string;
  audience: string;
  shopperCategories: string[];
  shopperSubCategories: string[];
  buyIntentCategories: string[];
  buyIntentSubCategories: string[];
  listedProductCategories: string[];
  listedProductSubCategories: string[];
  requireSameCategory: boolean;
  specificUserIds: string[];
  targetingMode: "any" | "all";
  lookbackDays: string;
  placements: string[];
  priority: number;
  freqCap: string;
  popupCooldown: string;
  startAt: string;
  endAt: string;
  publish: boolean;
  sourceRequestId: string;
};

export type CampaignDraft = { data: CampaignDraftData; savedAt: number };

export const readCampaignDraft = (): CampaignDraft | null => {
  const draft = readJson<CampaignDraft>(DRAFT_KEY);
  if (!draft || typeof draft.savedAt !== "number") return null;
  if (Date.now() - draft.savedAt > MAX_DRAFT_AGE_MS) return null;
  return draft;
};

export const writeCampaignDraft = (data: CampaignDraftData): void => {
  writeJson(DRAFT_KEY, { data, savedAt: Date.now() } satisfies CampaignDraft);
};

export const clearCampaignDraft = (): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Best-effort, same as writeJson.
  }
};
