import React, { memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Product } from "../../services/product.service";
import { scale, moderateScale } from "../../utils/responsive";

// Dark premium color palette (matching app theme)
const COLORS = {
  background: "#0a0a0f",
  cardBg: "#16161e",
  cardBgLight: "#1e1e28",
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  text: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textMuted: "rgba(255, 255, 255, 0.5)",
  price: "#ffffff",
  priceDeal: "#5ed4a5",
  accent: "#7c8aff",
  accentMuted: "#5a6fd6",
  rating: "#f0b429",
  ratingBg: "rgba(240, 180, 41, 0.15)",
  deal: "#5ed4a5",
  dealBg: "rgba(94, 212, 165, 0.15)",
  addToCart: "#7c8aff",
  addToCartPressed: "#5a6fd6",
  addToCartBorder: "#7c8aff",
  wishlist: "rgba(255, 255, 255, 0.5)",
  wishlistActive: "#ef6b6b",
  verified: "#5ed4a5",
  unverified: "#f0b429",
  sponsored: "rgba(255, 255, 255, 0.4)",
  // Amazon-style additions
  bestSeller: "#c45500", // Amazon orange
  bestSellerBg: "#fef3e2",
  urgency: "#cc0c39", // Red urgency text
  linkBlue: "#007185",
};

interface AmazonStyleProductCardProps {
  product: Product;
  onPress: (productId: string) => void;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
  isGuest?: boolean;
}

