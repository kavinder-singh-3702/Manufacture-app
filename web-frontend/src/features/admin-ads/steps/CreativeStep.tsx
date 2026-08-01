"use client";

import type { CampaignWizardApi } from "../useCampaignWizard";
import { PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";
import { CreativePreview } from "@/src/features/ads/components/CreativePreview";
import {
  Field, Label, Reveal, Section, SegmentedControl, TextInput, ToggleRow,
  MediaDropzone, PLACEMENTS,
} from "../adStudioShared";

const selectStyle = { backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" } as const;

// Merges the app's separate "Creative" step with placement selection — placements
// are a creative-delivery concern (which surfaces render this banner), not a
// standalone step, matching how the app groups them (AdStudioScreen.tsx step 3).
export const CreativeStep = ({ wizard, motionSafe }: { wizard: CampaignWizardApi; motionSafe: boolean }) => {
  const selectedExternalCategoryMeta = PRODUCT_CATEGORIES.find((c) => c.id === wizard.externalCategory);

  return (
    <Section>
      <Field label="Headline">
        <TextInput value={wizard.title} onChange={(e) => wizard.setTitle(e.target.value)}
          placeholder={wizard.adSource === "internal" ? "Defaults to product name" : "Defaults to advertiser name"} />
      </Field>
      <Field label="Subtitle">
        <TextInput value={wizard.subtitle} onChange={(e) => wizard.setSubtitle(e.target.value)} placeholder="Optional supporting line" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="CTA label">
          <TextInput value={wizard.ctaLabel} onChange={(e) => wizard.setCtaLabel(e.target.value)} placeholder={wizard.adSource === "internal" ? "View product" : "Learn more"} />
        </Field>
        <Field label="Badge">
          <TextInput value={wizard.badge} onChange={(e) => wizard.setBadge(e.target.value)} placeholder="e.g. New" />
        </Field>
      </div>

      <Reveal show={wizard.adSource === "internal"} motionSafe={motionSafe}>
        <div className="space-y-3">
          <ToggleRow
            label="Run a discounted ad price"
            hint={wizard.listedPrice != null ? `Listed at ₹${wizard.listedPrice.toLocaleString("en-IN")}` : "Shown as a strike-through deal"}
            on={wizard.useDiscount}
            onToggle={() => wizard.setUseDiscount(!wizard.useDiscount)}
          />
          <Reveal show={wizard.useDiscount} motionSafe={motionSafe}>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--medium-gray)" }}>₹</span>
              <input type="number" min="1" value={wizard.discountAmount} onChange={(e) => wizard.setDiscountAmount(e.target.value)} placeholder="Advertised price"
                className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--foreground)" }} />
              {wizard.listedPrice != null && Number(wizard.discountAmount) > 0 && Number(wizard.discountAmount) < wizard.listedPrice && (
                <span className="whitespace-nowrap text-[11px] font-bold" style={{ color: "#16A34A" }}>
                  −{Math.round((1 - Number(wizard.discountAmount) / wizard.listedPrice) * 100)}%
                </span>
              )}
            </div>
          </Reveal>
        </div>
      </Reveal>

      <div>
        <Label>Placements</Label>
        <div className="flex gap-2">
          {PLACEMENTS.map((p) => (
            <button key={p.key} type="button" onClick={() => wizard.togglePlacement(p.key)}
              className="flex-1 rounded-xl py-2.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: wizard.placements.includes(p.key) ? "var(--primary)" : "var(--surface)",
                color: wizard.placements.includes(p.key) ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Reveal show={wizard.adSource === "external" && wizard.wantsCrossSell} motionSafe={motionSafe}>
        <div className="grid grid-cols-2 gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
          <Field label="Category" required>
            <select value={wizard.externalCategory} onChange={(e) => { wizard.setExternalCategory(e.target.value); wizard.setExternalSubCategory(""); }}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selectStyle}>
              <option value="">Select…</option>
              {PRODUCT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
            </select>
          </Field>
          <Field label="Sub-category" required>
            <select value={wizard.externalSubCategory} onChange={(e) => wizard.setExternalSubCategory(e.target.value)} disabled={!selectedExternalCategoryMeta}
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

      <div className="space-y-3 rounded-xl p-3" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--surface)" }}>
        <Label required={wizard.adSource === "external"}>Live preview</Label>
        <CreativePreview
          bannerImage={wizard.mediaType === "image" ? wizard.bannerPreview : null}
          videoUrl={wizard.mediaType === "video" ? (wizard.bannerVideoFilePreview ?? (wizard.bannerVideoUrl.trim() || undefined)) : undefined}
          poster={wizard.posterPreview}
          productImage={wizard.adSource === "internal" ? wizard.productDisplay?.image : wizard.advertiserLogoPreview ?? undefined}
          title={wizard.title.trim() || (wizard.adSource === "internal" ? wizard.productDisplay?.name : wizard.advertiserName.trim()) || "Featured"}
          subtitle={wizard.subtitle.trim()}
          ctaLabel={wizard.ctaLabel.trim() || (wizard.adSource === "internal" ? "View product" : "Learn more")}
          badge={wizard.badge.trim()}
          price={wizard.adSource === "internal" ? wizard.listedPrice : undefined}
          discount={wizard.adSource === "internal" && wizard.useDiscount && Number(wizard.discountAmount) > 0 ? Number(wizard.discountAmount) : undefined}
          currency={wizard.productCurrency}
        />

        <SegmentedControl layoutId="adstudio-media-type" value={wizard.mediaType} onChange={wizard.setMediaType}
          options={[{ value: "image", label: "🖼 Image" }, { value: "video", label: "🎬 Video" }]} />

        {wizard.mediaType === "image" ? (
          <div>
            <MediaDropzone label="+ Upload banner image (16:9)" accept="image/*" preview={wizard.bannerPreview}
              onFile={wizard.handleBanner} onRemove={() => { wizard.setBannerPreview(null); wizard.setBannerBase64(null); wizard.setAspectWarning(null); }} />
            {wizard.aspectWarning && (
              <p className="mt-1 text-[11px] font-semibold" style={{ color: "#B45309" }}>⚠ {wizard.aspectWarning}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <MediaDropzone label="+ Upload video (mp4, ≤ 100MB)" accept="video/*" kind="video" height="h-32" preview={wizard.bannerVideoFilePreview}
              onFile={wizard.handleVideoFile} onRemove={wizard.clearVideoFile} />
            {!wizard.bannerVideoFile && (
              <Field label="or paste a hosted video URL">
                <TextInput value={wizard.bannerVideoUrl} onChange={(e) => wizard.setBannerVideoUrl(e.target.value)} placeholder="https://…" type="url" />
              </Field>
            )}
            <Field label="Poster image (shown before the video plays)">
              <MediaDropzone label="+ Upload poster image" accept="image/*" preview={wizard.posterPreview} height="h-24"
                onFile={wizard.handlePoster} onRemove={() => { wizard.setPosterPreview(null); wizard.setPosterBase64(null); }} />
            </Field>
          </div>
        )}
      </div>
    </Section>
  );
};
