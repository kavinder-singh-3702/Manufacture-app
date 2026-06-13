import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useToast } from "../ui/Toast";
import { AppRole } from "../../constants/roles";
import { adService, AdFeedCard } from "../../services/ad.service";
import { productService } from "../../services/product.service";
import { crossSellEvents } from "../../services/cartCrossSell.events";
import { navigateRoot } from "../../navigation/navigationRef";
import { buildCrossSellView } from "./crossSell.shared";
import { CrossSellAdModal } from "./CrossSellAdModal";
import { CrossSellAdStrip } from "./CrossSellAdStrip";

// Don't surface another cross-sell within this window of the last one so rapid
// multi-adds don't spam the shopper. Backend daily frequency cap + dismiss
// suppression still apply on top of this.
const COOLDOWN_MS = 60_000;

type Tier = "sheet" | "strip";

const haptic = (style: "light" | "success") => {
  try {
    if (style === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // No-op on platforms without haptics (e.g. web).
  }
};

/**
 * Global, render-once host listening for "added to cart" events. Surfaces a
 * same-category sponsored product, choosing the presentation by value:
 *   • discounted  → full bottom sheet (worth the interruption)
 *   • otherwise   → lightweight top strip (a quiet heads-up)
 * Mounted in AppProviders; navigates via the root nav ref so it needs no prop.
 */
export const CrossSellAdHost = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();
  const isGuest = !user || user.role === AppRole.GUEST;

  const [card, setCard] = useState<AdFeedCard | null>(null);
  const [tier, setTier] = useState<Tier>("strip");
  const [visible, setVisible] = useState(false);
  const [adding, setAdding] = useState(false);

  const visibleRef = useRef(false);
  const lastShownAtRef = useRef(0);
  const shownCampaignsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef(false);

  visibleRef.current = visible;

  const logEvent = useCallback((c: AdFeedCard, type: "impression" | "click" | "dismiss") => {
    adService
      .logEvent({ campaignId: c.campaignId, type, placement: "cart_cross_sell", sessionId: c.sessionId })
      .catch(() => {});
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const handleTimeout = useCallback(() => {
    // Auto-hid; not a user dismissal, so no dismiss event.
    close();
  }, [close]);

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

  const handleAdd = useCallback(
    async (c: AdFeedCard) => {
      if (!c.product?.id || adding) return;
      setAdding(true);
      try {
        // The feed card carries only a product summary; fetch the full product so
        // the cart line is complete (variants, pricing, stock, etc.).
        const full = await productService.getById(c.product.id, {
          scope: "marketplace",
          includeVariantSummary: true,
        });
        addToCart(full, 1);
        logEvent(c, "click");
        haptic("success");
        toast.success("Added to cart", buildCrossSellView(c).productName);
        close();
      } catch {
        toast.error("Couldn't add", "Please try again");
      } finally {
        setAdding(false);
      }
    },
    [adding, addToCart, logEvent, toast, close]
  );

  useEffect(() => {
    const unsubscribe = crossSellEvents.subscribe(async ({ productId, category, subCategory }) => {
      if (isGuest) return;
      if (!category || !subCategory) return;
      if (visibleRef.current || inFlightRef.current) return;
      if (Date.now() - lastShownAtRef.current < COOLDOWN_MS) return;

      inFlightRef.current = true;
      try {
        const feed = await adService.getFeed({
          placement: "cart_cross_sell",
          limit: 1,
          category,
          subCategory,
          excludeProductId: productId,
        });

        const next = feed.cards?.[0];
        if (!next) return;
        if (shownCampaignsRef.current.has(next.campaignId)) return;

        shownCampaignsRef.current.add(next.campaignId);
        lastShownAtRef.current = Date.now();
        setCard(next);
        setTier(buildCrossSellView(next).isDiscounted ? "sheet" : "strip");
        setVisible(true);
        haptic("light");
        logEvent(next, "impression");
      } catch {
        // Cross-sell is best-effort; never disrupt the add-to-cart flow.
      } finally {
        inFlightRef.current = false;
      }
    });

    return unsubscribe;
  }, [isGuest, logEvent]);

  if (tier === "sheet") {
    return (
      <CrossSellAdModal
        visible={visible}
        card={card}
        adding={adding}
        onAdd={handleAdd}
        onView={handleView}
        onDismiss={handleDismiss}
      />
    );
  }

  return (
    <CrossSellAdStrip
      visible={visible}
      card={card}
      adding={adding}
      onAdd={handleAdd}
      onView={handleView}
      onDismiss={handleDismiss}
      onTimeout={handleTimeout}
    />
  );
};