export const AmazonStyleProductCard = memo(
  ({
    product,
    onPress,
    onWishlistToggle,
    isWishlisted = false,
    isGuest = false,
  }: AmazonStyleProductCardProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CARD_WIDTH = SCREEN_WIDTH; // Full width single column
    const IMAGE_HEIGHT = scale(280); // Responsive height for better image visibility

    const price = product.price?.amount || 0;
    const currencySymbol = product.price?.currency === "INR" ? "₹" : product.price?.currency || "₹";

    const attributes = product.attributes as Record<string, any> | undefined;
    const compareAt =
      typeof attributes?.mrp === "number"
        ? attributes.mrp
        : typeof attributes?.oldPrice === "number"
        ? attributes.oldPrice
        : undefined;

    const hasDiscount = typeof compareAt === "number" && compareAt > price;
    const discountPercent = hasDiscount ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

    const primaryImage = product.images?.[0]?.url;
    const companyName = product.company?.displayName || "Unknown seller";
    const isVerified = product.company?.complianceStatus === "approved";

    // Rating from attributes
    const ratingValue =
      typeof attributes?.rating === "number"
        ? attributes.rating
        : typeof attributes?.stars === "number"
        ? attributes.stars
        : null;

    const reviewCount = typeof attributes?.reviews === "number" ? attributes.reviews : null;

    // Mock delivery date (you can make this dynamic)
    const deliveryDate = "Tomorrow";
    const hasFreeDelivery = price >= 499;

    // Amazon-style additional attributes
    // Using product index hash for demo variety (some products show different badges)
    const productHash = product._id ? product._id.charCodeAt(0) % 10 : 0;
    const isBestSeller = attributes?.bestSeller === true || attributes?.isBestSeller === true || productHash < 3; // ~30% show best seller
    const stockQuantity = product.inventory?.quantity ?? product.availableQuantity ?? attributes?.stock ?? null;
    const isLowStock = (typeof stockQuantity === "number" && stockQuantity > 0 && stockQuantity <= 5) || productHash === 4;
    const variantCount = typeof attributes?.variants === "number" ? attributes.variants :
                         typeof attributes?.colors === "number" ? attributes.colors :
                         productHash > 6 ? (productHash - 4) : null; // Some products show variants

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          console.log("Clicking product with _id:", product._id);
          console.log("Full product object:", JSON.stringify(product, null, 2));
          onPress(product._id);
        }}
        style={[styles.card, { width: CARD_WIDTH }]}
      >
        {/* Best Seller Badge - Amazon style orange tag */}
        {isBestSeller && (
          <View style={styles.bestSellerBadge}>
            <Text style={styles.bestSellerText}>Best seller</Text>
          </View>
        )}

        {/* Wishlist Button */}
        {!isGuest && onWishlistToggle && (
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={() => onWishlistToggle(product._id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.wishlistIcon, isWishlisted && styles.wishlistIconActive]}>
              {isWishlisted ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Discount Badge */}
        {hasDiscount && discountPercent > 0 && (
          <View style={[styles.discountBadge, isBestSeller && styles.discountBadgeWithBestSeller]}>
            <Text style={styles.discountText}>{discountPercent}% off</Text>
          </View>
        )}

        {/* Product Image */}
        <View style={[styles.imageContainer, { height: IMAGE_HEIGHT }]}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.productImage}
              resizeMode="contain"
              onError={(e) => console.log("Image load error:", e.nativeEvent.error, primaryImage)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          {/* Sponsored tag (optional - show for some products) */}
          {attributes?.sponsored && (
            <Text style={styles.sponsoredText}>Sponsored</Text>
          )}

          {/* Product Title */}
          <Text style={styles.title} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Seller with verification */}
          <View style={styles.sellerRow}>
            <Text style={styles.sellerText} numberOfLines={1}>
              by {companyName}
            </Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>

          {/* Rating */}
          {ratingValue !== null && (
            <View style={styles.ratingRow}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text
                    key={star}
                    style={[
                      styles.star,
                      star <= Math.floor(ratingValue) ? styles.starFilled : styles.starEmpty,
                    ]}
                  >
                    ★
                  </Text>
                ))}
              </View>
              <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
              {reviewCount !== null && (
                <Text style={styles.reviewCount}>({reviewCount.toLocaleString()})</Text>
              )}
            </View>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            {hasDiscount && (
              <View style={styles.dealRow}>
                <Text style={styles.dealLabel}>Deal</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
              <Text style={[styles.priceAmount, hasDiscount && styles.priceAmountDeal]}>
                {Math.floor(price).toLocaleString()}
              </Text>
              {price % 1 !== 0 && (
                <Text style={styles.priceDecimal}>
                  {(price % 1).toFixed(2).substring(1)}
                </Text>
              )}
            </View>
            {hasDiscount && compareAt && (
              <View style={styles.originalPriceRow}>
                <Text style={styles.mrpLabel}>M.R.P.: </Text>
                <Text style={styles.originalPrice}>
                  {currencySymbol}{compareAt.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Delivery Info */}
          <View style={styles.deliverySection}>
            {hasFreeDelivery ? (
              <Text style={styles.freeDelivery}>FREE Delivery <Text style={styles.deliveryDateBold}>Tue, 20 Jan</Text></Text>
            ) : (
              <Text style={styles.deliveryText}>Delivery {currencySymbol}40</Text>
            )}
            {isLowStock && (
              <Text style={styles.urgencyText}>Only {stockQuantity} left in stock.</Text>
            )}
          </View>

          {/* Variant Options - Amazon style */}
          {variantCount && variantCount > 0 && (
            <Text style={styles.variantLink}>+{variantCount} other colors/patterns</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    // width is set dynamically via inline style
    backgroundColor: COLORS.cardBg,
    borderRadius: 0, // No rounded corners for edge-to-edge look
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 0,
    overflow: "hidden",
    position: "relative",
  },

  // Wishlist
  wishlistButton: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    zIndex: 10,
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  wishlistIcon: {
    fontSize: moderateScale(18),
    color: COLORS.wishlist,
  },
  wishlistIconActive: {
    color: COLORS.wishlistActive,
  },

  // Best Seller Badge - Amazon orange tag style
  bestSellerBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: COLORS.bestSellerBg,
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderBottomRightRadius: scale(8),
    zIndex: 11,
  },
  bestSellerText: {
    color: COLORS.bestSeller,
    fontSize: moderateScale(11),
    fontWeight: "700",
  },

  // Discount Badge
  discountBadge: {
    position: "absolute",
    top: scale(8),
    left: scale(8),
    backgroundColor: COLORS.dealBg,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    zIndex: 10,
    borderWidth: 1,
    borderColor: COLORS.deal + "40",
  },
  discountBadgeWithBestSeller: {
    top: scale(32), // Move down when best seller badge is present
  },
  discountText: {
    color: COLORS.deal,
    fontSize: moderateScale(11),
    fontWeight: "700",
  },

  // Image
  imageContainer: {
    width: "100%",
    // height is set dynamically via inline style
    backgroundColor: COLORS.cardBgLight,
    alignItems: "center",
    justifyContent: "center",
    padding: scale(12),
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBgLight,
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: moderateScale(12),
  },

  // Info
  infoContainer: {
    padding: scale(12),
    gap: scale(4),
  },

  // Sponsored
  sponsoredText: {
    fontSize: moderateScale(10),
    color: COLORS.sponsored,
    marginBottom: scale(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Title
  title: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: moderateScale(18),
    marginBottom: scale(4),
  },

  // Seller
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(6),
  },
  sellerText: {
    fontSize: moderateScale(11),
    color: COLORS.textSecondary,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: COLORS.verified + "20",
    borderWidth: 1,
    borderColor: COLORS.verified + "60",
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    color: COLORS.verified,
    fontSize: moderateScale(9),
    fontWeight: "700",
  },

  // Rating
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(6),
  },
  starsContainer: {
    flexDirection: "row",
    gap: scale(1),
  },
  star: {
    fontSize: moderateScale(11),
  },
  starFilled: {
    color: COLORS.rating,
  },
  starEmpty: {
    color: COLORS.textMuted,
  },
  ratingText: {
    fontSize: moderateScale(11),
    color: COLORS.rating,
    fontWeight: "600",
  },
  reviewCount: {
    fontSize: moderateScale(10),
    color: COLORS.textMuted,
  },

  // Price
  priceSection: {
    marginTop: scale(4),
  },
  dealRow: {
    marginBottom: scale(4),
  },
  dealLabel: {
    fontSize: moderateScale(10),
    color: COLORS.deal,
    backgroundColor: COLORS.dealBg,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
    alignSelf: "flex-start",
    fontWeight: "700",
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currencySymbol: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: COLORS.price,
  },
  priceAmount: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: COLORS.price,
  },
  priceAmountDeal: {
    color: COLORS.priceDeal,
  },
  priceDecimal: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    color: COLORS.price,
  },
  originalPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(2),
  },
  mrpLabel: {
    fontSize: moderateScale(11),
    color: COLORS.textMuted,
  },
  originalPrice: {
    fontSize: moderateScale(11),
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },

  // Delivery
  deliverySection: {
    marginTop: scale(8),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  freeDelivery: {
    fontSize: moderateScale(11),
    color: COLORS.text,
    fontWeight: "400",
  },
  deliveryDateBold: {
    fontWeight: "700",
    color: COLORS.text,
  },
  deliveryText: {
    fontSize: moderateScale(11),
    color: COLORS.textSecondary,
  },
  deliveryDate: {
    fontSize: moderateScale(10),
    color: COLORS.textMuted,
    marginTop: scale(2),
  },
  urgencyText: {
    fontSize: moderateScale(11),
    color: COLORS.urgency,
    marginTop: scale(4),
    fontWeight: "500",
  },
  variantLink: {
    fontSize: moderateScale(11),
    color: COLORS.linkBlue,
    marginTop: scale(6),
    textDecorationLine: "underline",
  },
});

export default AmazonStyleProductCard;
