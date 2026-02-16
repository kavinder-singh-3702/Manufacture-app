import { memo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { HomeFeedRecommendation } from "../../../services/preference.service";

type RecommendedProductsRailProps = {
  recommendations: HomeFeedRecommendation[];
  loading?: boolean;
  onOpenProduct?: (productId: string) => void;
  onBrowseAll?: () => void;
};

const formatPrice = (amount?: number, currency?: string) => {
  if (amount === undefined || amount === null) return "Price on request";
  return `${currency || "INR"} ${amount.toLocaleString("en-IN")}`;
};

export const RecommendedProductsRail = memo(
  ({ recommendations, loading, onOpenProduct, onBrowseAll }: RecommendedProductsRailProps) => {
    const { colors, spacing, radius, nativeGradients } = useTheme();
    const { width } = useWindowDimensions();
    const { isXCompact, isCompact, clamp } = useResponsiveLayout();
    const cardWidth = clamp(Math.round(width * (isXCompact ? 0.72 : isCompact ? 0.62 : 0.56)), 176, 240);

    return (
      <LinearGradient
        colors={nativeGradients.recommendationShell}
        style={{
          gap: spacing.sm,
          borderRadius: radius.lg,
          padding: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text, fontSize: isCompact ? 16 : 18 }]}>Recommended for you</Text>
          <TouchableOpacity onPress={onBrowseAll} activeOpacity={0.8}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Based on what you searched, viewed, and added to cart recently.
        </Text>

        {loading ? (
          <View style={[styles.loader, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loaderLabel, { color: colors.textMuted }]}>Building recommendations...</Text>
          </View>
        ) : recommendations.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <Ionicons name="sparkles-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Interact with products to see tailored picks here.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {recommendations.map((entry) => (
              <TouchableOpacity
                key={entry.product._id}
                activeOpacity={0.88}
                onPress={() => onOpenProduct?.(entry.product._id)}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <LinearGradient
                  colors={nativeGradients.recommendationAccent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardAccent}
                />
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                  {entry.product.name}
                </Text>
                <Text style={[styles.reason, { color: colors.textMuted }]} numberOfLines={2}>
                  {entry.reason}
                </Text>
                <Text style={[styles.price, { color: colors.textSecondary }]}>
                  {formatPrice(entry.product.price?.amount, entry.product.price?.currency)}
                </Text>
                <View style={[styles.categoryPill, { backgroundColor: colors.badgePrimary, borderRadius: radius.pill }]}>
                  <Text style={[styles.categoryLabel, { color: colors.primary }]}>
                    {(entry.product.category || "Product").replace(/-/g, " ")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </LinearGradient>
    );
  }
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  loader: {
    minHeight: 120,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loaderLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  empty: {
    minHeight: 120,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  reason: {
    fontSize: 12,
    lineHeight: 17,
    minHeight: 34,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
  },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
