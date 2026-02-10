import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useAuth } from "../../hooks/useAuth";
import { productService, Product, ProductCategory } from "../../services/product.service";
import { useCart } from "../../hooks/useCart";
import { RootStackParamList } from "../../navigation/types";
import { preferenceService } from "../../services/preference.service";
import { AmazonStyleProductCard } from "../../components/product/AmazonStyleProductCard";
import { useToast } from "../../components/ui/Toast";
import { callProductSeller, startProductConversation } from "../product/utils/productContact";
import { VariantChoiceSelection, VariantChoiceSheet } from "../inventory/components/VariantChoiceSheet";
import { hasVariants, variantDisplayLabel } from "../inventory/components/variantDomain";

const useAdminProductsPalette = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();

  return useMemo(
    () => ({
      background: colors.background,
      surface: resolvedMode === "dark" ? "rgba(22, 22, 30, 0.9)" : colors.surface,
      surfaceLight: resolvedMode === "dark" ? "rgba(32, 32, 42, 0.8)" : colors.surfaceElevated,
      border: resolvedMode === "dark" ? "rgba(255, 255, 255, 0.08)" : colors.border,
      borderLight: resolvedMode === "dark" ? "rgba(255, 255, 255, 0.12)" : colors.borderLight,
      text: colors.text,
      textMuted: colors.textMuted,
      textSubtle: colors.textSecondary,
      accent: colors.primary,
      accentMuted: colors.badgePrimary,
      success: colors.success,
      successMuted: colors.badgeSuccess,
      warning: colors.warning,
      warningMuted: colors.badgeWarning,
    }),
    [colors, resolvedMode]
  );
};

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (productId: string) => void;
  inCartQty?: number;
};

const ProductCard = ({ product, onAddToCart, onOpenDetails, inCartQty }: ProductCardProps) => {
  const COLORS = useAdminProductsPalette();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const price = product.price?.amount || 0;
  const currency = product.price?.currency === "INR" ? "₹" : product.price?.currency || "₹";
  const primaryImage = product.images?.[0]?.url;
  const companyName = product.company?.displayName || "Admin";
  const compliance = product.company?.complianceStatus;
  const verified = compliance === "approved";
  const rating =
    typeof (product.attributes as any)?.rating === "number"
      ? (product.attributes as any).rating
      : typeof (product.attributes as any)?.stars === "number"
      ? (product.attributes as any).stars
      : 0;
  const bestFor = (product.subCategory || product.category || "").toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onOpenDetails(product._id)}
      style={styles.card}
    >
      {/* Card gradient overlay */}
      <LinearGradient
        colors={["rgba(124, 138, 255, 0.04)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Image container */}
      <View style={styles.cardImageWrap}>
        {/* Verified badge */}
        <View style={[styles.badge, verified ? styles.badgeVerified : styles.badgeUnverified]}>
          <Text style={[styles.badgeText, { color: verified ? COLORS.success : COLORS.warning }]}>
            {verified ? "✓ Verified" : "Unverified"}
          </Text>
        </View>

        {/* Category tag */}
        <View style={styles.tagPill}>
          <Text style={styles.tagText} numberOfLines={1}>
            {bestFor || "PRODUCT"}
          </Text>
        </View>

        {primaryImage ? (
          <Image source={{ uri: primaryImage }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Text style={{ fontSize: 28 }}>📦</Text>
          </View>
        )}
      </View>

      {/* Product info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {companyName}
        </Text>

        {/* Rating row */}
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <Text key={idx} style={[styles.star, { opacity: rating >= idx + 1 ? 1 : 0.3 }]}>
              ★
            </Text>
          ))}
          <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>
            {currency}{price.toFixed(2)}
          </Text>
          <Text style={styles.unitText}>
            /{product.unit || product.price?.unit || "unit"}
          </Text>
        </View>

        {/* Add to cart button */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.addButton}
          onPress={() => onAddToCart(product)}
        >
          <LinearGradient
            colors={inCartQty ? [COLORS.success, "#4bc08f"] : [COLORS.accent, "#6572e0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonLabel}>
              {inCartQty ? `In cart (${inCartQty})` : "Add to cart"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom accent line */}
      <View style={styles.cardAccentLine} />
    </TouchableOpacity>
  );
};

const PAGE_SIZE = 16;

