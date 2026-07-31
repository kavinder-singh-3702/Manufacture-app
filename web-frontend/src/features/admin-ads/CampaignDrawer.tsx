"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adService,
  AdCampaign,
  AdMediaType,
  AdPlacement,
  UpsertAdCampaignInput,
} from "@/src/services/ad";
import { adminService, type AdminUser } from "@/src/services/admin";
import type { Product } from "@/src/types/product";
import { ApiError } from "@/src/lib/api-error";
import { ProductPicker } from "@/src/features/ads/components/ProductPicker";
import { CreativePreview } from "@/src/features/ads/components/CreativePreview";
import { CategoryMultiSelect } from "@/src/features/ads/components/CategoryMultiSelect";
import { Drawer, DrawerHeader, Label, Field, Section, ToggleRow, PLACEMENTS } from "./adStudioShared";

const isoToLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const localInputToIso = (val: string) => (val ? new Date(val).toISOString() : undefined);

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
const STEPS = ["Product", "Creative", "Placement", "Audience", "Delivery"] as const;

const StepRail = ({ steps, current, maxReached, onJump }: {
  steps: readonly string[]; current: number; maxReached: number; onJump: (i: number) => void;
}) => (
  <div className="flex items-center gap-1.5 px-5 py-3" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
    {steps.map((label, i) => {
      const active = i === current;
      const done = i < current;
      const reachable = i <= maxReached;
      return (
        <button key={label} type="button" disabled={!reachable} onClick={() => reachable && onJump(i)}
          className="flex flex-1 flex-col items-start gap-1 disabled:cursor-default">
          <span className="h-1 w-full rounded-full transition-colors" style={{ backgroundColor: active || done ? "var(--primary)" : "var(--border)" }} />
          <span className="hidden text-[10px] font-bold uppercase tracking-wide sm:block"
            style={{ color: active ? "var(--primary)" : done ? "var(--foreground)" : "var(--medium-gray)" }}>
            {label}
          </span>
        </button>
      );
    })}
  </div>
);

