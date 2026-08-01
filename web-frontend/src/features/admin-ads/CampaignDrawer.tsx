"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adService,
  AdCampaign,
  AdMediaType,
  AdPlacement,
  AdSource,
  UpsertAdCampaignInput,
} from "@/src/services/ad";
import { adminService, type AdminUser } from "@/src/services/admin";
import type { Product } from "@/src/types/product";
import { ApiError } from "@/src/lib/api-error";
import { PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";
import { ProductPicker } from "@/src/features/ads/components/ProductPicker";
import { CreativePreview } from "@/src/features/ads/components/CreativePreview";
import { CategoryMultiSelect } from "@/src/features/ads/components/CategoryMultiSelect";
import { useMotionSafe } from "@/src/components/ui/motion";
import {
  Drawer, DrawerHeader, Label, Field, Section, ToggleRow, PLACEMENTS,
  TextInput, TextArea, SegmentedControl, MediaDropzone,
} from "./adStudioShared";

const isoToLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const localInputToIso = (val: string) => (val ? new Date(val).toISOString() : undefined);

// Same ease as the rest of the design system's fade/slide motion — see
// src/components/ui/motion.ts (fadeUp). Kept local since the step-transition
// shape (directional slide) doesn't fit that helper's signature.
const EASE = [0.22, 1, 0.36, 1] as const;

type AudiencePreset = "everyone" | "specific_users" | "shopper_category" | "buy_intent" | "same_category_listers";

const AUDIENCE_PRESETS: { key: AudiencePreset; label: string; hint: string; icon: string }[] = [
  { key: "everyone",               label: "Everyone",             hint: "Show to all eligible users",                 icon: "🌐" },
  { key: "specific_users",         label: "Specific users",       hint: "Hand-pick exactly who sees this ad",          icon: "🎯" },
  { key: "shopper_category",       label: "Browsed a category",   hint: "Users recently viewing chosen categories",   icon: "👀" },
  { key: "buy_intent",             label: "Buying signal",        hint: "Added-to-cart / accepted quotes in category", icon: "🛒" },
  { key: "same_category_listers",  label: "Same-category sellers", hint: "Users who list in this product's category",  icon: "🏭" },
];

const inferAudiencePreset = (t?: AdCampaign["targeting"]): AudiencePreset => {
  if (!t) return "everyone";
  if ((t.userIds?.length ?? 0) > 0) return "specific_users";
  if (t.requireListedProductInSameCategory) return "same_category_listers";
  if ((t.buyIntentCategories?.length ?? 0) > 0) return "buy_intent";
  if ((t.shopperCategories?.length ?? 0) > 0) return "shopper_category";
  return "everyone";
};

// Wizard steps — one focused card per screen so the form never feels crowded.
const STEPS = ["Source", "Creative", "Placement", "Audience", "Delivery"] as const;

const StepRail = ({ steps, current, maxReached, onJump, motionSafe }: {
  steps: readonly string[]; current: number; maxReached: number; onJump: (i: number) => void; motionSafe: boolean;
}) => (
  <div className="flex items-center gap-1.5 px-5 py-3" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
    {steps.map((label, i) => {
      const active = i === current;
      const done = i < current;
      const reachable = i <= maxReached;
      return (
        <button key={label} type="button" disabled={!reachable} onClick={() => reachable && onJump(i)}
          className="flex flex-1 flex-col items-start gap-1 disabled:cursor-default">
          <span className="relative h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
            {active ? (
              <motion.span layoutId={motionSafe ? "adstudio-step-fill" : undefined} className="absolute inset-0 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
                transition={motionSafe ? { type: "spring", stiffness: 420, damping: 34 } : { duration: 0 }} />
            ) : done ? (
              <span className="absolute inset-0 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
            ) : null}
          </span>
          <span className="hidden text-[10px] font-bold uppercase tracking-wide sm:block"
            style={{ color: active ? "var(--primary)" : done ? "var(--foreground)" : "var(--medium-gray)" }}>
            {label}
          </span>
        </button>
      );
    })}
  </div>
);

// Collapsible wrapper for conditionally-shown fields (discount amount, audience
// sub-panels, external-only inputs) — the form grows/shrinks instead of popping.
const Reveal = ({ show, motionSafe, children }: { show: boolean; motionSafe: boolean; children: React.ReactNode }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        initial={motionSafe ? { height: 0, opacity: 0 } : false}
        animate={{ height: "auto", opacity: 1 }}
        exit={motionSafe ? { height: 0, opacity: 0 } : { opacity: 0 }}
        transition={{ duration: motionSafe ? 0.16 : 0, ease: EASE }}
        className="overflow-hidden">
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

const selectStyle = { backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" } as const;

export const CampaignDrawer = ({ campaign, onClose, onSaved }: { campaign?: AdCampaign | null; onClose: () => void; onSaved: () => void }) => {
  const isEdit = !!campaign;
  const motionSafe = useMotionSafe();

  // Source — an internal catalog product, or a third-party destination link.
  const [adSource, setAdSource] = useState<AdSource>(campaign?.adSource ?? "internal");
  const [product, setProduct] = useState<Product | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState(campaign?.external?.destinationUrl ?? "");
  const [advertiserName, setAdvertiserName] = useState(campaign?.external?.advertiserName ?? "");
  const [advertiserLogoBase64, setAdvertiserLogoBase64] = useState<string | null>(null);
  const [advertiserLogoPreview, setAdvertiserLogoPreview] = useState<string | null>(campaign?.external?.advertiserLogoUrl ?? null);
  const [externalCategory, setExternalCategory] = useState(campaign?.external?.category ?? "");
  const [externalSubCategory, setExternalSubCategory] = useState(campaign?.external?.subCategory ?? "");

  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [title, setTitle] = useState(campaign?.creative?.title ?? "");
  const [subtitle, setSubtitle] = useState(campaign?.creative?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(campaign?.creative?.ctaLabel ?? "");
  const [badge, setBadge] = useState(campaign?.creative?.badge ?? "");

  // Banner media — one full-bleed image or video, shown as-is in the home banner.
  const [mediaType, setMediaType] = useState<AdMediaType>(campaign?.creative?.bannerMediaType === "video" ? "video" : "image");
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(campaign?.creative?.bannerImageUrl ?? null);
  const [bannerVideoUrl, setBannerVideoUrl] = useState(campaign?.creative?.bannerVideoUrl ?? "");
  const [bannerVideoFile, setBannerVideoFile] = useState<File | null>(null);
  const [bannerVideoFilePreview, setBannerVideoFilePreview] = useState<string | null>(null);
  const [aspectWarning, setAspectWarning] = useState<string | null>(null);
  // Poster (shown before/while a banner video loads)
  const [posterBase64, setPosterBase64] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(campaign?.creative?.bannerPosterUrl ?? null);

  // Discount — internal campaigns only (no listed price to discount against externally).
  const [useDiscount, setUseDiscount] = useState(!!campaign?.creative?.priceOverride?.amount);
  const [discountAmount, setDiscountAmount] = useState(
    campaign?.creative?.priceOverride?.amount != null ? String(campaign.creative.priceOverride.amount) : "",
  );

  // Audience targeting
  const [audience, setAudience] = useState<AudiencePreset>(inferAudiencePreset(campaign?.targeting));
  const [shopperCategories, setShopperCategories] = useState<string[]>(campaign?.targeting?.shopperCategories ?? []);
  const [buyIntentCategories, setBuyIntentCategories] = useState<string[]>(campaign?.targeting?.buyIntentCategories ?? []);
  const [specificUsers, setSpecificUsers] = useState<AdminUser[]>([]);
  const [specificUserIds, setSpecificUserIds] = useState<string[]>(campaign?.targeting?.userIds ?? []);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [targetingMode, setTargetingMode] = useState<"any" | "all">(campaign?.targeting?.mode ?? "any");
  const [lookbackDays, setLookbackDays] = useState(String(campaign?.targeting?.lookbackDays ?? 60));
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Delivery + schedule
  const [placements, setPlacements] = useState<AdPlacement[]>(campaign?.placements ?? ["dashboard_home"]);
  const [priority, setPriority] = useState(campaign?.priority ?? 50);
  const [freqCap, setFreqCap] = useState(String(campaign?.frequencyCapPerDay ?? 3));
  const [popupCooldown, setPopupCooldown] = useState(String(campaign?.popupCooldownMinutes ?? 60));
  const [startAt, setStartAt] = useState(isoToLocalInput(campaign?.schedule?.startAt));
  const [endAt, setEndAt] = useState(isoToLocalInput(campaign?.schedule?.endAt));
  const [launchNow, setLaunchNow] = useState(campaign?.status === "active");

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [maxStep, setMaxStep] = useState(isEdit ? STEPS.length - 1 : 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the chosen product display from either a freshly-picked Product or
  // the campaign's embedded summary (edit mode).
  const productId = product?._id ?? campaign?.product?.id ?? "";
  const listedPrice = product ? product.price.amount : campaign?.product?.price?.amount;
  const productCurrency = (product ? product.price.currency : campaign?.product?.price?.currency) ?? "INR";
  const productDisplay = product
    ? { name: product.name, image: product.images?.[0]?.url, price: product.price.amount }
    : campaign?.product
      ? { name: campaign.product.name ?? "Product", image: campaign.product.images?.[0]?.url, price: campaign.product.price?.amount }
      : null;

  const wantsCrossSell = placements.includes("cart_cross_sell");
  const selectedExternalCategoryMeta = PRODUCT_CATEGORIES.find((c) => c.id === externalCategory);

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

  const togglePlacement = (p: AdPlacement) =>
    setPlacements((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const toggleCat = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

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
      // Aspect-ratio guard — the hero is a wide banner (~16:9). Warn on far-off ratios.
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

  // Banner video is uploaded as a file (multipart) rather than base64-inlined —
  // videos are large, so we keep just the File + a local object-URL preview.
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

  const hasBanner = mediaType === "image"
    ? Boolean(bannerPreview)
    : Boolean(bannerVideoFilePreview || bannerVideoUrl.trim());

  // Per-step validation — each entry maps to a wizard step and gates "Continue".
  const discountError = (() => {
    if (adSource !== "internal" || !useDiscount) return null;
    const amt = Number(discountAmount);
    if (!Number.isFinite(amt) || amt <= 0) return "Discounted price must be greater than 0.";
    if (listedPrice != null && amt > listedPrice) return "Discounted price can't exceed the listed price.";
    return null;
  })();

  const isValidHttpsUrl = (value: string) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  };

  const stepErrors: (string | null)[] = [
    !name.trim() ? "Give the campaign an internal name."
      : adSource === "internal" && !productId ? "Select a product to promote."
      : adSource === "external" && !destinationUrl.trim() ? "Enter the destination URL."
      : adSource === "external" && !isValidHttpsUrl(destinationUrl.trim()) ? "Destination URL must start with https://."
      : adSource === "external" && !advertiserName.trim() ? "Enter the advertiser name."
      : null,
    discountError,
    !placements.length ? "Pick at least one placement."
      : adSource === "external" && !hasBanner ? "External ads need a banner image or video."
      : adSource === "external" && wantsCrossSell && (!externalCategory || !externalSubCategory) ? "Cart cross-sell needs a category + sub-category to match against."
      : null,
    audience === "specific_users" && !specificUserIds.length ? "Pick at least one user to target."
      : audience === "shopper_category" && !shopperCategories.length ? "Choose at least one shopper category."
      : audience === "buy_intent" && !buyIntentCategories.length ? "Choose at least one buying-signal category."
      : null,
    null,
  ];
  const validationError = stepErrors.find(Boolean) ?? null;
  const canSave = !validationError;
  const stepError = stepErrors[step];

  const goNext = () => {
    if (stepError) { setError(stepError); return; }
    setError(null);
    setDirection(1);
    setStep((s) => {
      const n = Math.min(s + 1, STEPS.length - 1);
      setMaxStep((m) => Math.max(m, n));
      return n;
    });
  };
  const goBack = () => { setError(null); setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };
  const jumpToStep = (i: number) => { setDirection(i > step ? 1 : -1); setError(null); setStep(i); };

  // Enter submits the *step*, not the campaign — only the last step's explicit
  // submit button creates/saves. Without this, a single-field step (e.g. just
  // the campaign name) implicitly submits the whole <form> on Enter per the
  // HTML spec, silently creating a bannerless, unplaced draft.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "TEXTAREA") return;
    e.preventDefault();
    if (step < STEPS.length - 1) goNext();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== STEPS.length - 1) return; // belt-and-braces against any other implicit-submit path
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
        buyIntentCategories: audience === "buy_intent" ? buyIntentCategories : [],
        requireListedProductInSameCategory: audience === "same_category_listers",
        lookbackDays: Math.min(Math.max(parseInt(lookbackDays, 10) || 60, 1), 365),
      };

      // Banner media: image inlines as base64; a picked video ships via multipart
      // (below), so here we only flag the media type / any hosted URL.
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
        // New campaigns launch as active or draft per the toggle below; editing
        // an existing campaign never changes its status from this drawer —
        // that's what the Activate/Pause buttons on the card are for.
        ...(isEdit ? {} : { status: launchNow ? "active" : "draft" }),
      };

      const videoFile = mediaType === "video" ? bannerVideoFile : null;
      if (isEdit && campaign) {
        if (videoFile) await adService.updateCampaignWithMedia(campaign.id, payload, videoFile);
        else await adService.updateCampaign(campaign.id, payload);
      } else if (videoFile) {
        await adService.createCampaignWithMedia(payload, videoFile);
      } else {
        await adService.createCampaign(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} campaign`);
    } finally {
      setSaving(false);
    }
  };

  const priorityLabel = priority >= 75 ? "High" : priority >= 40 ? "Medium" : "Low";

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader title={isEdit ? "Edit campaign" : "New campaign"} subtitle={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`} onClose={onClose} />
      <StepRail steps={STEPS} current={step} maxReached={maxStep} onJump={jumpToStep} motionSafe={motionSafe} />
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4 p-5">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={motionSafe ? { opacity: 0, x: direction >= 0 ? 16 : -16 } : false}
            animate={{ opacity: 1, x: 0 }}
            exit={motionSafe ? { opacity: 0, x: direction >= 0 ? -16 : 16 } : { opacity: 0 }}
            transition={{ duration: motionSafe ? 0.18 : 0, ease: EASE }}
            className="flex flex-col gap-4">

            {step === 0 && (
            <Section>
              <SegmentedControl
                layoutId="adstudio-source"
                value={adSource}
                onChange={setAdSource}
                options={[{ value: "internal", label: "Internal product" }, { value: "external", label: "External link" }]}
              />

              <Reveal show={adSource === "internal"} motionSafe={motionSafe}>
                {productDisplay ? (
                  <div className="flex items-center gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                    {productDisplay.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async" src={productDisplay.image} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--background)" }}>📦</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{productDisplay.name}</p>
                      {productDisplay.price != null && (
                        <p className="text-xs" style={{ color: "var(--medium-gray)" }}>₹{productDisplay.price.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    <button type="button" onClick={() => setPickerOpen(true)} className="text-xs font-bold" style={{ color: "var(--primary)" }}>Change</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPickerOpen(true)}
                    className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
                    + Select a product
                  </button>
                )}
              </Reveal>

              <Reveal show={adSource === "external"} motionSafe={motionSafe}>
                <div className="space-y-3">
                  <Field label="Destination URL" required>
                    <TextInput type="url" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="https://partner-site.com/offer" />
                  </Field>
                  <Field label="Advertiser name" required>
                    <TextInput value={advertiserName} onChange={(e) => setAdvertiserName(e.target.value)} placeholder="e.g. Acme Tools Co" />
                  </Field>
                  <Field label="Advertiser logo (optional)">
                    <MediaDropzone label="+ Upload logo" accept="image/*" preview={advertiserLogoPreview} height="h-16"
                      onFile={handleAdvertiserLogo} onRemove={() => { setAdvertiserLogoPreview(null); setAdvertiserLogoBase64(null); }} />
                  </Field>
                </div>
              </Reveal>

              <Field label="Campaign name" required>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Internal name, e.g. Bearings push — June" />
              </Field>
              <Field label="Notes (internal)">
                <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional — why this campaign exists" />
              </Field>
            </Section>
            )}

            {step === 1 && (
            <Section>
              <Field label="Headline">
                <TextInput value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={adSource === "internal" ? "Defaults to product name" : "Defaults to advertiser name"} />
              </Field>
              <Field label="Subtitle">
                <TextInput value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optional supporting line" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA label">
                  <TextInput value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder={adSource === "internal" ? "View product" : "Learn more"} />
                </Field>
                <Field label="Badge">
                  <TextInput value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. New" />
                </Field>
              </div>

              <Reveal show={adSource === "internal"} motionSafe={motionSafe}>
                <div className="space-y-3">
                  <ToggleRow
                    label="Run a discounted ad price"
                    hint={listedPrice != null ? `Listed at ₹${listedPrice.toLocaleString("en-IN")}` : "Shown as a strike-through deal"}
                    on={useDiscount}
                    onToggle={() => setUseDiscount((v) => !v)}
                  />
                  <Reveal show={useDiscount} motionSafe={motionSafe}>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                      <span className="text-sm font-bold" style={{ color: "var(--medium-gray)" }}>₹</span>
                      <input type="number" min="1" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="Advertised price"
                        className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--foreground)" }} />
                      {listedPrice != null && Number(discountAmount) > 0 && Number(discountAmount) < listedPrice && (
                        <span className="whitespace-nowrap text-[11px] font-bold" style={{ color: "#16A34A" }}>
                          −{Math.round((1 - Number(discountAmount) / listedPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </Reveal>
                </div>
              </Reveal>
            </Section>
            )}

            {step === 2 && (
            <Section>
              <div className="flex gap-2">
                {PLACEMENTS.map((p) => (
                  <button key={p.key} type="button" onClick={() => togglePlacement(p.key)}
                    className="flex-1 rounded-xl py-2.5 text-xs font-bold transition-all"
                    style={{
                      backgroundColor: placements.includes(p.key) ? "var(--primary)" : "var(--surface)",
                      color: placements.includes(p.key) ? "#fff" : "var(--foreground)",
                      border: "1px solid var(--border)",
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>

              <Reveal show={adSource === "external" && wantsCrossSell} motionSafe={motionSafe}>
                <div className="grid grid-cols-2 gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                  <Field label="Category" required>
                    <select value={externalCategory} onChange={(e) => { setExternalCategory(e.target.value); setExternalSubCategory(""); }}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selectStyle}>
                      <option value="">Select…</option>
                      {PRODUCT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
                    </select>
                  </Field>
                  <Field label="Sub-category" required>
                    <select value={externalSubCategory} onChange={(e) => setExternalSubCategory(e.target.value)} disabled={!selectedExternalCategoryMeta}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-50" style={selectStyle}>
                      <option value="">Select…</option>
                      {(selectedExternalCategoryMeta?.subCategories ?? []).map((sc) => <option key={sc} value={sc}>{sc}</option>)}
                    </select>
                  </Field>
                  <p className="col-span-2 text-[11px]" style={{ color: "var(--medium-gray)" }}>
                    Cart cross-sell matches ads to a cart item&apos;s category — external ads have no real product, so this stands in for it.
                  </p>
                </div>
              </Reveal>

              {/* Banner media — a full-bleed image or video shown as-is in the home banner.
                  Required for external ads (no product image to fall back on). */}
              <div className="space-y-3 rounded-xl p-3" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--surface)" }}>
                <Label required={adSource === "external"}>Live preview</Label>
                <CreativePreview
                  bannerImage={mediaType === "image" ? bannerPreview : null}
                  videoUrl={mediaType === "video" ? (bannerVideoFilePreview ?? (bannerVideoUrl.trim() || undefined)) : undefined}
                  poster={posterPreview}
                  productImage={adSource === "internal" ? productDisplay?.image : advertiserLogoPreview ?? undefined}
                  title={title.trim() || (adSource === "internal" ? productDisplay?.name : advertiserName.trim()) || "Featured"}
                  subtitle={subtitle.trim()}
                  ctaLabel={ctaLabel.trim() || (adSource === "internal" ? "View product" : "Learn more")}
                  badge={badge.trim()}
                  price={adSource === "internal" ? listedPrice : undefined}
                  discount={adSource === "internal" && useDiscount && Number(discountAmount) > 0 ? Number(discountAmount) : undefined}
                  currency={productCurrency}
                />

                <SegmentedControl layoutId="adstudio-media-type" value={mediaType} onChange={setMediaType}
                  options={[{ value: "image", label: "🖼 Image" }, { value: "video", label: "🎬 Video" }]} />

                {mediaType === "image" ? (
                  <div>
                    <MediaDropzone label="+ Upload banner image (16:9)" accept="image/*" preview={bannerPreview}
                      onFile={handleBanner} onRemove={() => { setBannerPreview(null); setBannerBase64(null); setAspectWarning(null); }} />
                    {aspectWarning && (
                      <p className="mt-1 text-[11px] font-semibold" style={{ color: "#B45309" }}>⚠ {aspectWarning}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <MediaDropzone label="+ Upload video (mp4, ≤ 100MB)" accept="video/*" kind="video" height="h-32" preview={bannerVideoFilePreview}
                      onFile={handleVideoFile} onRemove={clearVideoFile} />
                    {!bannerVideoFile && (
                      <Field label="or paste a hosted video URL">
                        <TextInput value={bannerVideoUrl} onChange={(e) => setBannerVideoUrl(e.target.value)} placeholder="https://…" type="url" />
                      </Field>
                    )}
                    <Field label="Poster image (shown before the video plays)">
                      <MediaDropzone label="+ Upload poster image" accept="image/*" preview={posterPreview} height="h-24"
                        onFile={handlePoster} onRemove={() => { setPosterPreview(null); setPosterBase64(null); }} />
                    </Field>
                  </div>
                )}
              </div>
            </Section>
            )}

            {step === 3 && (
            <Section>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCE_PRESETS.map((a) => {
                  const active = audience === a.key;
                  return (
                    <button key={a.key} type="button" onClick={() => setAudience(a.key)}
                      className="rounded-xl p-2.5 text-left transition-all"
                      style={{
                        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                        backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
                      }}>
                      <p className="text-xs font-bold" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>{a.icon} {a.label}</p>
                      <p className="mt-0.5 text-[10px] leading-tight" style={{ color: "var(--medium-gray)" }}>{a.hint}</p>
                    </button>
                  );
                })}
              </div>

              {audience === "specific_users" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Targeted users ({specificUserIds.length})</Label>
                    <button type="button" onClick={() => setUserPickerOpen(true)} className="text-[11px] font-bold" style={{ color: "var(--primary)" }}>+ Add users</button>
                  </div>
                  {specificUserIds.length === 0 ? (
                    <button type="button" onClick={() => setUserPickerOpen(true)}
                      className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                      style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
                      + Pick users to target
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {specificUserIds.map((id) => {
                        const u = specificUsers.find((x) => x.id === id);
                        return (
                          <span key={id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                            {u?.displayName || u?.email || `${id.slice(-6)}`}
                            <button type="button" onClick={() => setSpecificUserIds((prev) => prev.filter((x) => x !== id))} className="font-bold">✕</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {audience === "shopper_category" && (
                <CategoryMultiSelect label="Target shopper categories" selected={shopperCategories}
                  onToggle={(id) => toggleCat(shopperCategories, setShopperCategories, id)} />
              )}
              {audience === "buy_intent" && (
                <CategoryMultiSelect label="Buying-signal categories" selected={buyIntentCategories}
                  onToggle={(id) => toggleCat(buyIntentCategories, setBuyIntentCategories, id)} />
              )}
              {audience === "same_category_listers" && (
                <p className="rounded-xl p-3 text-[11px]" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--medium-gray)" }}>
                  Targets users who have active public listings in the promoted product&apos;s category.
                </p>
              )}

              {audience !== "everyone" && (
                <>
                  <button type="button" onClick={() => setAdvancedOpen((v) => !v)} className="text-[11px] font-bold" style={{ color: "var(--primary)" }}>
                    {advancedOpen ? "Hide advanced rules" : "Advanced rules"}
                  </button>
                  <Reveal show={advancedOpen} motionSafe={motionSafe}>
                    <div className="space-y-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                      <div>
                        <Label>Match mode</Label>
                        <SegmentedControl layoutId="adstudio-match-mode" value={targetingMode} onChange={setTargetingMode}
                          options={[{ value: "any", label: "Match ANY rule" }, { value: "all", label: "Match ALL rules" }]} />
                      </div>
                      <Field label="Signal lookback (days)">
                        <TextInput type="number" min="1" max="365" value={lookbackDays}
                          onChange={(e) => setLookbackDays(e.target.value.replace(/[^0-9]/g, ""))} />
                      </Field>
                    </div>
                  </Reveal>
                </>
              )}
            </Section>
            )}

            {step === 4 && (
            <Section>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Priority</Label>
                  <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{priorityLabel} · {priority}</span>
                </div>
                <input type="range" min={1} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full accent-[var(--primary)]" />
                <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Higher priority wins when several ads compete for the same slot.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Frequency cap / day">
                  <TextInput type="number" min="1" max="50" value={freqCap} onChange={(e) => setFreqCap(e.target.value)} />
                  <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>Max impressions per visitor, per day, across all placements.</p>
                </Field>
                <Field label="Popup cadence (min)">
                  <TextInput type="number" min="5" max="1440" value={popupCooldown} onChange={(e) => setPopupCooldown(e.target.value)} />
                  <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>Minutes between interstitial popup showings.</p>
                </Field>
              </div>
              <div className="flex items-center justify-between">
                <Label>Schedule</Label>
                {(startAt || endAt) && (
                  <button type="button" onClick={() => { setStartAt(""); setEndAt(""); }}
                    className="text-[11px] font-bold" style={{ color: "var(--medium-gray)" }}>Clear</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts">
                  <TextInput type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </Field>
                <Field label="Ends">
                  <TextInput type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </Field>
              </div>
              <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Leave blank to run indefinitely once activated.</p>

              <Reveal show={!isEdit} motionSafe={motionSafe}>
                <div className="space-y-1.5">
                  <ToggleRow
                    label="Launch immediately after creating"
                    hint={launchNow ? "Goes live and starts serving right away" : "Saved as a draft — activate it later from the campaign card"}
                    on={launchNow}
                    onToggle={() => setLaunchNow((v) => !v)}
                  />
                </div>
              </Reveal>
            </Section>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={motionSafe ? { opacity: 0, y: -4 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: motionSafe ? 0.15 : 0 }}
              className="rounded-xl px-3 py-2.5 text-xs font-semibold"
              style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger-strong)" }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sticky bottom-0 -mx-5 flex items-center gap-3 px-5 py-4" style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={step === 0 ? onClose : goBack}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} disabled={!!stepError} title={stepError ?? undefined}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: "var(--primary)" }}>
              Continue
            </button>
          ) : (
            <button type="submit" disabled={!canSave || saving} title={validationError ?? undefined}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: "var(--primary)" }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={saving ? "saving" : "idle"}
                  initial={motionSafe ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: motionSafe ? 0.15 : 0 }}
                  className="inline-flex items-center justify-center gap-2">
                  {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40" style={{ borderTopColor: "#fff" }} />}
                  {saving
                    ? (isEdit ? "Saving…" : "Creating…")
                    : (isEdit ? "Save changes" : launchNow ? "Create & activate" : "Create as draft")}
                </motion.span>
              </AnimatePresence>
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {pickerOpen && (
          <ProductPicker onSelect={(p) => { setProduct(p); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />
        )}
        {userPickerOpen && (
          <UserPicker
            selectedIds={specificUserIds}
            onToggle={(u) => {
              setSpecificUsers((prev) => (prev.find((x) => x.id === u.id) ? prev : [...prev, u]));
              setSpecificUserIds((prev) => (prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id]));
            }}
            onClose={() => setUserPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </Drawer>
  );
};

// ── User picker (specific-user targeting) ───────────────────────────────────────

const UserPicker = ({ selectedIds, onToggle, onClose }: { selectedIds: string[]; onToggle: (u: AdminUser) => void; onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      // Keep it minimal: show only the 3 most-recent users until the admin searches.
      const res = await adminService.listUsers({ search: q || undefined, limit: q ? 40 : 3, sort: "updatedAt:desc" });
      setResults(res.users ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(""); }, [load]);
  useEffect(() => { const t = setTimeout(() => load(search), 250); return () => clearTimeout(t); }, [load, search]);

  const showingTop = !search.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Target specific users · {selectedIds.length} selected</p>
          <button onClick={onClose} className="text-lg font-bold leading-none hover:opacity-60" style={{ color: "var(--medium-gray)" }}>✕</button>
        </div>
        <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus placeholder="Search by name, email, phone…"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          {showingTop && (
            <p className="mt-2 text-[11px]" style={{ color: "var(--medium-gray)" }}>Showing 3 recent users — search to find anyone.</p>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
            </div>
          ) : !results.length ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No users found.</p>
          ) : results.map((u) => {
            const active = selectedIds.includes(u.id);
            return (
              <button key={u.id} onClick={() => onToggle(u)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--background)]"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: active ? "var(--primary)" : "var(--background)", color: active ? "#fff" : "var(--medium-gray)" }}>
                  {active ? "✓" : (u.displayName || u.email || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{u.displayName || "Unnamed user"}</p>
                  <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>{u.email}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="w-full rounded-xl py-2.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>Done</button>
        </div>
      </motion.div>
    </div>
  );
};
