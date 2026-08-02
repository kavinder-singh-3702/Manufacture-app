"use client";

/**
 * Owns every bit of state for the campaign wizard (CampaignDrawer.tsx) — field
 * values, per-step validation, dirty-tracking, step navigation, and the
 * create/update payload builder — so CampaignDrawer itself can stay a thin
 * layout + step-composition shell instead of the ~800-line state+JSX blob it
 * used to be.
 *
 * Step grouping/shape mirrors the mobile app's Ad Studio wizard
 * (app-frontend/src/screens/admin/AdStudioScreen.tsx `WizardState` /
 * `stepLabels`) so both surfaces model campaigns the same way. `bannerVideoUrl`
 * (paste a hosted URL) is a deliberate web-only addition on top of the app's
 * fields — kept because it lets an admin skip a slow re-upload when a video is
 * already hosted somewhere.
 *
 * All four media kinds (banner image, banner video, poster, advertiser logo)
 * go through `useMediaSlot` — File + `URL.createObjectURL`, never base64/
 * `FileReader` — and travel to the backend as real multipart files
 * (`adService.createCampaign`/`updateCampaign`'s `AdMediaFiles` param), not
 * embedded in the JSON body. See useMediaSlot.ts and src/services/ad.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adService,
  AdCampaign,
  AdMediaType,
  AdPlacement,
  AdSource,
  AdTargetingMode,
  UpsertAdCampaignInput,
} from "@/src/services/ad";
import { adminService, type AdminUser } from "@/src/services/admin";
import { productService } from "@/src/services/product";
import type { Product } from "@/src/types/product";
import { ApiError } from "@/src/lib/api-error";
import { useMediaSlot } from "./useMediaSlot";
import { readCampaignDraft, writeCampaignDraft, clearCampaignDraft, type CampaignDraftData } from "./campaignDraft";

export type ProductSourceMode = "user_listings" | "admin_listings";
export type AudiencePreset = "everyone" | "specific_users" | "shopper_category" | "buy_intent" | "same_category_listers";

export const STEPS = ["Source & Owner", "Select Product", "Audience", "Creative", "Schedule & Launch"] as const;

export const AUDIENCE_PRESETS: { key: AudiencePreset; label: string; hint: string; icon: string }[] = [
  { key: "everyone",               label: "Everyone",             hint: "Show to all eligible users",                 icon: "🌐" },
  { key: "specific_users",         label: "Specific users",       hint: "Hand-pick exactly who sees this ad",          icon: "🎯" },
  { key: "shopper_category",       label: "Browsed a category",   hint: "Users recently viewing chosen categories",   icon: "👀" },
  { key: "buy_intent",             label: "Buying signal",        hint: "Added-to-cart / accepted quotes in category", icon: "🛒" },
  { key: "same_category_listers",  label: "Same-category sellers", hint: "Users who list in this product's category",  icon: "🏭" },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches backend MAX_AD_IMAGE_SIZE_BYTES (storage.service.js)
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // matches backend MAX_AD_VIDEO_SIZE_BYTES

const isoToLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const localInputToIso = (val: string) => (val ? new Date(val).toISOString() : undefined);

const inferAudiencePreset = (t?: AdCampaign["targeting"]): AudiencePreset => {
  if (!t) return "everyone";
  if ((t.userIds?.length ?? 0) > 0) return "specific_users";
  if (t.requireListedProductInSameCategory) return "same_category_listers";
  if ((t.buyIntentCategories?.length ?? 0) > 0 || (t.buyIntentSubCategories?.length ?? 0) > 0) return "buy_intent";
  if ((t.shopperCategories?.length ?? 0) > 0 || (t.shopperSubCategories?.length ?? 0) > 0) return "shopper_category";
  return "everyone";
};

const isValidHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export type UseCampaignWizardOptions = {
  campaign?: AdCampaign | null;
  onSaved: (campaign: AdCampaign) => void;
};

export function useCampaignWizard({ campaign, onSaved }: UseCampaignWizardOptions) {
  const isEdit = !!campaign;

  // ── Source & Owner ────────────────────────────────────────────────────────
  const [adSource, setAdSource] = useState<AdSource>(campaign?.adSource ?? "internal");
  // Edit mode skips owner selection for an already-chosen product — same
  // shortcut the app takes (AdStudioScreen.tsx beginEditCampaign) — the
  // product list step still lets the admin pick a different product from the
  // full admin-visible pool.
  const [productSource, setProductSource] = useState<ProductSourceMode>(isEdit ? "admin_listings" : "user_listings");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [ownerUserName, setOwnerUserName] = useState("");
  const [sourceRequestId, setSourceRequestId] = useState("");

  const [destinationUrl, setDestinationUrl] = useState(campaign?.external?.destinationUrl ?? "");
  const [advertiserName, setAdvertiserName] = useState(campaign?.external?.advertiserName ?? "");
  const [externalCategory, setExternalCategory] = useState(campaign?.external?.category ?? "");
  const [externalSubCategory, setExternalSubCategory] = useState(campaign?.external?.subCategory ?? "");

  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");

  const [error, setError] = useState<string | null>(null);
  const surfaceError = useCallback((message: string) => setError(message), []);

  const advertiserLogo = useMediaSlot({ initialUrl: campaign?.external?.advertiserLogoUrl ?? null, maxBytes: MAX_IMAGE_BYTES, onError: surfaceError });

  // ── Select Product ───────────────────────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null);

  // ── Creative ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(campaign?.creative?.title ?? "");
  const [subtitle, setSubtitle] = useState(campaign?.creative?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(campaign?.creative?.ctaLabel ?? "");
  const [badge, setBadge] = useState(campaign?.creative?.badge ?? "");
  const [mediaType, setMediaType] = useState<AdMediaType>(campaign?.creative?.bannerMediaType === "video" ? "video" : "image");
  const originalMediaType = campaign?.creative?.bannerMediaType;

  const bannerImage = useMediaSlot({ initialUrl: campaign?.creative?.bannerImageUrl ?? null, maxBytes: MAX_IMAGE_BYTES, onError: surfaceError });
  const bannerVideo = useMediaSlot({ initialUrl: campaign?.creative?.bannerVideoUrl ?? null, maxBytes: MAX_VIDEO_BYTES, onError: surfaceError });
  const bannerPoster = useMediaSlot({ initialUrl: campaign?.creative?.bannerPosterUrl ?? null, maxBytes: MAX_IMAGE_BYTES, onError: surfaceError });
  const [bannerVideoUrl, setBannerVideoUrl] = useState(campaign?.creative?.bannerVideoUrl ?? "");
  const [aspectWarning, setAspectWarning] = useState<string | null>(null);

  // Aspect-ratio hint for the banner image — the hero crops to ~16:9, so a
  // near-square/tall upload gets cropped hard. Recomputed whenever the
  // preview (a fresh pick or the existing remote image) changes.
  useEffect(() => {
    if (mediaType !== "image" || !bannerImage.preview) { setAspectWarning(null); return; }
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      const ratio = img.width / img.height;
      setAspectWarning(ratio < 1.3 || ratio > 2.4
        ? `Banner is ${img.width}×${img.height} (${ratio.toFixed(2)}:1). The hero crops to ~16:9 — use a wide image to avoid cropping.`
        : null);
    };
    img.src = bannerImage.preview;
    return () => { active = false; };
  }, [mediaType, bannerImage.preview]);

  const [useDiscount, setUseDiscount] = useState(!!campaign?.creative?.priceOverride?.amount);
  const [discountAmount, setDiscountAmount] = useState(
    campaign?.creative?.priceOverride?.amount != null ? String(campaign.creative.priceOverride.amount) : "",
  );
  const [placements, setPlacements] = useState<AdPlacement[]>(campaign?.placements ?? ["dashboard_home"]);

  // ── Audience ──────────────────────────────────────────────────────────────
  const [audience, setAudienceRaw] = useState<AudiencePreset>(inferAudiencePreset(campaign?.targeting));
  const [shopperCategories, setShopperCategories] = useState<string[]>(campaign?.targeting?.shopperCategories ?? []);
  const [shopperSubCategories, setShopperSubCategories] = useState<string[]>(campaign?.targeting?.shopperSubCategories ?? []);
  const [buyIntentCategories, setBuyIntentCategories] = useState<string[]>(campaign?.targeting?.buyIntentCategories ?? []);
  const [buyIntentSubCategories, setBuyIntentSubCategories] = useState<string[]>(campaign?.targeting?.buyIntentSubCategories ?? []);
  const [listedProductCategories, setListedProductCategories] = useState<string[]>(campaign?.targeting?.listedProductCategories ?? []);
  const [listedProductSubCategories, setListedProductSubCategories] = useState<string[]>(campaign?.targeting?.listedProductSubCategories ?? []);
  const [requireSameCategory, setRequireSameCategory] = useState(!!campaign?.targeting?.requireListedProductInSameCategory);
  const [specificUsers, setSpecificUsers] = useState<AdminUser[]>([]);
  const [specificUserIds, setSpecificUserIds] = useState<string[]>(campaign?.targeting?.userIds ?? []);
  const [targetingMode, setTargetingMode] = useState<AdTargetingMode>(campaign?.targeting?.mode ?? "any");
  const [lookbackDays, setLookbackDays] = useState(String(campaign?.targeting?.lookbackDays ?? 60));
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Switching preset resets whatever fields the *other* presets own, mirroring
  // the app's setAudiencePreset (AdStudioScreen.tsx) — picking "Everyone" after
  // targeting three categories shouldn't leave those categories silently armed
  // in the payload.
  const setAudience = useCallback((preset: AudiencePreset) => {
    setAudienceRaw(preset);
    if (preset !== "specific_users") setSpecificUserIds([]);
    if (preset !== "shopper_category") { setShopperCategories([]); setShopperSubCategories([]); }
    if (preset !== "buy_intent") { setBuyIntentCategories([]); setBuyIntentSubCategories([]); }
    setRequireSameCategory(preset === "same_category_listers");
  }, []);

  // ── Schedule & Launch ─────────────────────────────────────────────────────
  const [priority, setPriority] = useState(campaign?.priority ?? 50);
  const [freqCap, setFreqCap] = useState(String(campaign?.frequencyCapPerDay ?? 3));
  const [popupCooldown, setPopupCooldown] = useState(String(campaign?.popupCooldownMinutes ?? 60));
  const [startAt, setStartAt] = useState(isoToLocalInput(campaign?.schedule?.startAt));
  const [endAt, setEndAt] = useState(isoToLocalInput(campaign?.schedule?.endAt));
  // Whether editing this campaign's status via the wizard is even meaningful —
  // only draft/active model a binary "is it live" choice; paused/completed/
  // archived campaigns keep their lifecycle owned by the Activate/Pause/Archive
  // buttons on the campaign card, same as before this rewrite.
  const editableStatus = !isEdit || campaign?.status === "draft" || campaign?.status === "active";
  const [publish, setPublish] = useState(isEdit ? campaign?.status === "active" : true);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [maxStep, setMaxStep] = useState(isEdit ? STEPS.length - 1 : 0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // ── Derived product/pricing display ──────────────────────────────────────
  const productId = product?._id ?? campaign?.product?.id ?? "";
  const listedPrice = product ? product.price.amount : campaign?.product?.price?.amount;
  const productCurrency = (product ? product.price.currency : campaign?.product?.price?.currency) ?? "INR";
  const productDisplay = product
    ? { name: product.name, image: product.images?.[0]?.url, price: product.price.amount }
    : campaign?.product
      ? { name: campaign.product.name ?? "Product", image: campaign.product.images?.[0]?.url, price: campaign.product.price?.amount }
      : null;

  const wantsCrossSell = placements.includes("cart_cross_sell");
  const hasBanner = mediaType === "image"
    ? bannerImage.hasMedia
    : Boolean(bannerVideo.hasMedia || bannerVideoUrl.trim());

  // Sets the product + backfills productSource/owner from its ownership —
  // used when a product arrives from a source other than the Select Product
  // list (e.g. hydrating a prefill from an approved service request, or a
  // resumed local draft), so the Source & Owner step stays consistent with
  // whatever got selected.
  const applyProductOwnershipContext = useCallback((p: Product) => {
    setProduct(p);
    const isAdminOwned = p.createdByRole === "admin";
    setProductSource(isAdminOwned ? "admin_listings" : "user_listings");
    if (!isAdminOwned && p.createdBy) setOwnerUserId(p.createdBy);
  }, []);

  // Hydrate the owner's display name once an id is known but the name isn't
  // (e.g. backfilled from applyProductOwnershipContext, which only has an id).
  useEffect(() => {
    if (!ownerUserId || ownerUserName) return;
    let active = true;
    adminService.getUserOverview(ownerUserId).then((o) => {
      if (active && o.user) setOwnerUserName(o.user.displayName || o.user.email);
    }).catch(() => {});
    return () => { active = false; };
  }, [ownerUserId, ownerUserName]);

  // Edit mode: hydrate display names for already-targeted users so chips don't show raw ids.
  useEffect(() => {
    const missing = specificUserIds.filter((id) => !specificUsers.some((u) => u.id === id));
    if (!missing.length) return;
    let active = true;
    (async () => {
      const loaded = await Promise.all(
        missing.map((id) => adminService.getUserOverview(id).then((o) => o.user).catch(() => null)),
      );
      if (active) {
        const found = loaded.filter((u): u is AdminUser => !!u);
        if (found.length) setSpecificUsers((prev) => [...prev, ...found.filter((u) => !prev.some((p) => p.id === u.id))]);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlacement = useCallback((p: AdPlacement) =>
    setPlacements((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])), []);

  const toggleInList = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  // ── Prefill from an approved service request ─────────────────────────────
  // Maps the backend's UpsertAdCampaignInput-shaped prefill onto wizard
  // fields — mirrors AdStudioScreen.tsx mapPrefillToWizard.
  const applyPrefill = useCallback((prefill: UpsertAdCampaignInput) => {
    if (prefill.name) setName(prefill.name);
    if (prefill.description) setDescription(prefill.description);
    const t = prefill.targeting;
    if (t) {
      setAudienceRaw(inferAudiencePreset(t as AdCampaign["targeting"]));
      setTargetingMode(t.mode ?? "any");
      setSpecificUserIds(t.userIds ?? []);
      setShopperCategories(t.shopperCategories ?? []);
      setShopperSubCategories(t.shopperSubCategories ?? []);
      setBuyIntentCategories(t.buyIntentCategories ?? []);
      setBuyIntentSubCategories(t.buyIntentSubCategories ?? []);
      setListedProductCategories(t.listedProductCategories ?? []);
      setListedProductSubCategories(t.listedProductSubCategories ?? []);
      setRequireSameCategory(!!t.requireListedProductInSameCategory);
      setLookbackDays(String(t.lookbackDays ?? 60));
    }
    if (prefill.schedule) {
      setStartAt(isoToLocalInput(typeof prefill.schedule.startAt === "string" ? prefill.schedule.startAt : undefined));
      setEndAt(isoToLocalInput(typeof prefill.schedule.endAt === "string" ? prefill.schedule.endAt : undefined));
    }
    if (prefill.frequencyCapPerDay != null) setFreqCap(String(prefill.frequencyCapPerDay));
    if (prefill.popupCooldownMinutes != null) setPopupCooldown(String(prefill.popupCooldownMinutes));
    if (prefill.priority != null) setPriority(prefill.priority);
    const c = prefill.creative;
    if (c) {
      if (c.title) setTitle(c.title);
      if (c.subtitle) setSubtitle(c.subtitle);
      if (c.ctaLabel) setCtaLabel(c.ctaLabel);
      if (c.badge) setBadge(c.badge);
      if (c.priceOverride?.amount) { setUseDiscount(true); setDiscountAmount(String(c.priceOverride.amount)); }
    }
    if (prefill.placements?.length) setPlacements(prefill.placements);
    setSourceRequestId(prefill.sourceServiceRequest ?? "");
  }, []);

  // ── Local draft recovery (create mode only) ──────────────────────────────
  // Debounced snapshot of every *serializable* field (never media — see
  // campaignDraft.ts) so a half-built campaign survives an accidental close,
  // refresh, or a mobile browser tab getting evicted in the background.
  const draftSnapshot = useCallback((): CampaignDraftData => ({
    adSource, productSource, ownerUserId, ownerUserName,
    productId, productName: productDisplay?.name ?? "",
    destinationUrl, advertiserName, externalCategory, externalSubCategory,
    name, description, title, subtitle, ctaLabel, badge, useDiscount, discountAmount,
    mediaType, bannerVideoUrl,
    audience, shopperCategories, shopperSubCategories, buyIntentCategories, buyIntentSubCategories,
    listedProductCategories, listedProductSubCategories, requireSameCategory, specificUserIds,
    targetingMode, lookbackDays, placements, priority, freqCap, popupCooldown, startAt, endAt,
    publish, sourceRequestId,
  }), [
    adSource, productSource, ownerUserId, ownerUserName, productId, productDisplay?.name,
    destinationUrl, advertiserName, externalCategory, externalSubCategory,
    name, description, title, subtitle, ctaLabel, badge, useDiscount, discountAmount,
    mediaType, bannerVideoUrl,
    audience, shopperCategories, shopperSubCategories, buyIntentCategories, buyIntentSubCategories,
    listedProductCategories, listedProductSubCategories, requireSameCategory, specificUserIds,
    targetingMode, lookbackDays, placements, priority, freqCap, popupCooldown, startAt, endAt,
    publish, sourceRequestId,
  ]);

  const [draftAvailable, setDraftAvailable] = useState(() => (!isEdit ? !!readCampaignDraft() : false));

  const applyDraftData = useCallback(async (data: CampaignDraftData) => {
    setAdSource(data.adSource);
    setProductSource(data.productSource);
    setOwnerUserId(data.ownerUserId);
    setOwnerUserName(data.ownerUserName);
    setDestinationUrl(data.destinationUrl);
    setAdvertiserName(data.advertiserName);
    setExternalCategory(data.externalCategory);
    setExternalSubCategory(data.externalSubCategory);
    setName(data.name);
    setDescription(data.description);
    setTitle(data.title);
    setSubtitle(data.subtitle);
    setCtaLabel(data.ctaLabel);
    setBadge(data.badge);
    setUseDiscount(data.useDiscount);
    setDiscountAmount(data.discountAmount);
    setMediaType(data.mediaType);
    setBannerVideoUrl(data.bannerVideoUrl);
    setAudienceRaw(data.audience as AudiencePreset);
    setShopperCategories(data.shopperCategories);
    setShopperSubCategories(data.shopperSubCategories);
    setBuyIntentCategories(data.buyIntentCategories);
    setBuyIntentSubCategories(data.buyIntentSubCategories);
    setListedProductCategories(data.listedProductCategories);
    setListedProductSubCategories(data.listedProductSubCategories);
    setRequireSameCategory(data.requireSameCategory);
    setSpecificUserIds(data.specificUserIds);
    setTargetingMode(data.targetingMode as AdTargetingMode);
    setLookbackDays(data.lookbackDays);
    setPlacements(data.placements as AdPlacement[]);
    setPriority(data.priority);
    setFreqCap(data.freqCap);
    setPopupCooldown(data.popupCooldown);
    setStartAt(data.startAt);
    setEndAt(data.endAt);
    setPublish(data.publish);
    setSourceRequestId(data.sourceRequestId);
    setDraftAvailable(false);

    if (data.productId) {
      try {
        const p = await productService.get(data.productId, { scope: "marketplace" });
        applyProductOwnershipContext(p);
      } catch {
        // Best-effort — everything else from the draft still applied.
      }
    }
  }, [applyProductOwnershipContext]);

  // Public surface for the "Resume your unsaved campaign?" banner
  // (CampaignDrawer.tsx) — reads the stored draft itself so the caller
  // doesn't need to juggle the raw data.
  const resumeDraft = useCallback(() => {
    const draft = readCampaignDraft();
    if (draft) void applyDraftData(draft.data);
  }, [applyDraftData]);

  const dismissDraft = useCallback(() => { clearCampaignDraft(); setDraftAvailable(false); }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const discountError = useMemo(() => {
    if (adSource !== "internal" || !useDiscount) return null;
    const amt = Number(discountAmount);
    if (!Number.isFinite(amt) || amt <= 0) return "Discounted price must be greater than 0.";
    if (listedPrice != null && amt > listedPrice) return "Discounted price can't exceed the listed price.";
    return null;
  }, [adSource, useDiscount, discountAmount, listedPrice]);

  const scheduleError = useMemo(() => {
    if (startAt && Number.isNaN(new Date(startAt).getTime())) return "Start date is invalid.";
    if (endAt && Number.isNaN(new Date(endAt).getTime())) return "End date is invalid.";
    if (startAt && endAt && new Date(startAt).getTime() > new Date(endAt).getTime()) return "End date must be after start date.";
    return null;
  }, [startAt, endAt]);

  const stepErrors: (string | null)[] = useMemo(() => [
    // 0. Source & Owner
    !name.trim() ? "Give the campaign an internal name."
      : adSource === "external" && !destinationUrl.trim() ? "Enter the destination URL."
      : adSource === "external" && !isValidHttpsUrl(destinationUrl.trim()) ? "Destination URL must start with https://."
      : adSource === "external" && !advertiserName.trim() ? "Enter the advertiser name."
      : adSource === "internal" && productSource === "user_listings" && !ownerUserId.trim() ? "Select an owner user for user listings."
      : null,
    // 1. Select Product
    adSource === "internal" && !productId ? "Select a product to promote." : null,
    // 2. Audience
    audience === "specific_users" && !specificUserIds.length ? "Pick at least one user to target."
      : audience === "shopper_category" && !shopperCategories.length && !shopperSubCategories.length ? "Choose at least one shopper category or sub-category."
      : audience === "buy_intent" && !buyIntentCategories.length && !buyIntentSubCategories.length ? "Choose at least one buying-signal category or sub-category."
      : null,
    // 3. Creative
    !placements.length ? "Pick at least one placement."
      : adSource === "external" && !hasBanner ? "External ads need a banner image or video."
      : adSource === "external" && wantsCrossSell && (!externalCategory || !externalSubCategory) ? "Cart cross-sell needs a category + sub-category to match against."
      : discountError,
    // 4. Schedule & Launch
    scheduleError,
  ], [
    name, adSource, destinationUrl, advertiserName, productSource, ownerUserId, productId,
    audience, specificUserIds, shopperCategories, shopperSubCategories, buyIntentCategories, buyIntentSubCategories,
    placements, hasBanner, wantsCrossSell, externalCategory, externalSubCategory, discountError, scheduleError,
  ]);
  const validationError = stepErrors.find(Boolean) ?? null;
  const canSave = !validationError;
  const stepError = stepErrors[step];
  // Whether a "Save as draft" quick-action is safe to offer from the close
  // dialog without navigating the admin through every step — only Source &
  // Owner and Select Product carry fields a draft can't be saved without;
  // Audience/Creative/Schedule all have workable defaults.
  const canSaveAsDraft = !stepErrors[0] && !stepErrors[1];

  // ── Step navigation ───────────────────────────────────────────────────────
  // Stamped whenever the wizard *arrives* at the last step — submit() uses
  // this as a short arm-guard window so a ghost click that lands right after
  // a Continue tap (iOS's ~350ms double-tap-to-zoom delay retyping the same
  // button node from Continue to Publish — see CampaignDrawer.tsx) can't
  // immediately re-trigger a submit. Belt-and-braces on top of the button
  // key/type fixes, for hardware this couldn't be tested against directly.
  const lastStepArmedAtRef = useRef(0);
  useEffect(() => {
    if (step === STEPS.length - 1) lastStepArmedAtRef.current = Date.now();
  }, [step]);

  const goNext = () => {
    if (stepError) { setError(stepError); return; }
    setError(null);
    setDirection(1);
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n);
    setMaxStep((m) => Math.max(m, n));
  };
  const goBack = () => { setError(null); setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };
  const jumpToStep = (i: number) => { setDirection(i > step ? 1 : -1); setError(null); setStep(i); };

  // ── Dirty tracking ────────────────────────────────────────────────────────
  // Anything a blank/prefilled form doesn't already have counts as dirty —
  // compared against a snapshot captured once, at mount, from the campaign
  // (edit) or blank defaults (create). New media picks are checked separately
  // since a File isn't meaningfully diffable against a URL.
  const comparable = () => JSON.stringify(draftSnapshot());
  const initialSnapshotRef = useRef<string | null>(null);
  if (initialSnapshotRef.current === null) initialSnapshotRef.current = comparable();
  const hasNewMedia = !!(bannerImage.file || bannerVideo.file || bannerPoster.file || advertiserLogo.file);
  const hasClearedMedia = bannerImage.cleared || bannerVideo.cleared || bannerPoster.cleared || advertiserLogo.cleared;
  const isDirty = hasNewMedia || hasClearedMedia || comparable() !== initialSnapshotRef.current;

  // Debounced local draft write — create mode only. Deliberately excludes
  // File/objectURL data (see campaignDraft.ts); a resumed draft never
  // restores uploaded media, only the fields typed/picked around it.
  useEffect(() => {
    if (isEdit || !isDirty) return;
    const t = setTimeout(() => writeCampaignDraft(draftSnapshot()), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, isDirty, draftSnapshot]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = useCallback(async (opts?: { statusOverride?: "draft" }) => {
    // Re-validate every step, not just the current one — jumping directly to
    // a later step (StepRail) could otherwise post an incomplete payload.
    // Mirrors AdStudioScreen.tsx submitCampaign's belt-and-braces re-check.
    // Skipped for the "Save as draft" quick action from the close dialog,
    // which only requires canSaveAsDraft (checked by the caller before this
    // is even invoked) — later steps' defaults are fine for a draft.
    if (!opts?.statusOverride) {
      if (!canSave) {
        const bad = stepErrors.findIndex(Boolean);
        if (bad >= 0) jumpToStep(bad);
        setError(validationError);
        return;
      }
      if (step === STEPS.length - 1 && Date.now() - lastStepArmedAtRef.current < 400) return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const schedule = startAt || endAt
        ? { startAt: localInputToIso(startAt), endAt: localInputToIso(endAt) }
        : undefined;

      const targeting: UpsertAdCampaignInput["targeting"] = {
        mode: targetingMode,
        userIds: audience === "specific_users" ? specificUserIds : [],
        shopperCategories: audience === "shopper_category" ? shopperCategories : [],
        shopperSubCategories: audience === "shopper_category" ? shopperSubCategories : [],
        buyIntentCategories: audience === "buy_intent" ? buyIntentCategories : [],
        buyIntentSubCategories: audience === "buy_intent" ? buyIntentSubCategories : [],
        listedProductCategories,
        listedProductSubCategories,
        requireListedProductInSameCategory: audience === "same_category_listers" || requireSameCategory,
        lookbackDays: Math.min(Math.max(parseInt(lookbackDays, 10) || 60, 1), 365),
      };

      // Media: only ever a media-type hint + explicit `null`s for anything
      // abandoned. The actual bytes travel as multipart files (`mediaFiles`
      // below), never base64 in this JSON.
      const bannerMedia: Partial<NonNullable<UpsertAdCampaignInput["creative"]>> = {};
      const switchedMediaType = isEdit && !!originalMediaType && originalMediaType !== mediaType;
      if (mediaType === "image") {
        if (bannerImage.file) bannerMedia.bannerMediaType = "image";
        else if (bannerImage.cleared) { bannerMedia.bannerMediaType = "image"; bannerMedia.bannerImageUrl = null; }
        if (switchedMediaType) { bannerMedia.bannerMediaType = "image"; bannerMedia.bannerVideoUrl = null; bannerMedia.bannerPosterUrl = null; }
      } else {
        if (bannerVideo.file) bannerMedia.bannerMediaType = "video";
        else if (bannerVideoUrl.trim()) { bannerMedia.bannerMediaType = "video"; bannerMedia.bannerVideoUrl = bannerVideoUrl.trim(); }
        else if (bannerVideo.cleared) { bannerMedia.bannerMediaType = "video"; bannerMedia.bannerVideoUrl = null; }
        if (bannerPoster.cleared && !bannerPoster.file) bannerMedia.bannerPosterUrl = null;
        if (switchedMediaType) { bannerMedia.bannerMediaType = "video"; bannerMedia.bannerImageUrl = null; }
      }

      const creative: UpsertAdCampaignInput["creative"] = {
        title: title.trim() || (adSource === "internal" ? productDisplay?.name : advertiserName.trim()) || undefined,
        subtitle: subtitle.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
        badge: badge.trim() || undefined,
        priceOverride: adSource === "internal" && useDiscount && Number(discountAmount) > 0
          ? { amount: Number(discountAmount), currency: productCurrency }
          : null,
        ...bannerMedia,
      };

      const statusForSubmit = opts?.statusOverride
        ? "draft"
        : !isEdit || editableStatus ? (publish ? "active" : "draft") : undefined;

      const payload: UpsertAdCampaignInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        adSource,
        ...(adSource === "internal"
          ? { productId }
          : {
            external: {
              destinationUrl: destinationUrl.trim(),
              advertiserName: advertiserName.trim(),
              category: wantsCrossSell ? externalCategory : undefined,
              subCategory: wantsCrossSell ? externalSubCategory : undefined,
              ...(advertiserLogo.cleared && !advertiserLogo.file ? { advertiserLogoUrl: null } : {}),
            },
          }),
        placements,
        targeting,
        priority,
        frequencyCapPerDay: parseInt(freqCap, 10) || 3,
        popupCooldownMinutes: parseInt(popupCooldown, 10) || 60,
        ...(schedule ? { schedule } : {}),
        creative,
        ...(sourceRequestId ? { sourceServiceRequest: sourceRequestId } : {}),
        ...(statusForSubmit ? { status: statusForSubmit } : {}),
      };

      const mediaFiles = {
        ...(mediaType === "image" && bannerImage.file ? { bannerImage: bannerImage.file } : {}),
        ...(mediaType === "video" && bannerVideo.file ? { bannerVideo: bannerVideo.file } : {}),
        ...(mediaType === "video" && bannerPoster.file ? { bannerPoster: bannerPoster.file } : {}),
        ...(adSource === "external" && advertiserLogo.file ? { advertiserLogo: advertiserLogo.file } : {}),
      };

      const saved = isEdit && campaign
        ? await adService.updateCampaign(campaign.id, payload, mediaFiles)
        : await adService.createCampaign(payload, mediaFiles);

      clearCampaignDraft();
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} campaign`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canSave, stepErrors, validationError, step, startAt, endAt, targetingMode, audience, specificUserIds,
    shopperCategories, shopperSubCategories, buyIntentCategories, buyIntentSubCategories,
    listedProductCategories, listedProductSubCategories, requireSameCategory, lookbackDays,
    mediaType, bannerImage.file, bannerImage.cleared, bannerVideo.file, bannerVideo.cleared, bannerVideoUrl,
    bannerPoster.file, bannerPoster.cleared, advertiserLogo.file, advertiserLogo.cleared, originalMediaType,
    title, subtitle, ctaLabel, badge, useDiscount, discountAmount, productCurrency, productDisplay,
    isEdit, editableStatus, publish, name, description, adSource, productId, destinationUrl, advertiserName,
    wantsCrossSell, externalCategory, externalSubCategory, placements, priority, freqCap, popupCooldown,
    sourceRequestId, campaign, onSaved,
  ]);

  // Thin wrapper for the `<form onSubmit>` — belt-and-braces in case any
  // future control ends up a submit button; the wizard's own Continue/
  // Publish buttons call `submit()` directly (see CampaignDrawer.tsx).
  const handleFormSubmit = (e: React.FormEvent) => { e.preventDefault(); void submit(); };

  return {
    isEdit, campaign,
    // Source & Owner
    adSource, setAdSource, productSource, setProductSource, ownerUserId, setOwnerUserId, ownerUserName, setOwnerUserName,
    sourceRequestId, setSourceRequestId, applyPrefill, applyProductOwnershipContext,
    destinationUrl, setDestinationUrl, advertiserName, setAdvertiserName,
    advertiserLogo,
    externalCategory, setExternalCategory, externalSubCategory, setExternalSubCategory,
    name, setName, description, setDescription,
    // Product
    product, setProduct, productId, listedPrice, productCurrency, productDisplay,
    // Creative
    title, setTitle, subtitle, setSubtitle, ctaLabel, setCtaLabel, badge, setBadge,
    mediaType, setMediaType, bannerImage, bannerVideo, bannerPoster,
    bannerVideoUrl, setBannerVideoUrl,
    aspectWarning,
    useDiscount, setUseDiscount, discountAmount, setDiscountAmount, hasBanner,
    placements, togglePlacement, wantsCrossSell,
    // Audience
    audience, setAudience, shopperCategories, setShopperCategories, shopperSubCategories, setShopperSubCategories,
    buyIntentCategories, setBuyIntentCategories, buyIntentSubCategories, setBuyIntentSubCategories,
    listedProductCategories, setListedProductCategories, listedProductSubCategories, setListedProductSubCategories,
    requireSameCategory, setRequireSameCategory,
    specificUsers, setSpecificUsers, specificUserIds, setSpecificUserIds,
    targetingMode, setTargetingMode, lookbackDays, setLookbackDays, advancedOpen, setAdvancedOpen,
    toggleInList,
    // Schedule & Launch
    priority, setPriority, freqCap, setFreqCap, popupCooldown, setPopupCooldown,
    startAt, setStartAt, endAt, setEndAt, publish, setPublish, editableStatus,
    // Navigation
    step, direction, maxStep, goNext, goBack, jumpToStep,
    // Validation
    stepErrors, stepError, validationError, canSave, canSaveAsDraft,
    // Submit
    saving, error, setError, submit, handleFormSubmit, isDirty,
    // Local draft
    draftAvailable, resumeDraft, dismissDraft,
  };
}

export type CampaignWizardApi = ReturnType<typeof useCampaignWizard>;
