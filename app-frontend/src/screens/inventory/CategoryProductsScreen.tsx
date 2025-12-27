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

export const CategoryProductsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CategoryProducts">>();
  const { categoryId, title, subCategory: initialSubCategory } = route.params;
  const { user } = useAuth();
  const { isInCart, getCartItem, items: cartItems, addToCart } = useCart();
  const isGuest = user?.role === AppRole.GUEST;
  const isAdmin = user?.role === AppRole.ADMIN;

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
          createdByRole: isAdmin ? undefined : "admin",
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
    [appliedMaxPrice, appliedMinPrice, appliedSort, categoryId, isAdmin]
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

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openDetails(item._id)}
          style={[
            styles.productTile,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            },
          ]}
        >
          <View
            style={[
              styles.productImageWrap,
              {
                borderRadius: radius.md,
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            {primaryImage ? (
              <Image
                source={{ uri: primaryImage }}
                style={[styles.productImage, { borderRadius: radius.md }]}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.productImagePlaceholder, { borderRadius: radius.md }]}>
                <Text style={{ fontSize: 20 }}>🛍️</Text>
              </View>
            )}
            <View
              style={[
                styles.badgeFloating,
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

          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.companyRow}>
            <Text style={[styles.companyName, { color: colors.textMuted }]} numberOfLines={2} ellipsizeMode="tail">
              {companyName}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const filled = (typeof (item.attributes as any)?.rating === "number"
                ? (item.attributes as any).rating
                : typeof (item.attributes as any)?.stars === "number"
                ? (item.attributes as any).stars
                : 0) >= idx + 1;
              return (
                <Text key={idx} style={[styles.star, { color: filled ? "#facc15" : colors.textMuted }]}>
                  ★
                </Text>
              );
            })}
          </View>
          <Text style={[styles.productSize, { color: colors.textMuted }]} numberOfLines={1}>
            {sizeLabel ? `(${sizeLabel})` : item.category}
          </Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceText, { color: colors.text }]}>{displayPrice}</Text>
              {typeof compareAt === "number" && compareAt > price ? (
                <Text style={[styles.comparePrice, { color: colors.textMuted }]}>
                  {currencySymbol}
                  {compareAt.toFixed(2)}
                </Text>
              ) : null}
            </View>
          </View>

          {!isGuest && (
            <View style={styles.footerCard}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => addToCart(item, selectedQty)}
                style={[
                  styles.addButton,
                  {
                    borderRadius: radius.pill,
                    borderColor: isAdded ? colors.primary + "60" : "transparent",
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    isAdded
                      ? [colors.backgroundSecondary, colors.surface]
                      : [colors.primary, colors.primaryDark]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.addButtonFill, { borderRadius: radius.pill }]}
                >
                  <Text style={[styles.addButtonText, { color: isAdded ? colors.text : "#fff" }]}>
                    {isAdded ? "Added to cart" : "Add to cart"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [addToCart, colors.border, colors.primary, colors.surface, colors.text, colors.textMuted, getCartItem, isGuest, isInCart, openDetails, radius.md]
  );

  const keyExtractor = useCallback((item: Product) => item._id, []);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["rgba(64,64,64,0.25)", "transparent"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { padding: spacing.lg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {categoryLabel}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{totalProductsLabel}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.layoutRow}>
        <View style={[styles.sideNav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm, gap: spacing.xs }}>
            {subCategories.map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => setActiveSubCategory(sub)}
                style={[
                  styles.sideNavItem,
                  {
                    backgroundColor: activeSubCategory === sub ? colors.primary + "20" : colors.surface,
                    borderColor: activeSubCategory === sub ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.sideNavText, { color: activeSubCategory === sub ? colors.primary : colors.text }]} numberOfLines={1}>
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.gridArea}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              style={[
                styles.filterButton,
                { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill },
              ]}
              hitSlop={8}
            >
              <Text style={[styles.filterButtonIcon, { color: colors.primary }]}>☰</Text>
              <Text style={[styles.filterButtonText, { color: colors.text }]}>Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetFilters}
              style={[
                styles.clearButton,
                { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill },
              ]}
            >
              <Text style={[styles.clearButtonText, { color: colors.textMuted }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.error + "15", marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.md },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <TouchableOpacity onPress={handleRefresh}>
                <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={filteredItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            extraData={cartItems}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.sm, justifyContent: "flex-start" }}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              pagination.hasMore ? (
                <View style={{ paddingVertical: spacing.md }}>
                  {loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No products</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    No products in this category yet
                  </Text>
                </View>
              )
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
            <Text style={[styles.modalSection, { color: colors.textMuted }]}>Sort by</Text>
            {[
              { key: "none", label: "All" },
              { key: "priceAsc", label: "Price: Low to High" },
              { key: "priceDesc", label: "Price: High to Low" },
              { key: "ratingDesc", label: "Rating: High to Low" },
            ].map((option) => {
              const selected = sortMode === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionRow,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary + "10" : colors.background,
                    },
                  ]}
                  onPress={() => setSortMode(option.key as typeof sortMode)}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && <Text style={{ color: colors.primary }}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.modalSection, { color: colors.textMuted, marginTop: spacing.md }]}>Price range</Text>
            <View style={styles.priceRowInputs}>
              <TextInput
                placeholder="Min"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  setMinPrice(cleaned);
                }}
                onBlur={() => {
                  const nextMin = minPrice ? parseFloat(minPrice) : undefined;
                  const nextMax = maxPrice ? parseFloat(maxPrice) : undefined;
                  commitFiltersAndReload(sortMode, nextMin, nextMax);
                }}
                style={[
                  styles.priceInput,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
                ]}
              />
              <Text style={{ color: colors.textMuted }}>to</Text>
              <TextInput
                placeholder="Max"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  setMaxPrice(cleaned);
                }}
                onBlur={() => {
                  const nextMin = minPrice ? parseFloat(minPrice) : undefined;
                  const nextMax = maxPrice ? parseFloat(maxPrice) : undefined;
                  commitFiltersAndReload(sortMode, nextMin, nextMax);
                }}
                style={[
                  styles.priceInput,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
                ]}
              />
            </View>

            <View style={[styles.modalActions, { flexWrap: "wrap" }]}>
              <TouchableOpacity
                onPress={handleClearFilters}
                style={[
                  styles.modalButtonSecondary,
                  { borderColor: colors.border, borderRadius: radius.md, minWidth: "48%" },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyFilters}
                style={[
                  styles.modalButtonPrimary,
                  { borderRadius: radius.md, backgroundColor: colors.primary, minWidth: "48%" },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "500" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1 },
  backButton: { fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  errorBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 14, fontWeight: "600" },
  retryText: { fontSize: 14, fontWeight: "700" },
  layoutRow: { flex: 1, flexDirection: "row" },
  sideNav: { width: 96, borderRightWidth: 1, paddingHorizontal: 6 },
  sideNavItem: { paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderRadius: 12 },
  sideNavText: { fontSize: 12, fontWeight: "700" },
  gridArea: { flex: 1 },
  filtersRow: { flexDirection: "row", alignItems: "center" },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  filterButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  filterButtonIcon: { fontSize: 14, marginRight: 6 },
  filterButtonText: { fontSize: 12, fontWeight: "700" },
  clearButton: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  clearButtonText: { fontSize: 12, fontWeight: "700" },
  productTile: {
    flex: 1,
    flexBasis: "48%",
    maxWidth: "48%",
    padding: 12,
    marginBottom: 12,
    position: "relative",
    borderWidth: 1,
  },
  productImageWrap: {
    width: "100%",
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    position: "relative",
    borderWidth: 1,
  },
  productImage: { width: "100%", height: "100%" },
  productImagePlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  productTitle: { fontSize: 14, fontWeight: "700" },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  companyName: { flex: 1, fontSize: 11, fontWeight: "700" },
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderRadius: 999 },
  badgeFloating: { position: "absolute", top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderRadius: 999 },
  badgeText: { fontSize: 9, fontWeight: "800" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  star: { fontSize: 12, marginRight: 2 },
  productSize: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  priceText: { fontSize: 16, fontWeight: "800" },
  comparePrice: { fontSize: 13, fontWeight: "600", textDecorationLine: "line-through" },
  footerCard: { marginTop: 12 },
  addButton: {
    marginTop: 0,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "stretch",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonFill: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptySubtitle: { fontSize: 14, fontWeight: "500", textAlign: "center", paddingHorizontal: 16 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalCard: { margin: 16, padding: 16, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  modalSection: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 8 },
  optionRow: { paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  optionText: { fontSize: 14, fontWeight: "700" },
  priceRowInputs: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, justifyContent: "space-between" },
  priceInput: { width: "43%", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalButtonSecondary: { flex: 1, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  modalButtonPrimary: { flex: 1, paddingVertical: 12, alignItems: "center" },
  modalButtonText: { fontSize: 14, fontWeight: "800" },
});
