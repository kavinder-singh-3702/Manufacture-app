import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../hooks/useTheme";
import type { Product } from "../../../services/product.service";

type Props = {
  product: Pick<Product, "_id" | "name" | "images" | "price">;
  onPress?: () => void;
};

/**
 * Pinned context card shown above the message list in seller chat. Mirrors
 * the "Re: <product>" affordance common to marketplace messengers (Etsy, eBay,
 * OLX) so both buyer and seller can see at a glance which item the chat is
 * about. Support chat omits this — no productId on the route, no card rendered.
 */
export const ChatProductContextCard = ({ product, onPress }: Props) => {
  const { colors, radius, spacing } = useTheme();

  const imageUrl = product.images?.[0]?.url;
  const priceText = product.price?.amount != null
    ? formatPrice(product.price.amount, product.price.currency)
    : null;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.thumbWrap,
          { borderRadius: radius.md, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
        )}
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Re:</Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {product.name || "Product"}
        </Text>
        {priceText ? (
          <Text style={[styles.price, { color: colors.primary }]} numberOfLines={1}>
            {priceText}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
};

const formatPrice = (amount: number, currency = "INR"): string => {
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  textBlock: { flex: 1, gap: 1 },
  label: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  price: { fontSize: 12, fontWeight: "700", marginTop: 2 },
});
