"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/providers/CartProvider";
import { useAdFeed } from "../useAdFeed";
import { buildAdView } from "../adView";

/**
 * "Sponsored · You may also like" strip for the cart, matched to the category +
 * sub-category of the first cart item — mirrors the app's CrossSellAdStrip.
 * Renders nothing when the cart is empty or no ad matches (never a bare box).
 */
export const AdCrossSell = () => {
  const router = useRouter();
  const { items } = useCart();
  const anchor = items[0];
  const anchorProduct = anchor?.product;

  const { cards, logEvent } = useAdFeed({
    placement: "cart_cross_sell",
    limit: 3,
    category: anchorProduct?.category,
    subCategory: anchorProduct?.subCategory,
    excludeProductId: anchorProduct?._id,
    enabled: Boolean(anchorProduct?.category && anchorProduct?.subCategory),
  });

  useEffect(() => {
    cards.forEach((card) => logEvent(card, "impression", { origin: "web_cart_cross_sell" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  if (!cards.length) return null;

  return (
    <section className="space-y-3 rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
      <div className="flex items-center gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
        >
          Sponsored
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
          You may also like
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const view = buildAdView(card);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                logEvent(card, "click", { origin: "web_cart_cross_sell" });
                router.push(view.productHref);
              }}
              className="flex items-center gap-3 rounded-xl p-2.5 text-left transition-opacity hover:opacity-90"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
            >
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: "var(--background)" }}>
                {view.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={view.productImage} alt={view.productName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>{view.productName}</p>
                {view.priceText && <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>{view.priceText}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