export const CampaignDrawer = ({ campaign, onClose, onSaved }: { campaign?: AdCampaign | null; onClose: () => void; onSaved: () => void }) => {
  const isEdit = !!campaign;
  const [product, setProduct] = useState<Product | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [title, setTitle] = useState(campaign?.creative?.title ?? "");
  const [subtitle, setSubtitle] = useState(campaign?.creative?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(campaign?.creative?.ctaLabel ?? "View product");
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

  // Discount
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
  const [step, setStep] = useState(0);
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

  const handleBanner = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBannerPreview(result);
      setBannerBase64(result.includes(",") ? result.split(",")[1] ?? "" : result);
      // Aspect-ratio guard — the hero is a wide banner (~16:9). Warn on far-off ratios.
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        setAspectWarning(ratio < 1.3 || ratio > 2.4
          ? `Banner is ${img.width}×${img.height} (${ratio.toFixed(2)}:1). The hero crops to ~16:9 — use a wide image to avoid cropping.`
          : null);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handlePoster = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPosterPreview(result);
      setPosterBase64(result.includes(",") ? result.split(",")[1] ?? "" : result);
    };
    reader.readAsDataURL(file);
  };

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

  // Per-step validation — each entry maps to a wizard step and gates "Continue".
  const discountError = (() => {
    if (!useDiscount) return null;
    const amt = Number(discountAmount);
    if (!Number.isFinite(amt) || amt <= 0) return "Discounted price must be greater than 0.";
    if (listedPrice != null && amt > listedPrice) return "Discounted price can't exceed the listed price.";
    return null;
  })();
  const stepErrors: (string | null)[] = [
    !productId ? "Select a product to promote." : !name.trim() ? "Give the campaign an internal name." : null,
    discountError,
    !placements.length ? "Pick at least one placement." : null,
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
    setStep((s) => {
      const n = Math.min(s + 1, STEPS.length - 1);
      setMaxStep((m) => Math.max(m, n));
      return n;
    });
  };
  const goBack = () => { setError(null); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      const bad = stepErrors.findIndex(Boolean);
      if (bad >= 0) setStep(bad);
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
        title: title.trim() || productDisplay?.name,
        subtitle: subtitle.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
        badge: badge.trim() || undefined,
        priceOverride: useDiscount && Number(discountAmount) > 0
          ? { amount: Number(discountAmount), currency: productCurrency }
          : null,
        ...bannerMedia,
        ...(mediaType === "video" && posterBase64 ? { bannerPosterBase64: posterBase64 } : {}),
      };

      const payload: UpsertAdCampaignInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        productId,
        placements,
        targeting,
        priority,
        frequencyCapPerDay: parseInt(freqCap, 10) || 3,
        popupCooldownMinutes: parseInt(popupCooldown, 10) || 60,
        ...(schedule ? { schedule } : {}),
        creative,
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
      <StepRail steps={STEPS} current={step} maxReached={maxStep} onJump={setStep} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        {step === 0 && (
        <Section>
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
          <Field label="Campaign name" required>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Internal name, e.g. Bearings push — June"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Notes (internal)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional — why this campaign exists"
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
        </Section>
        )}

        {step === 1 && (
        <Section>
          <Field label="Headline">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to product name"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Subtitle">
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optional supporting line"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA label">
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </Field>
            <Field label="Badge">
              <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. New"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </Field>
          </div>

          {/* Discount toggle */}
          <ToggleRow
            label="Run a discounted ad price"
            hint={listedPrice != null ? `Listed at ₹${listedPrice.toLocaleString("en-IN")}` : "Shown as a strike-through deal"}
            on={useDiscount}
            onToggle={() => setUseDiscount((v) => !v)}
          />
          {useDiscount && (
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
          )}
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

          {/* Banner media — a full-bleed image or video shown as-is in the home banner.
              Leave empty to auto-build a card from the product. */}
          <div className="space-y-3 rounded-xl p-3" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--surface)" }}>
            <Label>Live preview</Label>
            <CreativePreview
              bannerImage={mediaType === "image" ? bannerPreview : null}
              videoUrl={mediaType === "video" ? (bannerVideoFilePreview ?? (bannerVideoUrl.trim() || undefined)) : undefined}
              poster={posterPreview}
              productImage={productDisplay?.image}
              title={title.trim() || productDisplay?.name || "Featured product"}
              subtitle={subtitle.trim()}
              ctaLabel={ctaLabel.trim() || "View product"}
              badge={badge.trim()}
              price={listedPrice}
              discount={useDiscount && Number(discountAmount) > 0 ? Number(discountAmount) : undefined}
              currency={productCurrency}
            />

            <div className="flex gap-2">
              {(["image", "video"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMediaType(m)}
                  className="flex-1 rounded-lg py-2 text-xs font-bold transition-all"
                  style={{ backgroundColor: mediaType === m ? "var(--primary)" : "var(--background)", color: mediaType === m ? "#fff" : "var(--foreground)", border: "1px solid var(--border)" }}>
                  {m === "image" ? "🖼 Image" : "🎬 Video"}
                </button>
              ))}
            </div>

            {mediaType === "image" ? (
              <div>
                {bannerPreview ? (
                  <div className="relative overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img loading="lazy" decoding="async" src={bannerPreview} alt="banner" className="h-28 w-full object-cover" />
                    <button type="button" onClick={() => { setBannerPreview(null); setBannerBase64(null); setAspectWarning(null); }}
                      className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white">Remove</button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center rounded-xl py-4 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--background)" }}>
                    + Upload banner image (16:9)
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBanner(f); }} />
                  </label>
                )}
                {aspectWarning && (
                  <p className="mt-1 text-[11px] font-semibold" style={{ color: "#B45309" }}>⚠ {aspectWarning}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {bannerVideoFilePreview ? (
                  <div className="relative overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                    <video src={bannerVideoFilePreview} muted playsInline controls className="h-32 w-full object-cover" />
                    <button type="button" onClick={clearVideoFile}
                      className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white">Remove</button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center rounded-xl py-4 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--background)" }}>
                    + Upload video (mp4, ≤ 100MB)
                    <input type="file" accept="video/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); }} />
                  </label>
                )}
                {!bannerVideoFile && (
                  <Field label="or paste a hosted video URL">
                    <input value={bannerVideoUrl} onChange={(e) => setBannerVideoUrl(e.target.value)} placeholder="https://…" type="url"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                  </Field>
                )}
                <Field label="Poster image (shown before the video plays)">
                  {posterPreview ? (
                    <div className="relative overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async" src={posterPreview} alt="poster" className="h-24 w-full object-cover" />
                      <button type="button" onClick={() => { setPosterPreview(null); setPosterBase64(null); }}
                        className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white">Remove</button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                      style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--background)" }}>
                      + Upload poster image
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePoster(f); }} />
                    </label>
                  )}
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
              {advancedOpen && (
                <div className="space-y-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                  <div>
                    <Label>Match mode</Label>
                    <div className="flex gap-2">
                      {(["any", "all"] as const).map((m) => (
                        <button key={m} type="button" onClick={() => setTargetingMode(m)}
                          className="flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all"
                          style={{
                            backgroundColor: targetingMode === m ? "var(--primary)" : "var(--background)",
                            color: targetingMode === m ? "#fff" : "var(--foreground)",
                            border: "1px solid var(--border)",
                          }}>
                          {m === "any" ? "Match ANY rule" : "Match ALL rules"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Signal lookback (days)">
                    <input type="number" min="1" max="365" value={lookbackDays}
                      onChange={(e) => setLookbackDays(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                  </Field>
                </div>
              )}
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
              <input type="number" min="1" max="50" value={freqCap} onChange={(e) => setFreqCap(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>Max impressions per visitor, per day, across all placements.</p>
            </Field>
            <Field label="Popup cadence (min)">
              <input type="number" min="5" max="1440" value={popupCooldown} onChange={(e) => setPopupCooldown(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
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
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </Field>
            <Field label="Ends">
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </Field>
          </div>
          <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Leave blank to run indefinitely once activated.</p>
        </Section>
        )}

        {error && (
          <div className="rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger-strong)" }}>{error}</div>
        )}

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
              {saving ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save changes" : "Create as draft")}
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
