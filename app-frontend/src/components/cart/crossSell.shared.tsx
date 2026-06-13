import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AdFeedCard, AdPrice } from "../../services/ad.service";

const currencySymbol = (p?: AdPrice) => (p?.currency === "INR" || !p?.currency ? "₹" : p.currency);

export const formatPrice = (p?: AdPrice) =>
  p?.amount ? `${currencySymbol(p)}${Number(p.amount).toLocaleString("en-IN")}` : "";

const titleCase = (value?: string) =>
  value
    ? value
        .replace(/[-_]/g, " ")
        .replace(/(^|\s)([a-z])/g, (_, b, c) => `${b}${c.toUpperCase()}`)
        .trim()
    : "";

export type CrossSellUrgency = { icon: "flame" | "time" | "trending-up"; text: string } | null;

export type CrossSellView = {
  productImage?: string;
  productName: string;
  companyName: string;
  categoryLabel: string;
  priceText: string;
  originalPriceText: string;
  unit?: string;
  isDiscounted: boolean;
  savings: number;
  savingsText: string;
  /** Off-percentage badge, e.g. "20% OFF". */
  discountBadge: string;
  /** The "why check this out" one-liner. */
  reason: string;
  urgency: CrossSellUrgency;
  ctaLabel: string;
};

// Derives everything the modal and the inline strip need from a feed card, so the
// two presentations stay perfectly in sync.
export const buildCrossSellView = (card: AdFeedCard): CrossSellView => {
  const product = card.product || ({} as AdFeedCard["product"]);
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
    isDiscounted && listed?.amount && advertised?.amount
      ? Math.max(0, Number(listed.amount) - Number(advertised.amount))
      : 0;
  const savingsText = savings ? `Save ${currencySymbol(displayPrice)}${savings.toLocaleString("en-IN")}` : "";

  const discountPct =
    isDiscounted && listed?.amount && savings ? Math.round((savings / Number(listed.amount)) * 100) : 0;
  const discountBadge = discountPct >= 1 ? `${discountPct}% OFF` : "";

  // Urgency, most-compelling first: scarce stock → ending deal → generic low stock.
  const qty = product?.availableQuantity;
  const minQty = product?.minStockQuantity ?? 0;
  let urgency: CrossSellUrgency = null;

  const hoursLeft = card.endsAt ? (new Date(card.endsAt).getTime() - Date.now()) / 3_600_000 : Infinity;

  if (typeof qty === "number" && qty > 0 && qty <= Math.max(5, minQty)) {
    urgency = { icon: "flame", text: `Only ${qty} left` };
  } else if (Number.isFinite(hoursLeft) && hoursLeft > 0 && hoursLeft <= 48) {
    urgency =
      hoursLeft <= 1
        ? { icon: "time", text: "Deal ends soon" }
        : hoursLeft <= 24
        ? { icon: "time", text: `Deal ends in ${Math.ceil(hoursLeft)}h` }
        : { icon: "time", text: "Deal ends tomorrow" };
  } else if (typeof qty === "number" && qty > 0 && qty <= 10) {
    urgency = { icon: "trending-up", text: "Selling fast" };
  }

  // Reason line priority: savings > campaign subtitle/badge > category fallback.
  const reason =
    savingsText || card.badge || companyName || (categoryLabel ? `A featured pick in ${categoryLabel}` : "A featured pick");

  return {
    productImage,
    productName,
    companyName,
    categoryLabel,
    priceText: formatPrice(displayPrice),
    originalPriceText: isDiscounted ? formatPrice(listed) : "",
    unit: displayPrice?.unit,
    isDiscounted,
    savings,
    savingsText,
    discountBadge,
    reason,
    urgency,
    ctaLabel: card.ctaLabel || "View product",
  };
};

type ShimmerImageProps = {
  uri?: string;
  style: ViewStyle;
  borderRadius?: number;
};

// Image with a premium sweeping-shimmer skeleton that fades out once the photo
// has loaded — no blank grey box while the network catches up.
export const ShimmerImage = ({ uri, style, borderRadius = 0 }: ShimmerImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const sweep = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loaded) return;
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [loaded, sweep]);

  useEffect(() => {
    if (!loaded) return;
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }, [loaded, fade]);

  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-160, 160] });

  return (
    <View style={[style, { borderRadius, overflow: "hidden", backgroundColor: "#EEF0F4" }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      ) : null}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={["#EEF0F4", "#F8F9FB", "#EEF0F4"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};