export const AdminProductsScreen = () => {
  const COLORS = useAdminProductsPalette();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, requestLogin } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { addToCart, getProductQuantity } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const totalLabel = useMemo(
    () => `${pagination.total || 0} ${pagination.total === 1 ? "product" : "products"}`,
    [pagination.total]
  );
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortMode, setSortMode] = useState<"none" | "priceAsc" | "priceDesc" | "ratingDesc">("none");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [variantChoiceProduct, setVariantChoiceProduct] = useState<Product | null>(null);
  const [variantChoiceVisible, setVariantChoiceVisible] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productService.getCategoryStats({
        scope: "marketplace",
        createdByRole: "admin",
      });
      setCategories([{ id: "all", title: "All", count: res.categories.reduce((acc, c) => acc + c.count, 0) }, ...res.categories]);
    } catch (err: any) {
      setCategories([{ id: "all", title: "All", count: 0 }]);
    }
  }, []);

  const loadProducts = useCallback(
    async (offset = 0, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      try {
        const response = await productService.getAll({
          limit: PAGE_SIZE,
          offset,
          category: activeCategory === "all" ? undefined : activeCategory,
          scope: "marketplace",
          createdByRole: "admin",
          sort: sortMode !== "none" ? sortMode : undefined,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          includeVariantSummary: true,
        });
        const nextProducts = response.products;

        setProducts((prev) => (append ? [...prev, ...nextProducts] : nextProducts));
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err?.message || "Failed to load products");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [activeCategory, sortMode, minPrice, maxPrice]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadProducts(0, false);
  }, [activeCategory, loadProducts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
    loadProducts(0, false);
  }, [fetchCategories, loadProducts]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !pagination.hasMore) return;
    loadProducts(pagination.offset + pagination.limit, true);
  }, [loadProducts, loading, loadingMore, pagination]);

  const applyCartSelection = useCallback(
    (selection: VariantChoiceSelection) => {
      if (selection.mode === "variant") {
        addToCart(selection.product, 1, {
          id: selection.variant._id,
          title: variantDisplayLabel(selection.variant),
          options: (selection.variant.options || {}) as Record<string, unknown>,
          price: selection.variant.price || null,
          unit: selection.variant.unit || selection.variant.price?.unit || selection.product.unit,
        });
        toastSuccess("Added variant", variantDisplayLabel(selection.variant));
      } else {
        addToCart(selection.product, 1);
        toastSuccess("Added to cart", selection.product.name);
      }

      preferenceService
        .logEvent({
          type: "view_product",
          productId: selection.product._id,
          category: selection.product.category,
          meta: { action: "add_to_cart" },
        })
        .catch(() => {});
    },
    [addToCart, toastSuccess]
  );

  const closeVariantChoice = useCallback(() => {
    setVariantChoiceVisible(false);
    setVariantChoiceProduct(null);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (hasVariants(product)) {
        setVariantChoiceProduct(product);
        setVariantChoiceVisible(true);
        return;
      }
      applyCartSelection({ mode: "base", product });
    },
    [applyCartSelection]
  );

  const handleOpenDetails = useCallback(
    (productId: string) => {
      navigation.navigate("ProductDetails", { productId });
    },
    [navigation]
  );

  const handleOpenVariants = useCallback(
    (product: Product) => {
      navigation.navigate("ProductVariants", {
        productId: product._id,
        productName: product.name,
        scope: "company",
      });
    },
    [navigation]
  );

  const renderCategoryChips = useCallback(() => {
    if (!categories.length) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.85}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]} numberOfLines={1}>
                {cat.title}
              </Text>
              {typeof cat.count === "number" && (
                <View style={[styles.chipCount, isActive && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                    {cat.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }, [categories, activeCategory]);

  const renderListHeader = useCallback(() => {
    return (
      <>
        {/* Categories panel */}
        <View style={styles.categoriesPanel}>
          <LinearGradient
            colors={["rgba(124, 138, 255, 0.06)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {renderCategoryChips()}
        </View>

        {/* Filter row */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterIcon}>☰</Text>
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.8}
            onPress={() => {
              setActiveCategory("all");
              setSortMode("none");
              setMinPrice("");
              setMaxPrice("");
              loadProducts(0, false);
            }}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <Text style={styles.totalText}>{totalLabel}</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadProducts(0, false)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  }, [renderCategoryChips, error, loadProducts, totalLabel]);

  const renderItem = ({ item }: { item: Product }) => {
    const inCartQty = getProductQuantity(item._id) || undefined;
    const isGuest = user?.role === "guest";
    return (
      <View style={styles.cardContainer}>
        <AmazonStyleProductCard
          product={item}
          onPress={handleOpenDetails}
          onMessagePress={(product) =>
            startProductConversation({
              product,
              isGuest,
              requestLogin,
              navigation,
              toastError,
            })
          }
          onCallPress={(product) =>
            callProductSeller({
              product,
              toastError,
            })
          }
          showPrimaryAction
          primaryActionLabel={inCartQty ? `In cart (${inCartQty})` : "Add to cart"}
          onPrimaryActionPress={(product) => handleAddToCart(product)}
        />
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleOpenVariants(item)}
          style={styles.manageVariantsPill}
        >
          <Text style={styles.manageVariantsText}>Manage variants</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Background orbs */}
        <View style={styles.bgOrbContainer}>
          <LinearGradient
            colors={[COLORS.accent, "transparent"]}
            style={[styles.bgOrb, styles.bgOrb1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={[COLORS.success, "transparent"]}
            style={[styles.bgOrb, styles.bgOrb2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background orbs */}
      <View style={styles.bgOrbContainer}>
        <LinearGradient
          colors={[COLORS.accent, "transparent"]}
          style={[styles.bgOrb, styles.bgOrb1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[COLORS.success, "transparent"]}
          style={[styles.bgOrb, styles.bgOrb2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Catalog</Text>
          <Text style={styles.headerSubtitle}>Discover premium products</Text>
        </View>
      </View>

      {/* Products list */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={1}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={COLORS.accent} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={[COLORS.accentMuted, "transparent"]}
                  style={styles.emptyIconBg}
                >
                  <Text style={styles.emptyIcon}>📦</Text>
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or check back later
              </Text>
            </View>
          ) : null
        }
      />

      {/* Filters Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Filters</Text>

            <Text style={styles.modalSection}>Sort by</Text>
            {[
              { key: "none", label: "Default" },
              { key: "priceAsc", label: "Price: Low to High" },
              { key: "priceDesc", label: "Price: High to Low" },
              { key: "ratingDesc", label: "Rating: High to Low" },
            ].map((option) => {
              const selected = sortMode === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  onPress={() => setSortMode(option.key as typeof sortMode)}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                  {selected && <Text style={styles.optionCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.modalSection, { marginTop: 20 }]}>Price range</Text>
            <View style={styles.priceRowInputs}>
              <TextInput
                placeholder="Min"
                placeholderTextColor={COLORS.textSubtle}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={(text) => setMinPrice(text.replace(/[^0-9.]/g, ""))}
                style={styles.priceInput}
              />
              <Text style={styles.priceTo}>to</Text>
              <TextInput
                placeholder="Max"
                placeholderTextColor={COLORS.textSubtle}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={(text) => setMaxPrice(text.replace(/[^0-9.]/g, ""))}
                style={styles.priceInput}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setSortMode("none");
                  setMinPrice("");
                  setMaxPrice("");
                }}
                style={styles.modalButtonSecondary}
              >
                <Text style={styles.modalButtonSecondaryText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setFilterModalVisible(false);
                  loadProducts(0, false);
                }}
                style={styles.modalButtonPrimary}
              >
                <LinearGradient
                  colors={[COLORS.accent, "#6572e0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonPrimaryGradient}
                >
                  <Text style={styles.modalButtonPrimaryText}>Apply</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <VariantChoiceSheet
        visible={variantChoiceVisible}
        product={variantChoiceProduct}
        scope="marketplace"
        title="Add product to cart"
        subtitle="Choose the base product or a specific variant for accurate pricing and stock."
        onClose={closeVariantChoice}
        onSelect={async (selection) => {
          applyCartSelection(selection);
        }}
      />
    </SafeAreaView>
  );
};

const createStyles = (COLORS: ReturnType<typeof useAdminProductsPalette>) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Background orbs
  bgOrbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.08,
  },
  bgOrb1: {
    width: 280,
    height: 280,
    top: -80,
    right: -100,
  },
  bgOrb2: {
    width: 200,
    height: 200,
    bottom: 200,
    left: -80,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cartButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cartButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  cartIcon: {
    fontSize: 16,
  },
  cartCount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Loader
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontWeight: "600",
  },

  // Categories
  categoriesPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: "hidden",
  },
  chipsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    gap: 8,
  },
  chipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentMuted,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: COLORS.accent,
  },
  chipCount: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipCountActive: {
    backgroundColor: COLORS.accent,
  },
  chipCountText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  chipCountTextActive: {
    color: "#fff",
  },

  // Filter row
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  filterIcon: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  resetButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  resetText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  totalText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSubtle,
  },

  // Error box
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 123, 123, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 123, 123, 0.2)",
  },
  errorText: {
    color: "#ff7b7b",
    fontWeight: "600",
  },
  retryText: {
    color: COLORS.accent,
    fontWeight: "700",
  },

  // List
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 14,
  },
  cardContainer: {
    flex: 1,
    padding: 0,
    gap: 8,
  },
  manageVariantsPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  manageVariantsText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  footerLoader: {
    paddingVertical: 20,
  },

  // Product Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardImageWrap: {
    height: 140,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  badgeVerified: {
    backgroundColor: COLORS.successMuted,
  },
  badgeUnverified: {
    backgroundColor: COLORS.warningMuted,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  tagPill: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    zIndex: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textSubtle,
    letterSpacing: 0.5,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  cardPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 18,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  star: {
    fontSize: 12,
    color: "#ffd700",
  },
  ratingText: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  unitText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textSubtle,
    marginLeft: 2,
  },
  addButton: {
    marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  addButtonGradient: {
    paddingVertical: 10,
    alignItems: "center",
  },
  addButtonLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  cardAccentLine: {
    height: 2,
    backgroundColor: COLORS.accent,
    opacity: 0.3,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 16,
  },
  modalSection: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: 8,
  },
  optionRowSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentMuted,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.accent,
  },
  optionCheck: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  priceRowInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceLight,
  },
  priceTo: {
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  modalButtonPrimaryGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  });
