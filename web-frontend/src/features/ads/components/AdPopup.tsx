"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AdFeedCard } from "@/src/services/ad";
import { buildAdView } from "../adView";

type AdPopupProps = {
  visible: boolean;
  card: AdFeedCard | null;
  onView: (card: AdFeedCard) => void;
  onDismiss: () => void;
};

/**
 * Centered sponsored interstitial — presentational only (AdPopupHost owns the
 * fetch/timing/gating). Mirrors the app's LoginAdPopupModal: sponsored tag,
 * banner/product image, price row, single CTA + a low-pressure "Maybe later".
 */
export const AdPopup = ({ visible, card, onView, onDismiss }: AdPopupProps) => {
  if (!card) return null;
  const view = buildAdView(card);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(10,12,24,0.6)" }}
            onClick={onDismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl"
            style={{ backgroundColor: "var(--card)", boxShadow: "0 24px 60px rgba(0,0,0,0.28)" }}
          >
            <div className="relative h-48 w-full" style={{ backgroundColor: "var(--surface)" }}>
              {view.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={view.heroImage} alt={view.productName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl">📦</div>
              )}
              <span
                className="absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#2E3192" }}
              >
                Sponsored
              </span>
              {view.discountBadge && (
                <span
                  className="absolute right-11 top-3 rounded-md px-2 py-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#16A34A" }}
                >
                  {view.discountBadge}
                </span>
              )}
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 p-5">
              <p className="text-lg font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                {view.productName}
              </p>
              {view.companyName && (
                <p className="text-xs font-medium" style={{ color: "var(--medium-gray)" }}>
                  by {view.companyName}
                </p>
              )}

              {view.priceText && (
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>{view.priceText}</span>
                  {view.unit && <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>/{view.unit}</span>}
                  {view.originalPriceText && (
                    <span className="text-sm font-semibold line-through" style={{ color: "var(--medium-gray)" }}>
                      {view.originalPriceText}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => onView(card)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #2E3192, #1B1464)" }}
              >
                {view.ctaLabel} →
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="w-full py-2 text-center text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: "var(--medium-gray)" }}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
