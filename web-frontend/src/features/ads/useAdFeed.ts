"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adService, AdEventType, AdFeedCard, AdPlacement } from "@/src/services/ad";
import { canShowCard, recordDismiss, recordImpression } from "./adFrequency";

export type UseAdFeedOptions = {
  /** Single placement — the common case (popup, cross-sell). */
  placement?: AdPlacement;
  /**
   * Multiple placements, fetched in parallel and concatenated in order
   * (deduped by campaignId). Mirrors the app's Home screen, which merges
   * `hero_banner` and `dashboard_home` into one carousel instead of showing
   * only whichever was requested first. Takes precedence over `placement`.
   */
  placements?: AdPlacement[];
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
 * one or more placements' feeds, drops anything the client-side frequency
 * guard says has already been seen enough today or was dismissed, and
 * exposes a single `logEvent` that keeps the local frequency state and the
 * server event log in sync. Never throws — a failed fetch just yields an
 * empty card list so ads are always best-effort and never break the page.
 */
export const useAdFeed = ({ placement, placements, limit = 5, category, subCategory, excludeProductId, enabled = true }: UseAdFeedOptions) => {
  const [cards, setCards] = useState<AdFeedCard[]>([]);
  const [loading, setLoading] = useState(enabled);
  const loggedImpressions = useRef<Set<string>>(new Set());
  // Guards against a stale response (from a superseded placement/category
  // change) overwriting fresher state once it resolves out of order.
  const requestIdRef = useRef(0);

  const targetPlacements = placements && placements.length ? placements : placement ? [placement] : [];
  const placementsKey = targetPlacements.join(",");

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const responses = await Promise.all(
        targetPlacements.map((p) =>
          adService.getFeed({ placement: p, limit, category, subCategory, excludeProductId }).catch(() => ({ cards: [] as AdFeedCard[] }))
        )
      );
      if (requestIdRef.current !== requestId) return;
      const seen = new Set<string>();
      const merged: AdFeedCard[] = [];
      for (const res of responses) {
        for (const card of res.cards || []) {
          if (seen.has(card.campaignId)) continue;
          if (!canShowCard(card.campaignId, card.frequencyCapPerDay ?? 3)) continue;
          seen.add(card.campaignId);
          merged.push(card);
        }
      }
      setCards(merged.slice(0, limit));
    } catch {
      if (requestIdRef.current === requestId) setCards([]);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementsKey, limit, category, subCategory, excludeProductId]);

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
