import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useAuth } from "../../hooks/useAuth";
import { AppRole } from "../../constants/roles";
import { productService, Product } from "../../services/product.service";
import { preferenceService } from "../../services/preference.service";
import { RootStackParamList } from "../../navigation/types";
import { AmazonStyleProductCard } from "../../components/product/AmazonStyleProductCard";
import { AdaptiveSingleLineText } from "../../components/text/AdaptiveSingleLineText";
import { useToast } from "../../components/ui/Toast";
import { callProductSeller, startProductConversation } from "../product/utils/productContact";

const PAGE_SIZE = 25;
const useCategoryProductsPalette = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();

  return useMemo(
    () => ({
      background: colors.background,
      surface: resolvedMode === "dark" ? "#16161e" : colors.surface,
      surfaceLight: resolvedMode === "dark" ? "#1e1e28" : colors.surfaceElevated,
      surfaceElevated: resolvedMode === "dark" ? "#252530" : colors.backgroundSecondary,
      border: resolvedMode === "dark" ? "rgba(255, 255, 255, 0.08)" : colors.border,
      borderLight: resolvedMode === "dark" ? "rgba(255, 255, 255, 0.12)" : colors.borderLight,
      text: colors.text,
      textSecondary: colors.textSecondary,
      textMuted: colors.textMuted,
      textSubtle: colors.textTertiary,
      accent: colors.primary,
      accentMuted: colors.primaryDark,
      accentGlow: colors.badgePrimary,
      link: colors.primary,
      success: colors.success,
      successMuted: colors.badgeSuccess,
      warning: colors.warning,
      warningMuted: colors.badgeWarning,
      error: colors.error,
      errorMuted: colors.badgeError,
      verified: colors.success,
      unverified: colors.warning,
      headerBg: resolvedMode === "dark" ? "#12121a" : colors.surface,
      headerText: colors.text,
    }),
    [colors, resolvedMode]
  );
};

