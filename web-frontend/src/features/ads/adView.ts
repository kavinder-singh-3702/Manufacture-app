import { AdFeedCard, AdPrice } from "@/src/services/ad";

// Derives everything every ad surface (banner, popup, cross-sell) needs from a
// feed card, so pricing/discount/label formatting stays identical across all of
// them — mirrors the app's buildCrossSellView (crossSell.shared.tsx) so the two
// platforms present the same numbers the same way.

const currencySymbol = (p?: AdPrice) => (p?.currency === "INR" || !p?.currency ? "₹" : p.currency);

export const formatAdPrice = (p?: AdPrice) =>
  p?.amount ? `${currencySymbol(p)}${Number(p.amount).toLocaleString("en-IN")}` : "";

const titleCase = (value?: string) =>
  value
    ? value
        .replace(/[-_]/g, " ")
        .replace(/(^|\s)([a-z])/g, (_, b, c) => `${b}${c.toUpperCase()}`)
        .trim()
    : "";

export type AdUrgency = { label: string } | null;

// Where a click on this card should go — an internal route, or a third-party
// URL that must open outside the SPA's own navigation. See adDestination.ts.
export type AdDestination = { kind: "internal"; href: string } | { kind: "external"; url: string };

export type AdView = {
  heroImage?: string;
  productImage?: string;
  productName: string;
  companyName: string;
  categoryLabel: string;
  priceText: string;
  originalPriceText: string;
  unit?: string;
  isDiscounted: boolean;
  discountBadge: string;
  urgency: AdUrgency;
  ctaLabel: string;
  destination: AdDestination;
};

export const buildAdView = (card: AdFeedCard): AdView => {
  const isExternal = card.adSource === "external";
  const product = card.product;
  const productImage = product?.images?.[0]?.url;
  const productName = card.title || product?.name || card.external?.advertiserName || "Sponsored";
  const companyName = card.subtitle || product?.company?.displayName || card.external?.advertiserName || "";
  const categoryLabel = isExternal ? "" : titleCase(product?.subCategory || product?.category);

  const listed = isExternal ? undefined : card.pricing?.listed || product?.price;
  const advertised = isExternal ? undefined : card.pricing?.advertised || card.priceOverride;
  const isDiscounted =
    !isExternal &&
    (Boolean(card.pricing?.isDiscounted) ||
      Boolean(advertised?.amount && listed?.amount && Number(advertised.amount) < Number(listed.amount)));
  const displayPrice = advertised || listed;

  const savings =
    isDiscounted && listed?.amount && displayPrice?.amount ? Math.max(0, Number(listed.amount) - Number(displayPrice.amount)) : 0;
  const discountPct = isDiscounted && listed?.amount && savings ? Math.round((savings / Number(listed.amount)) * 100) : 0;
  const discountBadge = discountPct >= 1 ? `${discountPct}% OFF` : "";

  const qty = product?.availableQuantity;
  const minQty = product?.minStockQuantity ?? 0;
  const hoursLeft = card.endsAt ? (new Date(card.endsAt).getTime() - Date.now()) / 3_600_000 : Infinity;

  let urgency: AdUrgency = null;
  if (!isExternal && typeof qty === "number" && qty > 0 && qty <= Math.max(5, minQty)) {
    urgency = { label: `Only ${qty} left` };
  } else if (!isExternal && Number.isFinite(hoursLeft) && hoursLeft > 0 && hoursLeft <= 48) {
    urgency = { label: hoursLeft <= 24 ? `Deal ends in ${Math.max(1, Math.ceil(hoursLeft))}h` : "Deal ends tomorrow" };
  }

  const destination: AdDestination =
    isExternal && card.external?.destinationUrl
      ? { kind: "external", url: card.external.destinationUrl }
      : { kind: "internal", href: product?.id ? `/products/${product.id}` : "/products" };

  return {
    heroImage: card.bannerPosterUrl || card.bannerImageUrl || productImage,
    productImage,
    productName,
    companyName,
    categoryLabel,
    priceText: formatAdPrice(displayPrice),
    originalPriceText: isDiscounted ? formatAdPrice(listed) : "",
    unit: displayPrice?.unit,
    isDiscounted,
    discountBadge,
    urgency,
    ctaLabel: card.ctaLabel || (isExternal ? "Learn more" : "View product"),
    destination,
  };
};
