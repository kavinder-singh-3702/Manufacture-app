"use client";

/**
 * Live hero-banner creative preview — mirrors the app's HeroBannerCarousel
 * layout so what an admin/seller builds here matches what actually renders
 * in AdBanner. Shared by the admin Ad Studio wizard and the seller-facing
 * Ad Runs screen (read-only there). Previously a private `HeroPreview`
 * inside AdStudioPanel.tsx.
 */

export type CreativePreviewProps = {
  bannerImage?: string | null;
  videoUrl?: string;
  poster?: string | null;
  productImage?: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  badge?: string;
  price?: number;
  discount?: number;
  currency: string;
};

export const CreativePreview = ({
  bannerImage,
  videoUrl,
  poster,
  productImage,
  title,
  subtitle,
  ctaLabel,
  badge,
  price,
  discount,
  currency,
}: CreativePreviewProps) => {
  const fullBleed = bannerImage || poster || (videoUrl ? poster : null);
  const sym = currency === "INR" || !currency ? "₹" : `${currency} `;
  const showPrice = price != null;
  const advertised = discount && discount > 0 ? discount : price;

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 9", border: "1px solid var(--border)", background: "linear-gradient(135deg,#1B1464,#2E3192,#0071BC)" }}>
      {fullBleed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img loading="lazy" decoding="async" src={fullBleed} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : videoUrl ? (
        <video src={videoUrl} muted className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest text-white/80">AD</span>
            {badge && <span className="ml-1 inline-block rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-bold text-white">{badge}</span>}
            <p className="mt-1 truncate text-base font-extrabold text-white">{title}</p>
            {subtitle && <p className="truncate text-[11px] font-semibold text-white/70">{subtitle}</p>}
            {showPrice && (
              <p className="mt-1 text-sm font-extrabold" style={{ color: "#4ADE80" }}>
                {discount && price && discount < price && <span className="mr-1.5 text-[11px] font-bold text-white/50 line-through">{sym}{price.toLocaleString("en-IN")}</span>}
                {sym}{Number(advertised).toLocaleString("en-IN")}
              </p>
            )}
            <span className="mt-1.5 inline-block rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold" style={{ color: "#1B1464" }}>{ctaLabel}</span>
          </div>
          {productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={productImage} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl border-2 border-white/15 object-cover" />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border-2 border-white/15 bg-white/10 text-2xl">📦</div>
          )}
        </div>
      )}
    </div>
  );
};
