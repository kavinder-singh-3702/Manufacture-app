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
import { useAuth } from "../../hooks/useAuth";
import { AppRole } from "../../constants/roles";
import { productService, Product, ProductCategory } from "../../services/product.service";
import { useCart } from "../../hooks/useCart";
import { RootStackParamList } from "../../navigation/types";
import { preferenceService } from "../../services/preference.service";

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (productId: string) => void;
  inCartQty?: number;
};

const ProductCard = ({ product, onAddToCart, onOpenDetails, inCartQty }: ProductCardProps) => {
  const { colors, radius } = useTheme();
  const price = product.price?.amount || 0;
  const currency = product.price?.currency === "INR" ? "₹" : product.price?.currency || "₹";
  const primaryImage = product.images?.[0]?.url;
  const companyName = product.company?.displayName || "Admin";
  const compliance = product.company?.complianceStatus;
  const verified = compliance === "approved";
  const badgeColor = verified ? "#0ea5e9" : "#f97316";
  const badgeLabel = verified ? "Verified" : "Unverified";
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
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={[styles.cardImageWrap, { borderColor: colors.border, borderRadius: radius.lg }]}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor + "20",
              borderColor: badgeColor,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
        <View style={[styles.tagPill, { borderColor: colors.border }]}>
          <Text style={[styles.tagText, { color: colors.textMuted }]} numberOfLines={1}>
            {bestFor || "ADMIN PICK"}
          </Text>
        </View>
        {primaryImage ? (
          <Image source={{ uri: primaryImage }} style={[styles.cardImage, { borderRadius: radius.lg }]} />
        ) : (
          <View style={[styles.cardPlaceholder, { borderRadius: radius.lg, backgroundColor: colors.backgroundSecondary }]}>
            <Text style={{ fontSize: 18 }}>🛍️</Text>
          </View>
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.cardSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {companyName}
        </Text>
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <Text key={idx} style={[styles.star, { color: rating >= idx + 1 ? "#facc15" : colors.textMuted }]}>
              ★
            </Text>
          ))}
        </View>
        <Text style={[styles.unitText, { color: colors.textMuted }]} numberOfLines={1}>
          ({product.unit || product.price?.unit || "units"})
        </Text>
        <Text style={[styles.priceText, { color: colors.text }]} numberOfLines={1}>
          {currency}
          {price.toFixed(2)}
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.addButton, { borderRadius: radius.pill, borderColor: colors.border }]}
          onPress={() => onAddToCart(product)}
        >
          <LinearGradient
            colors={["#6366F1", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.addButtonGradient, { borderRadius: radius.pill }]}
          >
            <Text style={styles.addButtonLabel}>{inCartQty ? `In cart (${inCartQty})` : "Add to cart"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const PAGE_SIZE = 16;

export const AdminProductsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { addToCart, isInCart, getCartItem, totalItems } = useCart();

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
    [activeCategory]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadProducts(0, false);
  }, [activeCategory, loadProducts, maxPrice, minPrice, sortMode]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
    loadProducts(0, false);
  }, [fetchCategories, loadProducts]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !pagination.hasMore) return;
    loadProducts(pagination.offset + pagination.limit, true);
  }, [loadProducts, loading, loadingMore, pagination]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addToCart(product, 1);
      preferenceService
        .logEvent({ type: "add_to_cart", productId: product._id, category: product.category })
        .catch(() => {});
    },
    [addToCart]
  );

  const handleOpenDetails = useCallback(
    (productId: string) => {
      navigation.navigate("ProductDetails", { productId });
    },
    [navigation]
  );

  const handleOpenCart = useCallback(() => {
    navigation.navigate("Cart");
  }, [navigation]);

  const renderCategoryChips = useCallback(() => {
    if (!categories.length) return null;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.85}
              style={[
                styles.chip,
                {
                  borderRadius: radius.md,
                  borderColor: isActive ? colors.primary : colors.border,
                  backgroundColor: isActive ? colors.primary + "25" : colors.surface,
                },
              ]}
            >
              <Text style={{ color: isActive ? colors.primary : colors.text }} numberOfLines={1}>
                {cat.title}
              </Text>
              {typeof cat.count === "number" && (
                <View style={[styles.chipCount, { backgroundColor: isActive ? colors.primary : colors.backgroundSecondary }]}>
                  <Text style={{ color: isActive ? "#fff" : colors.textMuted, fontWeight: "700" }}>{cat.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }, [categories, activeCategory, colors.backgroundSecondary, colors.border, colors.primary, colors.surface, colors.text, colors.textMuted, radius.md, spacing.md, spacing.sm]);

  const renderListHeader = useCallback(() => {
    return (
      <>
        <LinearGradient
          colors={["rgba(99,102,241,0.14)", "rgba(14,165,233,0.06)", "rgba(15,23,42,0.6)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.panel, { borderRadius: radius.xl, borderColor: colors.border }]}
        >
          {renderCategoryChips()}
        </LinearGradient>

        <View style={[styles.filterRow, { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, paddingTop: spacing.sm }]}>
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill }]}
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={[styles.filterButtonIcon, { color: colors.text }]}>☰</Text>
            <Text style={[styles.filterButtonText, { color: colors.text }]}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill }]}
            activeOpacity={0.8}
            onPress={() => {
              setActiveCategory("all");
              setSortMode("none");
              setMinPrice("");
              setMaxPrice("");
              loadProducts(0, false);
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>Reset</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "15", borderColor: colors.error, marginHorizontal: spacing.sm }]}>
            <Text style={{ color: colors.error, fontWeight: "700" }}>{error}</Text>
            <TouchableOpacity onPress={() => loadProducts(0, false)}>
              <Text style={{ color: colors.text }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  }, [colors.border, colors.error, colors.surface, colors.text, error, loadProducts, radius.pill, radius.xl, renderCategoryChips, setActiveCategory, spacing.sm]);

  const renderItem = ({ item }: { item: Product }) => {
    const inCartQty = isInCart(item._id) ? getCartItem(item._id)?.quantity : undefined;
    return (
      <View style={{ flex: 1, paddingHorizontal: spacing.xs }}>
        <ProductCard product={item} onAddToCart={handleAddToCart} onOpenDetails={handleOpenDetails} inCartQty={inCartQty} />
      </View>
    );
  };

  if (loading && !refreshing && products.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={["rgba(34,197,94,0.08)", "transparent"]} style={StyleSheet.absoluteFill} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textMuted, marginTop: spacing.sm, fontWeight: "600" }}>Loading admin products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["rgba(99,102,241,0.08)", "rgba(14,165,233,0.06)", "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Main", { screen: "dashboard" as any }))}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Admin catalog</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{totalLabel}</Text>
        </View>
        <View style={{ width: 90 }} />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={renderListHeader}
        columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.md }}
        contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl + spacing.md, paddingTop: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: spacing.md }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.emptyState, { padding: spacing.lg }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No admin products yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Products added by admins will appear here.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Filters modal (mirrors CategoryProductsScreen) */}
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
                style={[
                  styles.priceInput,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
                ]}
              />
            </View>

            <View style={[styles.modalActions, { flexWrap: "wrap" }]}>
              <TouchableOpacity
                onPress={() => {
                  setSortMode("none");
                  setMinPrice("");
                  setMaxPrice("");
                  setFilterModalVisible(false);
                  loadProducts(0, false);
                }}
                style={[
                  styles.modalButtonSecondary,
                  { borderColor: colors.border, borderRadius: radius.md, minWidth: "48%" },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setFilterModalVisible(false);
                  loadProducts(0, false);
                }}
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
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { fontSize: 16, fontWeight: "700" },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSubtitle: { fontSize: 13, fontWeight: "600" },
  cartPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 8,
    marginHorizontal: 8,
    borderRadius: 12,
    minWidth: 120,
  },
  chipCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 4 },
  filterButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderWidth: 1, borderRadius: 18 },
  resetButton: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: 18 },
  filterButtonIcon: { fontSize: 16, fontWeight: "800" },
  filterButtonText: { fontSize: 14, fontWeight: "700" },
  panel: { borderWidth: 1, paddingVertical: 4 },
  card: {
    borderWidth: 1,
    padding: 16,
    gap: 8,
    flex: 1,
    minWidth: 170,
    maxWidth: 210,
    alignSelf: "stretch",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    backgroundColor: "rgba(17,24,39,0.85)",
  },
  cardImageWrap: {
    borderWidth: 1,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  cardPlaceholder: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  tagPill: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  tagText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardSubtitle: { fontSize: 13, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  star: { fontSize: 14 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  priceText: { fontSize: 17, fontWeight: "800" },
  unitText: { fontSize: 12, fontWeight: "600" },
  addButton: {
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 10,
  },
  addButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    width: "100%",
  },
  addButtonLabel: { color: "#fff", fontWeight: "800" },
  emptyState: { alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: "800" },
  emptySubtitle: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  errorBox: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
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
