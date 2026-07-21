"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AdPlacement } from "@/src/services/ad";
import { useAdFeed } from "../useAdFeed";
import { buildAdView } from "../adView";

const AUTO_ROTATE_MS = 4500;

type AdBannerProps = {
  /** Which surface this banner sits on — drives targeting + which campaigns are eligible. */
  placement: AdPlacement;
  limit?: number;
  className?: string;
};

/**
 * Responsive, full-bleed sponsored banner carousel. Shown to both logged-in and
 * anonymous visitors (the feed itself decides eligibility). Renders nothing when
 * there's no eligible ad, so it never leaves an empty placeholder on the page.
 * Mirrors the app's HeroBannerCarousel (image/video, "AD" tag, dot pagination).
 */
export const AdBanner = ({ placement, limit = 5, className = "" }: AdBannerProps) => {
  const router = useRouter();
  const { cards, loading, logEvent } = useAdFeed({ placement, limit });
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const card = cards[index] ?? null;

  useEffect(() => {
    setIndex(0);
  }, [cards]);

  useEffect(() => {
    if (card) logEvent(card, "impression", { origin: `web_${placement}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cards.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % cards.length), AUTO_ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cards.length]);

  if (loading) {
    return (
      <div
        className={`aspect-[16/9] w-full animate-pulse rounded-3xl sm:aspect-[21/9] ${className}`}
        style={{ backgroundColor: "var(--border)" }}
      />
    );
  }

  if (!card) return null;

  const view = buildAdView(card);
  const isVideo = card.bannerMediaType === "video" && Boolean(card.bannerVideoUrl);

  const handleClick = () => {
    logEvent(card, "click", { origin: `web_${placement}` });
    router.push(view.productHref);
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl ${className}`} style={{ backgroundColor: "#0E1230" }}>
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <AnimatePresence mode="wait">
          <motion.button
            key={card.id}
            type="button"
            onClick={handleClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 h-full w-full cursor-pointer text-left"
            aria-label={`Sponsored: ${view.productName}`}
          >
            {isVideo ? (
              <video
                src={card.bannerVideoUrl}
                poster={card.bannerPosterUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : view.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={view.heroImage} alt={view.productName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full flex-col justify-end p-6"
                style={{ background: "linear-gradient(135deg, #1B1464 0%, #2E3192 50%, #0071BC 100%)" }}
              >
                <p className="text-xl font-bold text-white sm:text-2xl">{view.productName}</p>
                {view.companyName && <p className="mt-1 text-sm text-white/70">{view.companyName}</p>}
              </div>
            )}

            {/* Legibility gradient + sponsored disclosure */}
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 35%)" }} />
            <span className="absolute left-4 top-4 rounded-md px-2 py-1 text-[10px] font-bold tracking-wide text-white/90" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
              AD
            </span>
            {view.discountBadge && (
              <span className="absolute right-4 top-4 rounded-md px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: "#16A34A" }}>
                {view.discountBadge}
              </span>
            )}
          </motion.button>
        </AnimatePresence>

        {/* Dot pagination */}
        {cards.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {cards.map((c, i) => (
              <span
                key={c.id}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === index ? 18 : 6, backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.5)" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
