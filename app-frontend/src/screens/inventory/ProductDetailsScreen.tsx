import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { RootStackParamList } from "../../navigation/types";
import { Product, productService } from "../../services/product.service";
import { ProductVariant, productVariantService } from "../../services/productVariant.service";
import { quoteService } from "../../services/quote.service";
import { useToast } from "../../components/ui/Toast";
import { callProductSeller, startProductConversation } from "../product/utils/productContact";
import { QuoteRequestFormSubmit, QuoteRequestSheet } from "../quotes/components/QuoteRequestSheet";

type ScreenRoute = RouteProp<RootStackParamList, "ProductDetails">;
const SCREEN_WIDTH = Dimensions.get("window").width;

const getRating = (product: Product): number | null => {
  const attrs = product.attributes as Record<string, unknown> | undefined;
  const value = typeof attrs?.rating === "number" ? attrs.rating : typeof attrs?.stars === "number" ? attrs.stars : null;
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(5, value));
};

const getCompareAt = (product: Product): number | null => {
  const attrs = product.attributes as Record<string, unknown> | undefined;
  const compareAt = typeof attrs?.mrp === "number" ? attrs.mrp : typeof attrs?.oldPrice === "number" ? attrs.oldPrice : null;
  return typeof compareAt === "number" && compareAt > Number(product.price?.amount || 0) ? compareAt : null;
};

