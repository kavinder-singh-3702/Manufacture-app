"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAdFeed } from "../useAdFeed";
import { buildAdView } from "../adView";
import { AdLink } from "./AdLink";
import { Section, Card } from "@/src/components/ui/Surface";
import { fadeUp } from "@/src/components/ui/motion";
import type { AdFeedCard } from "@/src/services/ad";

/**
 * 3-up sponsored product rail for the public home page — showcases active
 * ad campaigns without needing a new placement enum (reuses the existing
 * "dashboard_home" feed, same placement the app's home screen sponsored
 * deck already draws from). Renders nothing when the feed comes back empty
 * so it never leaves a placeholder section on the page.
 */
export const SponsoredRail = () => {
  const { cards, loading, logEvent } = useAdFeed({ placements: ["dashboard_home"], limit: 3 });

  useEffect(() => {
    cards.forEach((card) => logEvent(card, "impression", { origin: "web_sponsored_rail" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  if (!loading && cards.length === 0) return null;

  return (
    <Section title="Sponsored">
      <div className="grid gap-4 sm:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
            ))
          : cards.map((card, i) => <SponsoredCard key={card.id} card={card} index={i} onClick={() => logEvent(card, "click", { origin: "web_sponsored_rail" })} />)}
      </div>
    </Section>
  );
};

const SponsoredCard = ({ card, index, onClick }: { card: AdFeedCard; index: number; onClick: () => void }) => {
  const view = buildAdView(card);

  return (
    <motion.div {...fadeUp(index * 0.06)}>
      <AdLink destination={view.destination} onClick={onClick}>
        <Card interactive padding="none" className="overflow-hidden">
          <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: "var(--background)" }}>
            {view.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={view.heroImage} alt={view.productName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                <span className="text-lg font-bold text-white">{view.productName}</span>
              </div>
            )}
            <span
              className="absolute left-2.5 top-2.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white/90"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              SPONSORED
            </span>
            {view.discountBadge && (
              <span className="absolute right-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: "var(--success)" }}>
                {view.discountBadge}
              </span>
            )}
          </div>
          <div className="p-3.5">
            <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{view.productName}</p>
            {view.companyName && (
              <p className="truncate text-xs" style={{ color: "var(--medium-gray)" }}>{view.companyName}</p>
            )}
            {view.priceText && (
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{view.priceText}</span>
                {view.originalPriceText && (
                  <span className="text-xs line-through" style={{ color: "var(--medium-gray)" }}>{view.originalPriceText}</span>
                )}
              </div>
            )}
          </div>
        </Card>
      </AdLink>
    </motion.div>
  );
};
