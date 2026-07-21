import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { AppRole, isAdminRole } from "../../constants/roles";
import { adService, AdFeedCard } from "../../services/ad.service";
import { navigateRoot } from "../../navigation/navigationRef";
import { adPopupStorage } from "../../services/adPopupStorage";
import { LoginAdPopupModal } from "./LoginAdPopupModal";

// The popup shows the single top-priority ad, once ~20s after login and then at
// a cadence each campaign controls itself (popupCooldownMinutes, admin-set in Ad
// Studio). The last-shown timestamp is persisted (adPopupStorage) so relaunching
// the app can't be used to spam the shopper.
const POPUP_PLACEMENT = "hero_banner" as const;
const FIRST_DELAY_MS = 20_000; // 20s after login
const DEFAULT_COOLDOWN_MS = 60 * 60_000; // cheap pre-fetch gate before we know which campaign will show
const CHECK_EVERY_MS = 5 * 60_000; // re-check every 5 min; the cooldown gates it

/**
 * Global, render-once host that surfaces the top-priority ad as a centered popup.
 * Mounted in AppProviders so it stays alive across tabs/screens and navigates via
 * the root nav ref. Skipped for guests and admins.
 */
export const LoginAdPopupHost = () => {
  const { user } = useAuth();
  const eligible = !!user && user.role !== AppRole.GUEST && !isAdminRole(user.role);

  const [card, setCard] = useState<AdFeedCard | null>(null);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const inFlightRef = useRef(false);
  visibleRef.current = visible;

  const logEvent = useCallback((c: AdFeedCard, type: "impression" | "click" | "dismiss") => {
    adService
      .logEvent({ campaignId: c.campaignId, type, placement: c.placement, sessionId: c.sessionId, metadata: { origin: "login_popup" } })
      .catch(() => {});
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const handleDismiss = useCallback(() => {
    if (card) logEvent(card, "dismiss");
    close();
  }, [card, logEvent, close]);

  const handleView = useCallback(
    (c: AdFeedCard) => {
      logEvent(c, "click");
      close();
      if (c.product?.id) navigateRoot("ProductDetails", { productId: c.product.id });
    },
    [logEvent, close]
  );

  const attemptShow = useCallback(async () => {
    if (!eligible || visibleRef.current || inFlightRef.current) return;
    const last = await adPopupStorage.getLastShownAt();
    // Cheap pre-check against the default cadence before hitting the network —
    // each candidate card's own cadence is re-checked below once we know it.
    if (last && Date.now() - last < DEFAULT_COOLDOWN_MS) return;

    inFlightRef.current = true;
    try {
      const feed = await adService.getFeed({ placement: POPUP_PLACEMENT, limit: 5 });
      const next = (feed.cards || []).find((c) => {
        const cooldownMs = (c.popupCooldownMinutes ?? 60) * 60_000;
        return !last || Date.now() - last >= cooldownMs;
      });
      if (!next) return;
      // Persist first so a slow render can't double-fire within the cooldown window.
      await adPopupStorage.setLastShownAt(Date.now());
      setCard(next);
      setVisible(true);
      logEvent(next, "impression");
    } catch {
      // Best-effort — never disrupt the app if the feed call fails.
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

  return <LoginAdPopupModal visible={visible} card={card} onView={handleView} onDismiss={handleDismiss} />;
};
