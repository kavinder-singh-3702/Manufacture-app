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
  productHref: string;
};

export const buildAdView = (card: AdFeedCard): AdView => {
  const product = card.product;
  const productImage = product?.images?.[0]?.url;
  const productName = card.title || product?.name || "Featured product";
  const companyName = card.subtitle || product?.company?.displayName || "";
  const categoryLabel = titleCase(product?.subCategory || product?.category);

  const listed = card.pricing?.listed || product?.price;
  const advertised = card.pricing?.advertised || card.priceOverride;
  const isDiscounted =
    Boolean(card.pricing?.isDiscounted) ||
    Boolean(advertised?.amount && listed?.amount && Number(advertised.amount) < Number(listed.amount));
  const displayPrice = advertised || listed;

  const savings =
    isDiscounted && listed?.amount && displayPrice?.amount ? Math.max(0, Number(listed.amount) - Number(displayPrice.amount)) : 0;
  const discountPct = isDiscounted && listed?.amount && savings ? Math.round((savings / Number(listed.amount)) * 100) : 0;
  const discountBadge = discountPct >= 1 ? `${discountPct}% OFF` : "";

  const qty = product?.availableQuantity;
  const minQty = product?.minStockQuantity ?? 0;
  const hoursLeft = card.endsAt ? (new Date(card.endsAt).getTime() - Date.now()) / 3_600_000 : Infinity;

  let urgency: AdUrgency = null;
  if (typeof qty === "number" && qty > 0 && qty <= Math.max(5, minQty)) {
    urgency = { label: `Only ${qty} left` };
  } else if (Number.isFinite(hoursLeft) && hoursLeft > 0 && hoursLeft <= 48) {
    urgency = { label: hoursLeft <= 24 ? `Deal ends in ${Math.max(1, Math.ceil(hoursLeft))}h` : "Deal ends tomorrow" };
  }

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
    ctaLabel: card.ctaLabel || "View product",
    productHref: product?.id ? `/products/${product.id}` : "/products",
  };
};
