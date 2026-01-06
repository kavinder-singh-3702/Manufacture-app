import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ScrollView,
  Image,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { AppRole } from "../../constants/roles";
import { productService, Product } from "../../services/product.service";
import { useCart } from "../../hooks/useCart";
import { preferenceService } from "../../services/preference.service";
import { RootStackParamList } from "../../navigation/types";

const PAGE_SIZE = 25;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Premium subtle color palette
const COLORS = {
  background: "#0a0a0f",
  surface: "rgba(22, 22, 30, 0.95)",
  surfaceLight: "rgba(32, 32, 42, 0.85)",
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.6)",
  textSubtle: "rgba(255, 255, 255, 0.4)",
  accent: "#7c8aff",
  accentMuted: "#5a6fd6",
  success: "#5ed4a5",
  successMuted: "#4db88e",
  warning: "#f0b429",
  error: "#ef6b6b",
  verified: "#5ed4a5",
  unverified: "#f0b429",
};

export const CategoryProductsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CategoryProducts">>();
  const { categoryId, title, subCategory: initialSubCategory } = route.params;
  const { user } = useAuth();
  const { isInCart, getCartItem, items: cartItems, addToCart } = useCart();
  const isGuest = user?.role === AppRole.GUEST;

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [activeSubCategory, setActiveSubCategory] = useState<string>(initialSubCategory || "All");
  const [sortMode, setSortMode] = useState<"none" | "priceAsc" | "priceDesc" | "ratingDesc">("none");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedSort, setAppliedSort] = useState<"none" | "priceAsc" | "priceDesc" | "ratingDesc">("none");
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | undefined>(undefined);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | undefined>(undefined);

  const categoryLabel = title || categoryId;
  const logCategoryView = useCallback(() => {
    preferenceService
      .logEvent({ type: "view_category", category: categoryId })
      .catch((err) => console.warn("Failed to log category view", err?.message || err));
  }, [categoryId]);

  const loadProducts = useCallback(
    async (offset = 0, append = false, overrides?: { sort?: typeof appliedSort; minPrice?: number; maxPrice?: number }) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const effectiveSort = overrides?.sort ?? appliedSort;
      const effectiveMin = overrides?.minPrice ?? appliedMinPrice;
      const effectiveMax = overrides?.maxPrice ?? appliedMaxPrice;

      try {
        const response = await productService.getProductsByCategory(categoryId, {
          limit: PAGE_SIZE,
          offset,
          sort: effectiveSort,
          minPrice: effectiveMin,
          maxPrice: effectiveMax,
          scope: "marketplace",
        });
        setItems((prev) => (append ? [...prev, ...response.products] : response.products));
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [appliedMaxPrice, appliedMinPrice, appliedSort, categoryId]
  );

  // Refresh list whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProducts();
      logCategoryView();
    }, [loadProducts, logCategoryView])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts(0, false);
  }, [loadProducts]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !pagination.hasMore) return;
    const nextOffset = pagination.offset + pagination.limit;
    loadProducts(nextOffset, true);
  }, [loading, loadingMore, pagination.hasMore, pagination.limit, pagination.offset, loadProducts]);

  const totalProductsLabel = useMemo(() => {
    if (pagination.total === 0) return "No products";
    if (pagination.total === 1) return "1 product";
    return `${pagination.total} products`;
  }, [pagination.total]);

  const subCategories = useMemo(() => {
    const base = new Set<string>(["All"]);
    items.forEach((item) => {
      const label = item.subCategory || item.name?.split(" ")[0] || "General";
      base.add(label);
    });
    return Array.from(base);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeSubCategory === "All") return items;
    return items.filter((item) => {
      const label = item.subCategory || item.name?.split(" ")[0] || "General";
      return label === activeSubCategory;
    });
  }, [activeSubCategory, items]);

  const openDetails = useCallback(
    (productId: string) => {
      navigation.navigate("ProductDetails", { productId });
    },
    [navigation]
  );

  const commitFiltersAndReload = useCallback(
    (nextSort: typeof appliedSort, nextMin?: number, nextMax?: number) => {
      setAppliedSort(nextSort);
      setAppliedMinPrice(nextMin);
      setAppliedMaxPrice(nextMax);
      loadProducts(0, false, { sort: nextSort, minPrice: nextMin, maxPrice: nextMax });
    },
    [loadProducts]
  );

  const resetFilters = useCallback(() => {
    setSortMode("none");
    setMinPrice("");
    setMaxPrice("");
    setFilterModalVisible(false);
    commitFiltersAndReload("none", undefined, undefined);
  }, [commitFiltersAndReload]);

  const handleApplyFilters = useCallback(() => {
    const nextMin = minPrice ? parseFloat(minPrice) : undefined;
    const nextMax = maxPrice ? parseFloat(maxPrice) : undefined;
    setFilterModalVisible(false);
    commitFiltersAndReload(sortMode, nextMin, nextMax);
  }, [commitFiltersAndReload, maxPrice, minPrice, sortMode]);

  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const price = item.price?.amount || 0;
      const currencySymbol = item.price?.currency === "INR" ? "₹" : item.price?.currency || "₹";
      const displayPrice = `${currencySymbol}${price.toFixed(2)}`;
      const attributes = item.attributes as Record<string, any> | undefined;
      const compareAt =
        typeof attributes?.mrp === "number"
          ? attributes.mrp
          : typeof attributes?.oldPrice === "number"
          ? attributes.oldPrice
          : undefined;
      const primaryImage = item.images?.[0]?.url;
      const sizeLabel = item.unit || item.price?.unit;
      const inCart = isInCart(item._id);
      const cartQty = inCart ? getCartItem(item._id)?.quantity || 0 : 0;
      const companyName = item.company?.displayName || "Unknown company";
      const compliance = item.company?.complianceStatus;
      const verified = compliance === "approved";
      const selectedQty = 1;
      const isAdded = inCart && cartQty > 0;
      const ratingValue =
        typeof (item.attributes as any)?.rating === "number"
          ? (item.attributes as any).rating
          : typeof (item.attributes as any)?.stars === "number"
          ? (item.attributes as any).stars
          : undefined;
      const ratingLabel =
        typeof ratingValue === "number" ? (Number.isInteger(ratingValue) ? `${ratingValue}` : ratingValue.toFixed(1)) : null;
      const unitLabel = sizeLabel || item.price?.unit;
      const hasDiscount = typeof compareAt === "number" && compareAt > price;
      const discountPercent = hasDiscount ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openDetails(item._id)}
          style={styles.productTile}
        >
          {/* Card background */}
          <LinearGradient
            colors={[COLORS.surface, "rgba(18, 18, 24, 0.95)"]}
            style={styles.productTileBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Subtle accent line at top */}
          <LinearGradient
            colors={[COLORS.accent + "40", COLORS.accentMuted + "20", "transparent"]}
            style={styles.productAccentLine}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          {/* Image Container */}
          <View style={styles.productImageWrap}>
            <LinearGradient
              colors={[COLORS.surfaceLight, COLORS.surface]}
              style={styles.productImageBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {primaryImage ? (
              <Image
                source={{ uri: primaryImage }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Text style={styles.productImagePlaceholderIcon}>🛍️</Text>
              </View>
            )}

            {/* Verification Badge */}
            <View style={[styles.badgeFloating, verified ? styles.badgeVerified : styles.badgeUnverified]}>
              <Text style={[styles.badgeText, { color: verified ? COLORS.verified : COLORS.unverified }]}>
                {verified ? "✓" : "○"}
              </Text>
            </View>

            {/* Discount Badge */}
            {hasDiscount && discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <LinearGradient
                  colors={[COLORS.success, COLORS.successMuted]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.name}
            </Text>

            <View style={styles.companyRow}>
              <Text style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">
                {companyName}
              </Text>
              {ratingLabel && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStar}>★</Text>
                  <Text style={styles.ratingValue}>{ratingLabel}</Text>
                </View>
              )}
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>
                  {displayPrice}
                </Text>
                {unitLabel && (
                  <Text style={styles.priceUnit}>/{unitLabel}</Text>
                )}
              </View>
              {hasDiscount && (
                <Text style={styles.comparePrice}>
                  {currencySymbol}{compareAt.toFixed(0)}
                </Text>
              )}
            </View>
          </View>

          {/* Add to Cart Button */}
          {!isGuest && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => addToCart(item, selectedQty)}
              style={styles.addButtonWrap}
            >
              <LinearGradient
                colors={isAdded ? [COLORS.success + "20", COLORS.successMuted + "10"] : [COLORS.accent, COLORS.accentMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButton}
              >
                <Text style={[styles.addButtonText, isAdded && styles.addButtonTextAdded]}>
                  {isAdded ? "✓ Added" : "Add to Cart"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [addToCart, getCartItem, isGuest, isInCart, openDetails]
  );

  const keyExtractor = useCallback((item: Product) => item._id, []);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Background gradient orbs */}
        <View style={styles.bgOrbContainer}>
          <LinearGradient
            colors={[COLORS.accentMuted, "#6b5b95"]}
            style={[styles.bgOrb, styles.bgOrb1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={["#c9a0dc", "#b8829e"]}
            style={[styles.bgOrb, styles.bgOrb2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        <View style={styles.loader}>
          <View style={styles.loaderIconWrap}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentMuted]}
              style={styles.loaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <ActivityIndicator size="large" color="#fff" />
          </View>
          <Text style={styles.loadingText}>Loading products...</Text>
          <Text style={styles.loadingSubtext}>{categoryLabel}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient orbs */}
      <View style={styles.bgOrbContainer}>
        <LinearGradient
          colors={[COLORS.accentMuted, "#6b5b95"]}
          style={[styles.bgOrb, styles.bgOrb1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={["#c9a0dc", "#b8829e"]}
          style={[styles.bgOrb, styles.bgOrb2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={["#7ab8d9", "#5a9ebe"]}
          style={[styles.bgOrb, styles.bgOrb3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonWrap}>
          <LinearGradient
            colors={[COLORS.surfaceLight, COLORS.surface]}
            style={styles.backButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.backButtonIcon}>←</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryLabel}
          </Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalProductsLabel}</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.layoutRow}>
        {/* Premium Sidebar */}
        <View style={styles.sideNav}>
          <LinearGradient
            colors={[COLORS.surface, "rgba(18, 18, 24, 0.98)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.sideNavHeader}>
            <Text style={styles.sideNavTitle}>Filter</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sideNavScroll}>
            {subCategories.map((sub, index) => {
              const isActive = activeSubCategory === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  onPress={() => setActiveSubCategory(sub)}
                  activeOpacity={0.8}
                  style={styles.sideNavItemWrap}
                >
                  {isActive && (
                    <LinearGradient
                      colors={[COLORS.accent + "30", COLORS.accentMuted + "15"]}
                      style={styles.sideNavItemBg}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  )}
                  {isActive && <View style={styles.sideNavActiveBar} />}
                  <Text style={[styles.sideNavText, isActive && styles.sideNavTextActive]} numberOfLines={1}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.gridArea}>
          {/* Filter Bar */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.85}
              style={styles.filterButtonWrap}
            >
              <LinearGradient
                colors={[COLORS.surfaceLight, COLORS.surface]}
                style={styles.filterButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.filterButtonIcon}>⚙️</Text>
                <Text style={styles.filterButtonText}>Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetFilters}
              activeOpacity={0.85}
              style={styles.resetButtonWrap}
            >
              <View style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </View>
            </TouchableOpacity>
            {(appliedSort !== "none" || appliedMinPrice || appliedMaxPrice) && (
              <View style={styles.activeFilterBadge}>
                <Text style={styles.activeFilterText}>Active</Text>
              </View>
            )}
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <LinearGradient
                colors={[COLORS.error + "20", COLORS.error + "10"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={filteredItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            extraData={cartItems}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.accent}
                colors={[COLORS.accent]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              pagination.hasMore ? (
                <View style={styles.loadMoreContainer}>
                  {loadingMore && (
                    <View style={styles.loadMoreIndicator}>
                      <ActivityIndicator color={COLORS.accent} size="small" />
                      <Text style={styles.loadMoreText}>Loading more...</Text>
                    </View>
                  )}
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <LinearGradient
                      colors={[COLORS.surfaceLight, COLORS.surface]}
                      style={styles.emptyIconBg}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.emptyIcon}>📦</Text>
                  </View>
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptySubtitle}>
                    No products in this category yet
                  </Text>
                  <TouchableOpacity onPress={handleRefresh} style={styles.emptyRefreshButton}>
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentMuted]}
                      style={styles.emptyRefreshGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.emptyRefreshText}>Refresh</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Premium Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <LinearGradient
              colors={[COLORS.surface, "rgba(18, 18, 24, 0.98)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sort Section */}
            <Text style={styles.modalSection}>Sort by</Text>
            <View style={styles.sortOptionsContainer}>
              {[
                { key: "none", label: "Default", icon: "○" },
                { key: "priceAsc", label: "Price ↑", icon: "↑" },
                { key: "priceDesc", label: "Price ↓", icon: "↓" },
                { key: "ratingDesc", label: "Top Rated", icon: "★" },
              ].map((option) => {
                const selected = sortMode === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.8}
                    style={styles.sortOptionWrap}
                    onPress={() => setSortMode(option.key as typeof sortMode)}
                  >
                    {selected && (
                      <LinearGradient
                        colors={[COLORS.accent + "30", COLORS.accentMuted + "15"]}
                        style={styles.sortOptionBg}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    )}
                    <View style={[styles.sortOption, selected && styles.sortOptionSelected]}>
                      <Text style={[styles.sortOptionText, selected && styles.sortOptionTextSelected]}>
                        {option.label}
                      </Text>
                      {selected && <Text style={styles.sortOptionCheck}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price Range Section */}
            <Text style={[styles.modalSection, { marginTop: 20 }]}>Price range</Text>
            <View style={styles.priceRowInputs}>
              <View style={styles.priceInputWrap}>
                <Text style={styles.priceInputLabel}>Min</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={COLORS.textSubtle}
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.]/g, "");
                    setMinPrice(cleaned);
                  }}
                  style={styles.priceInput}
                />
              </View>
              <View style={styles.priceInputDivider}>
                <Text style={styles.priceInputDividerText}>—</Text>
              </View>
              <View style={styles.priceInputWrap}>
                <Text style={styles.priceInputLabel}>Max</Text>
                <TextInput
                  placeholder="∞"
                  placeholderTextColor={COLORS.textSubtle}
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.]/g, "");
                    setMaxPrice(cleaned);
                  }}
                  style={styles.priceInput}
                />
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleClearFilters}
                activeOpacity={0.85}
                style={styles.modalButtonSecondary}
              >
                <Text style={styles.modalButtonSecondaryText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyFilters}
                activeOpacity={0.85}
                style={styles.modalButtonPrimaryWrap}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentMuted]}
                  style={styles.modalButtonPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalButtonPrimaryText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container & Background
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bgOrbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.12,
  },
  bgOrb1: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
  },
  bgOrb2: {
    width: 200,
    height: 200,
    top: 200,
    left: -80,
  },
  bgOrb3: {
    width: 160,
    height: 160,
    bottom: 100,
    right: -40,
  },

  // Loading State
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loaderIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  loaderGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  loadingSubtext: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textMuted,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    zIndex: 10,
  },
  backButtonWrap: {
    borderRadius: 12,
    overflow: "hidden",
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonIcon: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerBadge: {
    backgroundColor: COLORS.accent + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Layout
  layoutRow: {
    flex: 1,
    flexDirection: "row",
  },

  // Sidebar Navigation
  sideNav: {
    width: 90,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    overflow: "hidden",
  },
  sideNavHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sideNavTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sideNavScroll: {
    paddingVertical: 8,
  },
  sideNavItemWrap: {
    position: "relative",
    marginHorizontal: 6,
    marginVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  sideNavItemBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  sideNavActiveBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  sideNavText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  sideNavTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },

  // Grid Area
  gridArea: {
    flex: 1,
  },

  // Filter Bar
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  filterButtonWrap: {
    borderRadius: 20,
    overflow: "hidden",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterButtonIcon: {
    fontSize: 14,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  resetButtonWrap: {
    borderRadius: 20,
    overflow: "hidden",
  },
  resetButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  activeFilterBadge: {
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeFilterText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.success,
    textTransform: "uppercase",
  },

  // Error Banner
  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.error + "30",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.error,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.error + "20",
  },
  retryText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.error,
  },

  // Product List
  productRow: {
    gap: 10,
    justifyContent: "flex-start",
  },
  productList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 100,
    gap: 10,
  },

  // Product Tile
  productTile: {
    flex: 1,
    flexBasis: "48%",
    maxWidth: "48%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productTileBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  productAccentLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },

  // Product Image
  productImageWrap: {
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  productImageBg: {
    ...StyleSheet.absoluteFillObject,
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  productImagePlaceholderIcon: {
    fontSize: 28,
    opacity: 0.5,
  },

  // Badges
  badgeFloating: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  badgeVerified: {
    backgroundColor: COLORS.verified + "20",
    borderColor: COLORS.verified + "60",
  },
  badgeUnverified: {
    backgroundColor: COLORS.unverified + "20",
    borderColor: COLORS.unverified + "60",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  discountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },

  // Product Info
  productInfo: {
    padding: 12,
    gap: 6,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 18,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  companyName: {
    flex: 1,
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.warning + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingStar: {
    fontSize: 10,
    color: COLORS.warning,
  },
  ratingValue: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.warning,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  comparePrice: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSubtle,
    textDecorationLine: "line-through",
  },

  // Add to Cart Button
  addButtonWrap: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  addButton: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  addButtonTextAdded: {
    color: COLORS.success,
  },

  // Load More
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  emptyIconBg: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyRefreshButton: {
    marginTop: 16,
    borderRadius: 24,
    overflow: "hidden",
  },
  emptyRefreshGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyRefreshText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    marginHorizontal: 12,
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  modalSection: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Sort Options
  sortOptionsContainer: {
    gap: 8,
  },
  sortOptionWrap: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortOptionBg: {
    ...StyleSheet.absoluteFillObject,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sortOptionSelected: {
    borderColor: COLORS.accent + "40",
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  sortOptionTextSelected: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  sortOptionCheck: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: "700",
  },

  // Price Inputs
  priceRowInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceInputWrap: {
    flex: 1,
    gap: 6,
  },
  priceInputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    backgroundColor: COLORS.surfaceLight,
  },
  priceInputDivider: {
    paddingTop: 20,
  },
  priceInputDividerText: {
    fontSize: 16,
    color: COLORS.textSubtle,
  },

  // Modal Actions
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  modalButtonPrimaryWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  modalButtonPrimary: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