export const CategoryProductsScreen = () => {
  const COLORS = useCategoryProductsPalette();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { resolvedMode } = useThemeMode();
  const { isCompact, contentPadding } = useResponsiveLayout();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CategoryProducts">>();
  const { categoryId, title, subCategory: initialSubCategory } = route.params;
  const { user, requestLogin } = useAuth();
  const { error: toastError } = useToast();
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
          sort: effectiveSort === "none" ? undefined : effectiveSort,
          minPrice: effectiveMin,
          maxPrice: effectiveMax,
          scope: "marketplace",
          includeVariantSummary: true,
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
      // Find the product in items to pass the full object
      const product = items.find((p) => p._id === productId);
      navigation.navigate("ProductDetails", { productId, product });
    },
    [navigation, items]
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
      return (
        <AmazonStyleProductCard
          product={item}
          onPress={openDetails}
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
        />
      );
    },
    [isGuest, navigation, openDetails, requestLogin, toastError]
  );

  const keyExtractor = useCallback((item: Product) => item._id, []);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle={resolvedMode === "dark" ? "light-content" : "dark-content"} backgroundColor={COLORS.headerBg} />
        {/* Amazon-style Header */}
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: contentPadding,
              paddingVertical: isCompact ? 10 : 14,
              gap: isCompact ? 8 : 12,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backButton,
              isCompact && styles.backButtonCompact,
            ]}
          >
            <Text style={styles.backButtonIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <AdaptiveSingleLineText style={styles.headerTitle}>{categoryLabel}</AdaptiveSingleLineText>
          </View>
          <View style={{ width: isCompact ? 34 : 40 }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle={resolvedMode === "dark" ? "light-content" : "dark-content"} backgroundColor={COLORS.headerBg} />

      {/* Amazon-style Dark Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: contentPadding,
            paddingVertical: isCompact ? 10 : 14,
            gap: isCompact ? 8 : 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            isCompact && styles.backButtonCompact,
          ]}
        >
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AdaptiveSingleLineText style={styles.headerTitle}>{categoryLabel}</AdaptiveSingleLineText>
        </View>
        <View style={{ width: isCompact ? 34 : 40 }} />
      </View>

      {/* Results & Sort Bar */}
      <View
        style={[
          styles.resultsBar,
          isCompact && styles.resultsBarCompact,
          { paddingHorizontal: contentPadding, paddingVertical: isCompact ? 10 : 12 },
        ]}
      >
        <AdaptiveSingleLineText style={styles.resultsText}>{totalProductsLabel}</AdaptiveSingleLineText>
        <View style={[styles.sortFilterRow, isCompact && styles.sortFilterRowCompact]}>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={[styles.sortButton, isCompact && styles.sortButtonCompact]}
          >
            <AdaptiveSingleLineText style={styles.sortButtonText}>Sort & Filter</AdaptiveSingleLineText>
            <Text style={styles.sortButtonIcon}>▼</Text>
          </TouchableOpacity>
          {(appliedSort !== "none" || appliedMinPrice || appliedMaxPrice) && (
            <TouchableOpacity onPress={resetFilters} style={[styles.clearFiltersButton, isCompact && styles.clearFiltersButtonCompact]}>
              <AdaptiveSingleLineText style={styles.clearFiltersText}>Clear</AdaptiveSingleLineText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subcategory Chips (horizontal scroll) */}
      <View style={styles.chipContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipScroll, { paddingHorizontal: contentPadding }]}
        >
          {subCategories.map((sub) => {
            const isActive = activeSubCategory === sub;
            return (
              <TouchableOpacity
                key={sub}
                onPress={() => setActiveSubCategory(sub)}
                style={[styles.chip, isCompact && styles.chipCompact, isActive && styles.chipActive]}
              >
                <AdaptiveSingleLineText style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {sub}
                </AdaptiveSingleLineText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Product List - Single column like Amazon */}
      <FlatList
        data={filteredItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
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
          loading ? null : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>No products in this category yet</Text>
              <TouchableOpacity onPress={handleRefresh} style={styles.emptyRefreshButton}>
                <Text style={styles.emptyRefreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Amazon-style Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort Section */}
              <Text style={styles.modalSection}>Sort by</Text>
              <View style={styles.sortOptionsContainer}>
                {[
                  { key: "none", label: "Featured" },
                  { key: "priceAsc", label: "Price: Low to High" },
                  { key: "priceDesc", label: "Price: High to Low" },
                  { key: "ratingDesc", label: "Avg. Customer Review" },
                ].map((option) => {
                  const selected = sortMode === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      activeOpacity={0.7}
                      style={[styles.sortOption, selected && styles.sortOptionSelected]}
                      onPress={() => setSortMode(option.key as typeof sortMode)}
                    >
                      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.sortOptionText, selected && styles.sortOptionTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price Range Section */}
              <Text style={[styles.modalSection, { marginTop: 24 }]}>Price</Text>
              <View style={styles.priceRowInputs}>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.priceInputLabel}>Min</Text>
                  <TextInput
                    placeholder="₹0"
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
                <Text style={styles.priceInputDivider}>to</Text>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.priceInputLabel}>Max</Text>
                  <TextInput
                    placeholder="₹50,000+"
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
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleClearFilters}
                activeOpacity={0.7}
                style={styles.modalButtonSecondary}
              >
                <Text style={styles.modalButtonSecondaryText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyFilters}
                activeOpacity={0.8}
                style={styles.modalButtonPrimary}
              >
                <Text style={styles.modalButtonPrimaryText}>Show Results</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: ReturnType<typeof useCategoryProductsPalette>) =>
  StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Loading State
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textMuted,
  },

  // Premium Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  backButtonIcon: {
    fontSize: 20,
    color: COLORS.headerText,
    fontWeight: "400",
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.headerText,
    letterSpacing: 0.3,
  },
  backButtonCompact: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  // Results Bar
  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultsBarCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  sortFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    flexWrap: "wrap",
  },
  sortFilterRowCompact: {
    width: "100%",
    justifyContent: "flex-start",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.accentGlow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent + "40",
    minWidth: 0,
    flexShrink: 1,
  },
  sortButtonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sortButtonText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: "600",
    minWidth: 0,
    flexShrink: 1,
  },
  sortButtonIcon: {
    fontSize: 10,
    color: COLORS.accent,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.errorMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + "40",
  },
  clearFiltersButtonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  clearFiltersText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: "600",
  },

  // Subcategory Chips
  chipContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chipScroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  chipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
    minWidth: 0,
    flexShrink: 1,
  },
  chipTextActive: {
    color: COLORS.accent,
    fontWeight: "600",
  },

  // Error Banner
  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.errorMuted,
    borderWidth: 1,
    borderColor: COLORS.error + "40",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.error,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.error,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },

  // Product Grid
  productRow: {
    justifyContent: "flex-start", // Amazon-style edge-to-edge
    paddingHorizontal: 0,
  },
  productList: {
    paddingTop: 0,
    paddingBottom: 100,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadMoreText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyRefreshButton: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
  },
  emptyRefreshText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Modal (Premium Dark Style)
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCloseText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  modalSection: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Sort Options (Radio style)
  sortOptionsContainer: {
    gap: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
    borderRadius: 10,
  },
  sortOptionSelected: {
    backgroundColor: COLORS.accentGlow,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sortOptionTextSelected: {
    fontWeight: "600",
    color: COLORS.text,
  },

  // Price Inputs
  priceRowInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceInputWrap: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontWeight: "500",
  },
  priceInput: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceLight,
    fontWeight: "500",
  },
  priceInputDivider: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 24,
    fontWeight: "500",
  },

  // Modal Actions
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceLight,
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  });
