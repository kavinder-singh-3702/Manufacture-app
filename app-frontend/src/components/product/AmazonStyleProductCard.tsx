import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "../../services/product.service";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { AdaptiveSingleLineText } from "../text/AdaptiveSingleLineText";

type AmazonStyleProductCardProps = {
  product: Product;
  onPress: (productId: string) => void;
  onMessagePress?: (product: Product) => void;
  onCallPress?: (product: Product) => void;
  onPrimaryActionPress?: (product: Product) => void;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  showQuickActions?: boolean;
  showPrimaryAction?: boolean;
  containerStyle?: object;
};

const formatCurrency = (amount: number, currency?: string) => {
  const symbol = currency === "INR" || !currency ? "₹" : `${currency} `;
  return `${symbol}${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
};

const getRating = (product: Product): number | null => {
  const attrs = product.attributes as Record<string, unknown> | undefined;
  const rating = typeof attrs?.rating === "number" ? attrs.rating : typeof attrs?.stars === "number" ? attrs.stars : null;
  if (typeof rating !== "number" || Number.isNaN(rating)) return null;
  return Math.max(0, Math.min(5, rating));
};

const getReviewCount = (product: Product): number | null => {
  const attrs = product.attributes as Record<string, unknown> | undefined;
  const reviews = typeof attrs?.reviews === "number" ? attrs.reviews : null;
  return typeof reviews === "number" ? reviews : null;
};

const getCompareAt = (product: Product): number | null => {
  const attrs = product.attributes as Record<string, unknown> | undefined;
  const compareAt = typeof attrs?.mrp === "number" ? attrs.mrp : typeof attrs?.oldPrice === "number" ? attrs.oldPrice : null;
  return typeof compareAt === "number" && compareAt > (product.price?.amount || 0) ? compareAt : null;
};

const getStockStatus = (product: Product): "in_stock" | "low_stock" | "out_of_stock" => {
  const qty = Number(product.availableQuantity || 0);
  const min = Number(product.minStockQuantity || 0);
  if (qty <= 0) return "out_of_stock";
  if (qty <= min) return "low_stock";
  return "in_stock";
};

const getVariantSummaryText = (product: Product): string | null => {
  const summary = product.variantSummary;
  if (summary?.totalVariants && summary.totalVariants > 0) {
    const range =
      typeof summary.minPrice === "number" && typeof summary.maxPrice === "number"
        ? ` • ${formatCurrency(summary.minPrice, summary.currency || product.price?.currency)} - ${formatCurrency(
            summary.maxPrice,
            summary.currency || product.price?.currency
          )}`
        : "";
    return `${summary.totalVariants} variants${range}`;
  }

  const attrs = product.attributes as Record<string, unknown> | undefined;
  const fallback = typeof attrs?.variants === "number" ? attrs.variants : null;
  if (typeof fallback === "number" && fallback > 0) return `${fallback} variants`;
  return null;
};

export const AmazonStyleProductCard = memo(
  ({
    product,
    onPress,
    onMessagePress,
    onCallPress,
    onPrimaryActionPress,
    primaryActionLabel,
    primaryActionDisabled,
    showQuickActions = true,
    showPrimaryAction = false,
    containerStyle,
  }: AmazonStyleProductCardProps) => {
    const { colors, radius, spacing } = useTheme();
    const { resolvedMode } = useThemeMode();
    const { isCompact, isXCompact, clamp } = useResponsiveLayout();

    const palette = useMemo(
      () => ({
        cardBg: resolvedMode === "dark" ? "#10141C" : colors.surface,
        cardBorder: resolvedMode === "dark" ? "rgba(255,255,255,0.08)" : colors.border,
        imageBg: resolvedMode === "dark" ? "#161B26" : colors.surfaceElevated,
        title: colors.text,
        subtext: colors.textMuted,
        text: colors.textSecondary,
        price: colors.text,
        compare: colors.textMuted,
        badgeInStock: colors.success,
        badgeLow: colors.warning,
        badgeOut: colors.error,
      }),
      [colors, resolvedMode]
    );

    const imageSize = clamp(isXCompact ? 84 : isCompact ? 96 : 116, 82, 124);
    const styles = useMemo(
      () =>
        createStyles(colors, palette, radius, spacing, {
          imageSize,
          compact: isCompact,
          xCompact: isXCompact,
        }),
      [colors, imageSize, isCompact, isXCompact, palette, radius, spacing]
    );

    const primaryImage = product.images?.[0]?.url;
    const price = Number(product.price?.amount || 0);
    const currency = product.price?.currency || "INR";
    const compareAt = getCompareAt(product);
    const rating = getRating(product);
    const reviewCount = getReviewCount(product);
    const variantText = getVariantSummaryText(product);
    const seller = product.company?.displayName || "Seller";
    const isVerified = product.company?.complianceStatus === "approved";
    const stockStatus = getStockStatus(product);

    const stockLabel =
      stockStatus === "in_stock" ? "In stock" : stockStatus === "low_stock" ? "Low stock" : "Out of stock";
    const stockColor =
      stockStatus === "in_stock" ? palette.badgeInStock : stockStatus === "low_stock" ? palette.badgeLow : palette.badgeOut;

    const showMessage = showQuickActions && Boolean(onMessagePress);
    const showCall = showQuickActions && Boolean(onCallPress);

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => onPress(product._id)}
        style={[styles.card, containerStyle]}
      >
        <View style={styles.row}>
          <View style={styles.imageContainer}>
            {primaryImage ? (
              <Image source={{ uri: primaryImage }} style={styles.productImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="image-outline" size={24} color={palette.subtext} />
                <Text style={styles.placeholderText}>No image</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <AdaptiveSingleLineText minimumFontScale={0.72} style={styles.title}>
              {product.name}
            </AdaptiveSingleLineText>

            <View style={styles.sellerRow}>
              <AdaptiveSingleLineText minimumFontScale={0.72} style={styles.sellerText}>
                {seller}
              </AdaptiveSingleLineText>
              {isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.verifiedLabel}>Verified</Text>
                </View>
              ) : null}
            </View>

            {rating !== null ? (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons
                      key={n}
                      name={n <= Math.floor(rating) ? "star" : "star-outline"}
                      size={12}
                      color={colors.warning}
                    />
                  ))}
                </View>
                {reviewCount !== null ? (
                  <Text style={styles.reviewCount}>({reviewCount.toLocaleString("en-IN")})</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatCurrency(price, currency)}</Text>
              {compareAt ? <Text style={styles.comparePrice}>{formatCurrency(compareAt, currency)}</Text> : null}
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.stockBadge, { borderColor: `${stockColor}66`, backgroundColor: `${stockColor}1A` }]}>
                <Text style={[styles.stockText, { color: stockColor }]}>{stockLabel}</Text>
              </View>
              <Text style={styles.quantityText}>{Number(product.availableQuantity || 0)} {product.unit || "units"}</Text>
            </View>

            {variantText ? <Text style={styles.variantText}>{variantText}</Text> : null}
          </View>
        </View>

        {(showMessage || showCall || (showPrimaryAction && primaryActionLabel && onPrimaryActionPress)) ? (
          <View style={styles.actionsRow}>
            {showMessage ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.secondaryAction}
                onPress={() => onMessagePress?.(product)}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                <Text style={styles.secondaryActionText}>Message</Text>
              </TouchableOpacity>
            ) : null}

            {showCall ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.secondaryAction}
                onPress={() => onCallPress?.(product)}
              >
                <Ionicons name="call-outline" size={16} color={colors.primary} />
                <Text style={styles.secondaryActionText}>Call</Text>
              </TouchableOpacity>
            ) : null}

            {showPrimaryAction && primaryActionLabel && onPrimaryActionPress ? (
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={primaryActionDisabled}
                style={[styles.primaryAction, primaryActionDisabled ? styles.primaryActionDisabled : null]}
                onPress={() => onPrimaryActionPress(product)}
              >
                <Text style={styles.primaryActionText}>{primaryActionLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }
);

type CardLayout = {
  imageSize: number;
  compact: boolean;
  xCompact: boolean;
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  palette: Record<string, string>,
  radius: ReturnType<typeof useTheme>["radius"],
  spacing: ReturnType<typeof useTheme>["spacing"],
  layout: CardLayout
) =>
  StyleSheet.create({
    card: {
      backgroundColor: palette.cardBg,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    imageContainer: {
      width: layout.imageSize,
      height: layout.imageSize,
      borderRadius: radius.md,
      backgroundColor: palette.imageBg,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    productImage: {
      width: "100%",
      height: "100%",
    },
    placeholder: {
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    placeholderText: {
      fontSize: 11,
      fontWeight: "700",
      color: palette.subtext,
    },
    content: {
      flex: 1,
      minHeight: layout.imageSize,
      minWidth: 0,
    },
    title: {
      fontSize: layout.xCompact ? 13 : layout.compact ? 14 : 15,
      fontWeight: "800",
      color: palette.title,
      lineHeight: layout.xCompact ? 18 : 20,
    },
    sellerRow: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sellerText: {
      fontSize: 12,
      fontWeight: "700",
      color: palette.text,
      flex: 1,
      minWidth: 0,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    verifiedLabel: {
      color: colors.success,
      fontSize: 11,
      fontWeight: "700",
    },
    ratingRow: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    ratingValue: {
      color: palette.text,
      fontSize: 12,
      fontWeight: "800",
    },
    starsRow: {
      flexDirection: "row",
      gap: 1,
    },
    reviewCount: {
      color: palette.subtext,
      fontSize: 11,
      fontWeight: "600",
    },
    priceRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
    },
    price: {
      color: palette.price,
      fontSize: layout.compact ? 16 : 18,
      fontWeight: "900",
    },
    comparePrice: {
      color: palette.compare,
      fontSize: 12,
      fontWeight: "700",
      textDecorationLine: "line-through",
    },
    metaRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    stockBadge: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    stockText: {
      fontSize: 11,
      fontWeight: "800",
      textTransform: "capitalize",
    },
    quantityText: {
      color: palette.subtext,
      fontSize: 11,
      fontWeight: "700",
    },
    variantText: {
      marginTop: 6,
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    actionsRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: layout.xCompact ? "wrap" : "nowrap",
    },
    secondaryAction: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      paddingVertical: 10,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.surface,
    },
    secondaryActionText: {
      color: colors.primary,
      fontSize: layout.xCompact ? 11 : 12,
      fontWeight: "800",
    },
    primaryAction: {
      flex: layout.xCompact ? 1 : 1.2,
      minHeight: 42,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryActionDisabled: {
      opacity: 0.45,
    },
    primaryActionText: {
      color: colors.textOnPrimary,
      fontSize: layout.xCompact ? 11 : 12,
      fontWeight: "900",
      letterSpacing: 0.2,
    },
  });

export default AmazonStyleProductCard;
