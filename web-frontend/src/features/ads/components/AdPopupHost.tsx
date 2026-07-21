"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { adService, AdFeedCard } from "@/src/services/ad";
import { canShowByCap, canShowPopupNow, isDismissed, recordDismiss, recordImpression, setPopupLastShownAt } from "../adFrequency";
import { AdPopup } from "./AdPopup";

// Reuses the hero_banner placement for the top-priority ad — same choice the
// app makes for its login popup (LoginAdPopupHost) so a single campaign
// targeting "hero_banner" powers both the banner AND the interstitial.
const POPUP_PLACEMENT = "hero_banner" as const;
const FIRST_DELAY_MS = 20_000; // first check, 20s after mount
const CHECK_EVERY_MS = 5 * 60_000; // re-check every 5 min; cadence gates the actual show
const DEFAULT_COOLDOWN_MINUTES = 60;

const EXCLUDED_PATH_PREFIXES = ["/admin", "/signin", "/signup", "/reset-password", "/forgot-password"];

/**
 * Global, render-once host for the sponsored interstitial popup — shown to both
 * logged-in and anonymous visitors, gated by each campaign's own popup cadence
 * (popupCooldownMinutes) plus its daily impression cap. Skipped on auth/admin
 * routes and for admin accounts. Mount once near the app root (see providers.tsx).
 */
export const AdPopupHost = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const excludedRoute = EXCLUDED_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  const eligible = !isAdmin && !excludedRoute;

  const [card, setCard] = useState<AdFeedCard | null>(null);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const inFlightRef = useRef(false);
  visibleRef.current = visible;

  const logEvent = useCallback((c: AdFeedCard, type: "impression" | "click" | "dismiss") => {
    adService
      .logEvent({ campaignId: c.campaignId, type, placement: c.placement, sessionId: c.sessionId, metadata: { origin: "web_popup" } })
      .catch(() => {});
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const handleDismiss = useCallback(() => {
    if (card) {
      recordDismiss(card.campaignId);
      logEvent(card, "dismiss");
    }
    close();
  }, [card, logEvent, close]);

  const handleView = useCallback(
    (c: AdFeedCard) => {
      logEvent(c, "click");
      close();
      router.push(c.product?.id ? `/products/${c.product.id}` : "/products");
    },
    [logEvent, close, router]
  );

  const attemptShow = useCallback(async () => {
    if (!eligible || visibleRef.current || inFlightRef.current) return;
    // Cheap pre-check against the default cadence before hitting the network —
    // the per-campaign cadence (once we know which campaign) is re-checked below.
    if (!canShowPopupNow(DEFAULT_COOLDOWN_MINUTES)) return;

    inFlightRef.current = true;
    try {
      const feed = await adService.getFeed({ placement: POPUP_PLACEMENT, limit: 5 });
      const next = (feed.cards || []).find(
        (c) =>
          !isDismissed(c.campaignId) &&
          canShowByCap(c.campaignId, c.frequencyCapPerDay ?? 3) &&
          canShowPopupNow(c.popupCooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES)
      );
      if (!next) return;

      // Persist first so a slow render can't double-fire within the cooldown window.
      setPopupLastShownAt(Date.now());
      recordImpression(next.campaignId);
      setCard(next);
      setVisible(true);
      logEvent(next, "impression");
    } catch {
      // Best-effort — never disrupt the page if the feed call fails.
    } finally {
      inFlightRef.current = false;
    }
  }, [eligible, logEvent]);

  useEffect(() => {
    if (!eligible) return;
    const first = setTimeout(attemptShow, FIRST_DELAY_MS);
    const interval = setInterval(attemptShow, CHECK_EVERY_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [eligible, attemptShow]);

  // Navigating into an excluded route (e.g. /admin) while the popup is open
  // closes it immediately, without logging a dismiss.
  useEffect(() => {
    if (!eligible) setVisible(false);
  }, [eligible]);

  return <AdPopup visible={visible} card={card} onView={handleView} onDismiss={handleDismiss} />;
};
