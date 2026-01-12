import React, { memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Product } from "../../services/product.service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2; // 2 columns with padding

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
};

interface AmazonStyleProductCardProps {
  product: Product;
  onPress: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onWishlistToggle?: (productId: string) => void;
  isInCart?: boolean;
  cartQuantity?: number;
  isWishlisted?: boolean;
  isGuest?: boolean;
}

export const AmazonStyleProductCard = memo(
  ({
    product,
    onPress,
    onAddToCart,
    onWishlistToggle,
    isInCart = false,
    cartQuantity = 0,
    isWishlisted = false,
    isGuest = false,
  }: AmazonStyleProductCardProps) => {
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

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          console.log("Clicking product with _id:", product._id);
          console.log("Full product object:", JSON.stringify(product, null, 2));
          onPress(product._id);
        }}
        style={styles.card}
      >
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
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% off</Text>
          </View>
        )}

        {/* Product Image */}
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.productImage}
              resizeMode="contain"
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
              <Text style={styles.freeDelivery}>FREE Delivery</Text>
            ) : (
              <Text style={styles.deliveryText}>Delivery {currencySymbol}40</Text>
            )}
            <Text style={styles.deliveryDate}>Get it by {deliveryDate}</Text>
          </View>


          {/* Add to Cart Button */}
          {!isGuest && (
            <TouchableOpacity
              style={[styles.addToCartButton, isInCart && styles.addToCartButtonAdded]}
              onPress={() => onAddToCart(product, 1)}
              activeOpacity={0.8}
            >
              <Text style={[styles.addToCartText, isInCart && styles.addToCartTextAdded]}>
                {isInCart ? `In Cart (${cartQuantity})` : "Add to Cart"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },

  // Wishlist
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  wishlistIcon: {
    fontSize: 18,
    color: COLORS.wishlist,
  },
  wishlistIconActive: {
    color: COLORS.wishlistActive,
  },

  // Discount Badge
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.dealBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: COLORS.deal + "40",
  },
  discountText: {
    color: COLORS.deal,
    fontSize: 11,
    fontWeight: "700",
  },

  // Image
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.85,
    backgroundColor: COLORS.cardBgLight,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  productImage: {
    width: "85%",
    height: "85%",
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
    fontSize: 12,
  },

  // Info
  infoContainer: {
    padding: 12,
    gap: 4,
  },

  // Sponsored
  sponsoredText: {
    fontSize: 10,
    color: COLORS.sponsored,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Title
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 4,
  },

  // Seller
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  sellerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: COLORS.verified + "20",
    borderWidth: 1,
    borderColor: COLORS.verified + "60",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    color: COLORS.verified,
    fontSize: 9,
    fontWeight: "700",
  },

  // Rating
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 1,
  },
  star: {
    fontSize: 11,
  },
  starFilled: {
    color: COLORS.rating,
  },
  starEmpty: {
    color: COLORS.textMuted,
  },
  ratingText: {
    fontSize: 11,
    color: COLORS.rating,
    fontWeight: "600",
  },
  reviewCount: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Price
  priceSection: {
    marginTop: 4,
  },
  dealRow: {
    marginBottom: 4,
  },
  dealLabel: {
    fontSize: 10,
    color: COLORS.deal,
    backgroundColor: COLORS.dealBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.price,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.price,
  },
  priceAmountDeal: {
    color: COLORS.priceDeal,
  },
  priceDecimal: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.price,
  },
  originalPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  mrpLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },

  // Delivery
  deliverySection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  freeDelivery: {
    fontSize: 11,
    color: COLORS.deal,
    fontWeight: "600",
  },
  deliveryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  deliveryDate: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Add to Cart
  addToCartButton: {
    backgroundColor: COLORS.addToCart,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  addToCartButtonAdded: {
    backgroundColor: COLORS.deal + "20",
    borderWidth: 1,
    borderColor: COLORS.deal + "40",
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  addToCartTextAdded: {
    color: COLORS.deal,
  },
});

export default AmazonStyleProductCard;
