"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adService, AdEventType, AdFeedCard, AdPlacement } from "@/src/services/ad";
import { canShowCard, recordDismiss, recordImpression } from "./adFrequency";

export type UseAdFeedOptions = {
  placement: AdPlacement;
  limit?: number;
  // Cross-sell: match the category + sub-category of a cart item.
  category?: string;
  subCategory?: string;
  excludeProductId?: string;
  /** Skip fetching (e.g. cross-sell with nothing in the cart yet). */
  enabled?: boolean;
};

/**
 * Shared data source for every ad surface (banner, popup, cross-sell): fetches
 * a placement's feed, drops anything the client-side frequency guard says has
 * already been seen enough today or was dismissed, and exposes a single
 * `logEvent` that keeps the local frequency state and the server event log in
 * sync. Never throws — a failed fetch just yields an empty card list so ads
 * are always best-effort and never break the page.
 */
export const useAdFeed = ({ placement, limit = 5, category, subCategory, excludeProductId, enabled = true }: UseAdFeedOptions) => {
  const [cards, setCards] = useState<AdFeedCard[]>([]);
  const [loading, setLoading] = useState(enabled);
  const loggedImpressions = useRef<Set<string>>(new Set());
  // Guards against a stale response (from a superseded placement/category
  // change) overwriting fresher state once it resolves out of order.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await adService.getFeed({ placement, limit, category, subCategory, excludeProductId });
      if (requestIdRef.current !== requestId) return;
      setCards((res.cards || []).filter((card) => canShowCard(card.campaignId, card.frequencyCapPerDay ?? 3)));
    } catch {
      if (requestIdRef.current === requestId) setCards([]);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [placement, limit, category, subCategory, excludeProductId]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const logEvent = useCallback((card: AdFeedCard, type: AdEventType, metadata?: Record<string, unknown>) => {
    if (type === "impression") {
      // One impression per card per mount — the carousel/host re-fires "visible"
      // on every auto-scroll tick, but we only want to count/cap it once here.
      if (loggedImpressions.current.has(card.id)) return;
      loggedImpressions.current.add(card.id);
      recordImpression(card.campaignId);
    } else if (type === "dismiss") {
      recordDismiss(card.campaignId);
    }

    adService
      .logEvent({ campaignId: card.campaignId, type, placement: card.placement, sessionId: card.sessionId, metadata })
      .catch(() => {
        // Best-effort — never disrupt the page if event logging fails.
      });
  }, []);

  return { cards: enabled ? cards : [], loading: enabled ? loading : false, logEvent };
};
