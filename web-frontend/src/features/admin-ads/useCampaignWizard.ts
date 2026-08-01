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
import type { Product } from "@/src/types/product";
import { ApiError } from "@/src/lib/api-error";

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
  const [advertiserLogoBase64, setAdvertiserLogoBase64] = useState<string | null>(null);
  const [advertiserLogoPreview, setAdvertiserLogoPreview] = useState<string | null>(campaign?.external?.advertiserLogoUrl ?? null);
  const [externalCategory, setExternalCategory] = useState(campaign?.external?.category ?? "");
  const [externalSubCategory, setExternalSubCategory] = useState(campaign?.external?.subCategory ?? "");

  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");

  // ── Select Product ───────────────────────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null);

  // ── Creative ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(campaign?.creative?.title ?? "");
  const [subtitle, setSubtitle] = useState(campaign?.creative?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(campaign?.creative?.ctaLabel ?? "");
  const [badge, setBadge] = useState(campaign?.creative?.badge ?? "");
  const [mediaType, setMediaType] = useState<AdMediaType>(campaign?.creative?.bannerMediaType === "video" ? "video" : "image");
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(campaign?.creative?.bannerImageUrl ?? null);
  const [bannerVideoUrl, setBannerVideoUrl] = useState(campaign?.creative?.bannerVideoUrl ?? "");
  const [bannerVideoFile, setBannerVideoFile] = useState<File | null>(null);
  const [bannerVideoFilePreview, setBannerVideoFilePreview] = useState<string | null>(null);
  const [aspectWarning, setAspectWarning] = useState<string | null>(null);
  const [posterBase64, setPosterBase64] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(campaign?.creative?.bannerPosterUrl ?? null);
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
  const [error, setError] = useState<string | null>(null);

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
    ? Boolean(bannerPreview)
    : Boolean(bannerVideoFilePreview || bannerVideoUrl.trim());

  // Sets the product + backfills productSource/owner from its ownership —
  // used when a product arrives from a source other than the Select Product
  // list (e.g. hydrating a prefill from an approved service request), so the
  // Source & Owner step stays consistent with whatever got selected.
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

  // ── Media handlers ────────────────────────────────────────────────────────
  const readAsDataUrl = (file: File, onDone: (base64: string, dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] ?? "" : result;
      onDone(base64, result);
    };
    reader.readAsDataURL(file);
  };

  const handleBanner = (file: File) => {
    readAsDataUrl(file, (base64, dataUrl) => {
      setBannerPreview(dataUrl);
      setBannerBase64(base64);
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        setAspectWarning(ratio < 1.3 || ratio > 2.4
          ? `Banner is ${img.width}×${img.height} (${ratio.toFixed(2)}:1). The hero crops to ~16:9 — use a wide image to avoid cropping.`
          : null);
      };
      img.src = dataUrl;
    });
  };
  const handlePoster = (file: File) => readAsDataUrl(file, (base64, dataUrl) => { setPosterPreview(dataUrl); setPosterBase64(base64); });
  const handleAdvertiserLogo = (file: File) => readAsDataUrl(file, (base64, dataUrl) => { setAdvertiserLogoPreview(dataUrl); setAdvertiserLogoBase64(base64); });

  const handleVideoFile = (file: File) => {
    if (file.size > 100 * 1024 * 1024) { setError("Video must be under 100MB."); return; }
    setError(null);
    setBannerVideoFilePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    setBannerVideoFile(file);
    setBannerVideoUrl("");
  };
  const clearVideoFile = () => {
    setBannerVideoFilePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setBannerVideoFile(null);
  };

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

  // ── Validation ────────────────────────────────────────────────────────────
  const discountError = (() => {
    if (adSource !== "internal" || !useDiscount) return null;
    const amt = Number(discountAmount);
    if (!Number.isFinite(amt) || amt <= 0) return "Discounted price must be greater than 0.";
    if (listedPrice != null && amt > listedPrice) return "Discounted price can't exceed the listed price.";
    return null;
  })();

  const scheduleError = (() => {
    if (startAt && Number.isNaN(new Date(startAt).getTime())) return "Start date is invalid.";
    if (endAt && Number.isNaN(new Date(endAt).getTime())) return "End date is invalid.";
    if (startAt && endAt && new Date(startAt).getTime() > new Date(endAt).getTime()) return "End date must be after start date.";
    return null;
  })();

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

  // ── Step navigation ───────────────────────────────────────────────────────
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
  // since base64/File values aren't meaningfully diffable against a URL.
  const comparable = () => JSON.stringify({
    adSource, productSource, ownerUserId, destinationUrl, advertiserName, externalCategory, externalSubCategory,
    name, description, productId, title, subtitle, ctaLabel, badge, useDiscount, discountAmount, mediaType, bannerVideoUrl,
    audience, shopperCategories, shopperSubCategories, buyIntentCategories, buyIntentSubCategories,
    listedProductCategories, listedProductSubCategories, requireSameCategory, specificUserIds, targetingMode, lookbackDays,
    placements, priority, freqCap, popupCooldown, startAt, endAt, publish, sourceRequestId,
  });
  const initialSnapshotRef = useRef<string | null>(null);
  if (initialSnapshotRef.current === null) initialSnapshotRef.current = comparable();
  const hasNewMedia = !!(bannerBase64 || bannerVideoFile || posterBase64 || advertiserLogoBase64);
  const isDirty = hasNewMedia || comparable() !== initialSnapshotRef.current;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Re-validate every step, not just the current one — jumping directly to
    // a later step (StepRail) could otherwise post an incomplete payload.
    // Mirrors AdStudioScreen.tsx submitCampaign's belt-and-braces re-check.
    if (!canSave) {
      const bad = stepErrors.findIndex(Boolean);
      if (bad >= 0) jumpToStep(bad);
      setError(validationError);
      return;
    }
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

      const bannerMedia: Partial<NonNullable<UpsertAdCampaignInput["creative"]>> =
        mediaType === "image"
          ? (bannerBase64 ? { bannerMediaType: "image", bannerImageBase64: bannerBase64 } : {})
          : bannerVideoFile
            ? { bannerMediaType: "video" }
            : bannerVideoUrl.trim()
              ? { bannerMediaType: "video", bannerVideoUrl: bannerVideoUrl.trim() }
              : {};

      const creative: UpsertAdCampaignInput["creative"] = {
        title: title.trim() || (adSource === "internal" ? productDisplay?.name : advertiserName.trim()) || undefined,
        subtitle: subtitle.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
        badge: badge.trim() || undefined,
        priceOverride: adSource === "internal" && useDiscount && Number(discountAmount) > 0
          ? { amount: Number(discountAmount), currency: productCurrency }
          : null,
        ...bannerMedia,
        ...(mediaType === "video" && posterBase64 ? { bannerPosterBase64: posterBase64 } : {}),
      };

      // Draft/active only: paused/completed/archived campaigns keep their
      // lifecycle owned by the campaign card's Activate/Pause/Archive
      // actions, not this wizard — see `editableStatus` above.
      const statusForSubmit = !isEdit || editableStatus ? (publish ? "active" : "draft") : undefined;

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
              ...(advertiserLogoBase64 ? { advertiserLogoBase64 } : {}),
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

      const videoFile = mediaType === "video" ? bannerVideoFile : null;
      let saved: AdCampaign;
      if (isEdit && campaign) {
        saved = videoFile
          ? await adService.updateCampaignWithMedia(campaign.id, payload, videoFile)
          : await adService.updateCampaign(campaign.id, payload);
      } else if (videoFile) {
        saved = await adService.createCampaignWithMedia(payload, videoFile);
      } else {
        saved = await adService.createCampaign(payload);
      }
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} campaign`);
    } finally {
      setSaving(false);
    }
  };

  return {
    isEdit, campaign,
    // Source & Owner
    adSource, setAdSource, productSource, setProductSource, ownerUserId, setOwnerUserId, ownerUserName, setOwnerUserName,
    sourceRequestId, setSourceRequestId, applyPrefill, applyProductOwnershipContext,
    destinationUrl, setDestinationUrl, advertiserName, setAdvertiserName,
    advertiserLogoBase64, advertiserLogoPreview, setAdvertiserLogoPreview, handleAdvertiserLogo,
    setAdvertiserLogoBase64,
    externalCategory, setExternalCategory, externalSubCategory, setExternalSubCategory,
    name, setName, description, setDescription,
    // Product
    product, setProduct, productId, listedPrice, productCurrency, productDisplay,
    // Creative
    title, setTitle, subtitle, setSubtitle, ctaLabel, setCtaLabel, badge, setBadge,
    mediaType, setMediaType, bannerBase64, bannerPreview, setBannerPreview, setBannerBase64, handleBanner,
    bannerVideoUrl, setBannerVideoUrl, bannerVideoFile, bannerVideoFilePreview, handleVideoFile, clearVideoFile,
    aspectWarning, setAspectWarning, posterBase64, posterPreview, setPosterPreview, setPosterBase64, handlePoster,
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
    stepErrors, stepError, validationError, canSave,
    // Submit
    saving, error, setError, handleSubmit, isDirty,
  };
}

export type CampaignWizardApi = ReturnType<typeof useCampaignWizard>;
