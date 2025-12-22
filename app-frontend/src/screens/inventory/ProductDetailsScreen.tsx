import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import { Product, productService } from "../../services/product.service";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";

export const ProductDetailsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ProductDetails">>();
  const { productId } = route.params;

  const { addToCart, isInCart, getCartItem, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getById(productId);
      setProduct(response);
    } catch (err: any) {
      setError(err?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const sliderWidth = Dimensions.get("window").width - spacing.lg * 2;
  const images =
    product?.images && product.images.length > 0
      ? product.images
      : ([{ url: undefined, fileName: "placeholder" }] as Product["images"]);
  const [activeImage, setActiveImage] = useState(0);

  const packSize = product?.unit || product?.price?.unit;
  const attributes = product?.attributes as Record<string, any> | undefined;
  const companyName = product?.company?.displayName || "Unknown company";
  const compliance = product?.company?.complianceStatus;
  const verified = compliance === "approved";
  const ratingValue =
    typeof attributes?.rating === "number"
      ? attributes.rating
      : typeof attributes?.stars === "number"
      ? attributes.stars
      : 0;
  const companyPhone =
    product?.company && typeof product.company === "object" && "contact" in product.company
      ? (product.company as any).contact?.phone
      : undefined;
  const compareAt =
    typeof attributes?.mrp === "number"
      ? attributes.mrp
      : typeof attributes?.oldPrice === "number"
      ? attributes.oldPrice
      : undefined;

  const currencySymbol = product?.price?.currency === "INR" ? "₹" : product?.price?.currency || "₹";
  const priceLabel = product ? `${currencySymbol}${(product.price?.amount || 0).toFixed(2)}` : "";
  const compareAtLabel =
    product && typeof compareAt === "number" && compareAt > (product.price?.amount || 0)
      ? `${currencySymbol}${compareAt.toFixed(2)}`
      : undefined;

  const inCart = product ? isInCart(product._id) : false;
  const cartQty = product && inCart ? getCartItem(product._id)?.quantity || 0 : 0;

  const stockLabel = useMemo(() => {
    if (!product) return "";
    if (product.availableQuantity <= 0) return "Out of stock";
    if (product.availableQuantity <= product.minStockQuantity) return "Low stock";
    return `${product.availableQuantity} available`;
  }, [product]);

  const handleAdd = useCallback(() => {
    if (!product) return;
    addToCart(product, 1);
  }, [addToCart, product]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[styles.backButton, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Product Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={[styles.centerContent, { padding: spacing.lg }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading product...</Text>
        </View>
      ) : error ? (
        <View style={[styles.centerContent, { padding: spacing.lg, gap: spacing.sm }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={loadProduct} style={[styles.retryButton, { borderColor: colors.primary, borderRadius: radius.sm }]}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : product ? (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: spacing.xxxl || spacing.xxl,
            gap: spacing.lg,
          }}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                shadowColor: "#000",
              },
            ]}
          >
            <View style={[styles.imageWrap, { borderRadius: radius.md }]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / sliderWidth);
                  setActiveImage(idx);
                }}
                scrollEventThrottle={16}
              >
                {images.map((img, index) =>
                  img.url ? (
                    <Image
                      key={img.key || img.url || index}
                      source={{ uri: img.url }}
                      style={[styles.heroImage, { borderRadius: radius.md, width: sliderWidth }]}
                      resizeMode="contain"
                    />
                  ) : (
                    <View
                      key={`placeholder-${index}`}
                      style={[styles.imagePlaceholder, { borderRadius: radius.md, width: sliderWidth }]}
                    >
                      <Text style={{ fontSize: 28 }}>🛍️</Text>
                    </View>
                  )
                )}
              </ScrollView>
              {images.length > 1 && (
                <View style={[styles.dotsRow, { marginTop: spacing.sm }]}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: idx === activeImage ? colors.primary : colors.textMuted + "55",
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={3}>
              {product.name}
            </Text>
            <View style={styles.companyRow}>
              <Text style={[styles.companyName, { color: colors.textMuted }]} numberOfLines={2}>
                {companyName}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: verified ? "#e0f2fe" : "#fff7ed",
                    borderColor: verified ? "#0ea5e9" : "#fb923c",
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: verified ? "#0ea5e9" : "#f97316" }]}>
                  {verified ? "Verified" : "Unverified"}
                </Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <Text key={idx} style={[styles.star, { color: ratingValue >= idx + 1 ? "#facc15" : colors.textMuted }]}>
                  ★
                </Text>
              ))}
              <Text style={[styles.ratingValue, { color: colors.textMuted }]}>
                {ratingValue ? ratingValue.toFixed(1) : "No rating"}
              </Text>
            </View>

            {packSize ? (
              <Text style={[styles.productMeta, { color: colors.textMuted }]}>{packSize}</Text>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: colors.text }]}>{priceLabel}</Text>
              {compareAtLabel ? (
                <Text style={[styles.comparePrice, { color: colors.textMuted }]}>{compareAtLabel}</Text>
              ) : null}
            </View>

            <View style={{ marginTop: spacing.md, flexDirection: "row", gap: spacing.lg }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Category</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{product.category}</Text>
              </View>
            </View>

            {product.description ? (
              <View
                style={[
                  styles.descriptionBox,
                  { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md },
                ]}
              >
                <Text style={[styles.descriptionLabel, { color: colors.text }]}>Description</Text>
                <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{product.description}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (product?.createdBy) {
                  navigation.navigate("Chat", {
                    conversationId: product.createdBy,
                    recipientId: product.createdBy,
                    recipientName: product.company?.displayName || "Seller",
                    meta: { productId: product._id, productName: product.name },
                  } as any);
                }
              }}
              style={[
                styles.messageButton,
                { borderRadius: radius.md, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.messageButtonText, { color: colors.primary }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (!companyPhone) return;
                Linking.openURL(`tel:${companyPhone}`).catch(() => {
                  Alert.alert("Call failed", "Could not start call on this device.");
                });
              }}
              disabled={!companyPhone}
              style={[
                styles.callButton,
                {
                  borderRadius: radius.md,
                  opacity: companyPhone ? 1 : 0.5,
                  backgroundColor: companyPhone ? "#4f46e5" : colors.border,
                },
              ]}
            >
              <Text style={[styles.callButtonText, { color: companyPhone ? "#fff" : colors.textMuted }]}>
                {companyPhone ? "Call" : "No Phone"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.quantityCard}>
              <View style={styles.quantityHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quantity</Text>
                <Text style={[styles.qtyHint, { color: colors.textMuted }]}>{cartQty ? `${cartQty} in cart` : "Not added"}</Text>
              </View>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (!product) return;
                    if (cartQty <= 1) {
                      removeFromCart(product._id);
                    } else {
                      updateQuantity(product._id, cartQty - 1);
                    }
                  }}
                  style={[styles.qtyButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  disabled={!product}
                >
                  <Text style={[styles.qtyButtonText, { color: colors.text }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.qtyValue, { color: colors.text }]}>{cartQty || 0}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (product) addToCart(product, 1);
                  }}
                  style={[styles.qtyButton, { backgroundColor: "#4f46e5" }]}
                  disabled={!product}
                >
                  <Text style={[styles.qtyButtonText, { color: "#fff" }]}>＋</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { fontSize: 18, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  centerContent: { alignItems: "center", justifyContent: "center", gap: 8 },
  loadingText: { fontSize: 14, fontWeight: "600" },
  errorText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1.5 },
  retryText: { fontSize: 14, fontWeight: "700" },
  card: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrap: { width: "100%", height: 260, backgroundColor: "#f7f7f7", marginBottom: 16, alignItems: "center", justifyContent: "center" },
  heroImage: { width: "100%", height: "100%" },
  imagePlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" },
  productTitle: { fontSize: 20, fontWeight: "800" },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  companyName: { flex: 1, fontSize: 14, fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  star: { fontSize: 13 },
  ratingValue: { fontSize: 12, fontWeight: "700" },
  productMeta: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 8 },
  priceText: { fontSize: 22, fontWeight: "900" },
  comparePrice: { fontSize: 16, fontWeight: "700", textDecorationLine: "line-through" },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  description: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  metaLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 14, fontWeight: "700" },
  descriptionBox: { marginTop: 12, padding: 12, borderWidth: 1 },
  descriptionLabel: { fontSize: 14, fontWeight: "800", marginBottom: 6 },
  descriptionText: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  addButton: {
  },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  messageButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1.5,
    alignItems: "center",
    backgroundColor: "#1f2937",
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  messageButtonText: { fontSize: 14, fontWeight: "800" },
  callButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  callButtonText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  quantityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    borderColor: "#1f2937",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  quantityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  qtyHint: { fontSize: 12, fontWeight: "700" },
  quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  qtyButton: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  qtyButtonText: { fontSize: 20, fontWeight: "800" },
  qtyValue: { fontSize: 16, fontWeight: "800" },
  dotsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