const currencyFormat = (amount: number, currency?: string) => {
  const symbol = currency === "INR" || !currency ? "₹" : `${currency} `;
  return `${symbol}${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
};

const variantLabel = (variant: ProductVariant) => {
  if (variant.title?.trim()) return variant.title;
  const entries = Object.entries((variant.options || {}) as Record<string, unknown>);
  if (!entries.length) return "Variant";
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" • ");
};

const parseApiErrorMessage = (error: any): string => {
  if (Array.isArray(error?.data?.errors) && error.data.errors.length > 0) {
    const first = error.data.errors[0];
    if (first?.msg) return String(first.msg);
  }
  return error?.message || "Unable to submit quote request.";
};

export const ProductDetailsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ScreenRoute>();
  const { productId, product: passedProduct } = route.params;
  const { user, requestLogin } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [product, setProduct] = useState<Product | null>(passedProduct || null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteSheetOpen, setQuoteSheetOpen] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  const isGuest = user?.role === "guest";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProduct = await productService.getById(productId, {
        scope: "marketplace",
        includeVariantSummary: true,
      });
      setProduct(fetchedProduct);

      try {
        const variantRes = await productVariantService.list(productId, {
          scope: "marketplace",
          limit: 50,
          offset: 0,
        });
        setVariants(variantRes.variants || []);
        setSelectedVariantId((prev) => {
          if (prev && variantRes.variants.some((variant) => variant._id === prev)) return prev;
          return variantRes.variants?.[0]?._id || null;
        });
      } catch {
        setVariants([]);
        setSelectedVariantId(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant._id === selectedVariantId) || null,
    [selectedVariantId, variants]
  );
  const selectedVariantObjectId = selectedVariant?._id;

  const isOwnProduct = useMemo(() => {
    if (!product || !user) return false;
    if (product.createdBy && user.id && String(product.createdBy) === String(user.id)) return true;
    if (product.company?._id && user.activeCompany && String(product.company._id) === String(user.activeCompany)) return true;
    return false;
  }, [product, user]);
  const canManageVariants = isOwnProduct || user?.role === "admin";

  const images = useMemo(() => {
    if (product?.images?.length) return product.images;
    return [{ url: undefined, fileName: "placeholder" }];
  }, [product?.images]);

  const displayPrice = selectedVariant?.price?.amount ?? product?.price?.amount ?? 0;
  const displayCurrency = selectedVariant?.price?.currency || product?.price?.currency || "INR";
  const compareAt = product ? getCompareAt(product) : null;
  const rating = product ? getRating(product) : null;
  const displayStock = selectedVariant ? Number(selectedVariant.availableQuantity || 0) : Number(product?.availableQuantity || 0);

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name} - ${currencyFormat(displayPrice, displayCurrency)}`,
      });
    } catch {
      toastError("Share failed", "Could not open share menu.");
    }
  }, [displayCurrency, displayPrice, product, toastError]);

  const openManageVariants = useCallback(() => {
    if (!product) return;
    if (isGuest) {
      requestLogin();
      return;
    }
    navigation.navigate("ProductVariants", {
      productId: product._id,
      productName: product.name,
      scope: "company",
    });
  }, [isGuest, navigation, product, requestLogin]);

  const openQuoteSheet = useCallback(() => {
    if (isGuest) {
      requestLogin();
      return;
    }
    setQuoteSheetOpen(true);
  }, [isGuest, requestLogin]);

  const submitQuoteRequest = useCallback(
    async (payload: QuoteRequestFormSubmit) => {
      if (!product) return;
      try {
        setQuoteSubmitting(true);
        await quoteService.create({
          productId: product._id,
          variantId: selectedVariantObjectId,
          quantity: payload.quantity,
          requirements: payload.requirements,
          targetPrice: payload.targetPrice,
          currency: payload.targetPrice !== undefined ? "INR" : undefined,
          requiredBy: payload.requiredBy,
          buyerContact: payload.buyerContact,
        });
        setQuoteSheetOpen(false);
        toastSuccess("Quote requested", "Your request has been sent to the seller.");
        navigation.navigate("QuoteCenter", { initialTab: "asked" });
      } catch (err: any) {
        toastError("Quote request failed", parseApiErrorMessage(err));
      } finally {
        setQuoteSubmitting(false);
      }
    },
    [navigation, product, selectedVariantObjectId, toastError, toastSuccess]
  );

  const sellerName = product?.company?.displayName || "Seller";
  const heroWidth = Math.max(280, SCREEN_WIDTH - spacing.lg * 2 - 2);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.topBar, { borderBottomColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>Product</Text>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => navigation.navigate("ProductSearch")} hitSlop={8}>
            <Ionicons name="search-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} hitSlop={8}>
            <Ionicons name="share-social-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading product...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { borderColor: colors.primary, borderRadius: radius.md }]} onPress={loadData}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : product ? (
        <>
          <ScrollView
            contentContainerStyle={{
              padding: spacing.lg,
              gap: spacing.md,
              paddingBottom: 130,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.galleryCard, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}> 
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const width = event.nativeEvent.layoutMeasurement.width;
                  const page = Math.round(event.nativeEvent.contentOffset.x / width);
                  setActiveImage(page);
                }}
                scrollEventThrottle={16}
              >
                {images.map((image, index) =>
                  image.url ? (
                    <Image
                      key={`${image.url}-${index}`}
                      source={{ uri: image.url }}
                      style={[styles.heroImage, { width: heroWidth }]}
                      resizeMode="contain"
                    />
                  ) : (
                    <View key={`placeholder-${index}`} style={[styles.heroPlaceholder, { width: heroWidth }]}>
                      <Ionicons name="image-outline" size={42} color={colors.textMuted} />
                    </View>
                  )
                )}
              </ScrollView>
              {images.length > 1 ? (
                <View style={styles.dotRow}>
                  {images.map((_, idx) => (
                    <View
                      key={`dot-${idx}`}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: idx === activeImage ? colors.primary : colors.textMuted + "66",
                        },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>

            <View style={[styles.infoCard, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}> 
              <Text style={[styles.sellerName, { color: colors.primary }]}>{sellerName}</Text>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>

              {rating !== null ? (
                <View style={styles.ratingRow}>
                  <Text style={[styles.ratingValue, { color: colors.text }]}>{rating.toFixed(1)}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons
                        key={n}
                        name={n <= Math.floor(rating) ? "star" : "star-outline"}
                        size={13}
                        color={colors.warning}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: colors.text }]}>{currencyFormat(displayPrice, displayCurrency)}</Text>
                {compareAt ? <Text style={[styles.compareAt, { color: colors.textMuted }]}>{currencyFormat(compareAt, displayCurrency)}</Text> : null}
              </View>

              <Text style={[styles.stockLine, { color: displayStock > 0 ? colors.success : colors.error }]}> 
                {displayStock > 0 ? `In stock (${displayStock})` : "Out of stock"}
              </Text>

              {product.variantSummary?.totalVariants ? (
                <Text style={[styles.variantSummary, { color: colors.textMuted }]}> 
                  {product.variantSummary.totalVariants} variants available
                </Text>
              ) : null}
            </View>

            {variants.length > 0 ? (
              <View style={[styles.sectionCard, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}> 
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose variant</Text>
                  <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{variants.length} options</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {variants.map((variant) => {
                    const active = variant._id === selectedVariantId;
                    return (
                      <TouchableOpacity
                        key={variant._id}
                        onPress={() => setSelectedVariantId(variant._id)}
                        style={[
                          styles.variantCard,
                          {
                            borderRadius: radius.md,
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.primary + "14" : colors.surface,
                          },
                        ]}
                      >
                        <Text style={[styles.variantTitle, { color: colors.text }]} numberOfLines={2}>
                          {variantLabel(variant)}
                        </Text>
                        <Text style={[styles.variantPrice, { color: colors.text }]}> 
                          {currencyFormat(Number(variant.price?.amount || 0), variant.price?.currency || displayCurrency)}
                        </Text>
                        <Text
                          style={[
                            styles.variantStock,
                            { color: Number(variant.availableQuantity || 0) > 0 ? colors.success : colors.error },
                          ]}
                        >
                          {Number(variant.availableQuantity || 0) > 0 ? "In stock" : "Out of stock"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View style={[styles.sectionCard, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Product details</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Category</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{product.category}</Text>
              </View>
              {product.subCategory ? (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Sub-category</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{product.subCategory}</Text>
                </View>
              ) : null}
              {product.sku ? (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SKU</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{product.sku}</Text>
                </View>
              ) : null}
            </View>

            {product.description ? (
              <View style={[styles.sectionCard, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}> 
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.lg }]}> 
            {canManageVariants ? (
              <TouchableOpacity
                onPress={openManageVariants}
                style={[styles.bottomPrimaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
              >
                <Ionicons name="options-outline" size={18} color={colors.textOnPrimary} />
                <Text style={[styles.bottomPrimaryText, { color: colors.textOnPrimary }]}>Manage variants</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.bottomColumn}>
                <TouchableOpacity
                  onPress={openQuoteSheet}
                  style={[styles.quotePrimaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
                >
                  <Ionicons name="receipt-outline" size={18} color={colors.textOnPrimary} />
                  <Text style={[styles.bottomPrimaryText, { color: colors.textOnPrimary }]}>Get Quote</Text>
                </TouchableOpacity>

                <View style={styles.bottomRow}>
                  <TouchableOpacity
                    onPress={() =>
                      startProductConversation({
                        product,
                        isGuest,
                        requestLogin,
                        navigation,
                        toastError,
                      })
                    }
                    style={[styles.bottomSecondaryBtn, { borderRadius: radius.md, borderColor: colors.border }]}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                    <Text style={[styles.bottomSecondaryText, { color: colors.primary }]}>Message</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => callProductSeller({ product, toastError })}
                    style={[styles.bottomPrimaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.textOnPrimary} />
                    <Text style={[styles.bottomPrimaryText, { color: colors.textOnPrimary }]}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <QuoteRequestSheet
            visible={quoteSheetOpen}
            loading={quoteSubmitting}
            productName={product.name}
            variantLabel={selectedVariant ? variantLabel(selectedVariant) : undefined}
            defaultContact={{
              name: user?.displayName || user?.firstName,
              phone: user?.phone,
              email: user?.email,
            }}
            onClose={() => setQuoteSheetOpen(false)}
            onSubmit={submitQuoteRequest}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "800",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  retryBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "800",
  },
  galleryCard: {
    borderWidth: 1,
    overflow: "hidden",
  },
  heroImage: {
    height: 320,
  },
  heroPlaceholder: {
    height: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  infoCard: {
    borderWidth: 1,
    padding: 14,
  },
  sellerName: {
    fontSize: 13,
    fontWeight: "700",
  },
  productName: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
    lineHeight: 30,
  },
  ratingRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  starsRow: {
    flexDirection: "row",
    gap: 1,
  },
  priceRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: "900",
  },
  compareAt: {
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "line-through",
  },
  stockLine: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "800",
  },
  variantSummary: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  sectionCard: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "700",
  },
  variantCard: {
    width: 160,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  variantTitle: {
    fontSize: 12,
    fontWeight: "800",
    minHeight: 34,
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: "900",
  },
  variantStock: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  description: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 18,
  },
  bottomRow: {
    flexDirection: "row",
    gap: 10,
  },
  bottomColumn: {
    gap: 10,
  },
  quotePrimaryBtn: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bottomSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bottomSecondaryText: {
    fontSize: 13,
    fontWeight: "800",
  },
  bottomPrimaryBtn: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bottomPrimaryText: {
    fontSize: 13,
    fontWeight: "900",
  },
});

export default ProductDetailsScreen;
