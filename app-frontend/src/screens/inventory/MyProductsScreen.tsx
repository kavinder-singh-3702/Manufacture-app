import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute, RouteProp, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { productService, type Product } from "../../services/product.service";
import { RootStackParamList } from "../../navigation/types";
import { QuickAdjustStockSheet } from "./components/QuickAdjustStockSheet";

const PAGE_SIZE = 25;
type StatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export const MyProductsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "MyProducts">>();
  const isFocused = useIsFocused();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });

  const [query, setQuery] = useState<string>(route.params?.initialQuery ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(route.params?.initialStatus ?? "all");
  const autoFocusSearch = useMemo(() => route.params?.initialQuery !== undefined, [route.params?.initialQuery]);

  const [adjustSheet, setAdjustSheet] = useState<{ open: boolean; product: Product | null; suggestedQty: number }>({
    open: false,
    product: null,
    suggestedQty: 1,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If navigated again with params, update the local state.
  useEffect(() => {
    if (route.params?.initialQuery !== undefined) setQuery(route.params.initialQuery);
    if (route.params?.initialStatus) setStatusFilter(route.params.initialStatus);
  }, [route.params?.initialQuery, route.params?.initialStatus]);

  const fetchProducts = useCallback(
    async (offset = 0, append = false) => {
      try {
        setError(null);
        if (append) {
          setLoadingMore(true);
        } else if (!refreshing) {
          setLoading(true);
        }

        const response = await productService.getAll({
          scope: "company",
          limit: PAGE_SIZE,
          offset,
          search: query.trim() ? query.trim() : undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        });

        setProducts((prev) => (append ? [...prev, ...(response.products || [])] : response.products || []));
        setPagination(response.pagination || { total: 0, limit: PAGE_SIZE, offset, hasMore: false });
      } catch (err: any) {
        setError(err?.message || "Failed to load products");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [PAGE_SIZE, query, refreshing, statusFilter]
  );

  useFocusEffect(
    useCallback(() => {
      fetchProducts(0, false);
    }, [fetchProducts])
  );

  // Debounced search/filter while focused.
  useEffect(() => {
    if (!isFocused) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(0, false);
    }, 320);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchProducts, isFocused, query, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(0, false);
  }, [fetchProducts]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !pagination.hasMore) return;
    const nextOffset = pagination.offset + pagination.limit;
    fetchProducts(nextOffset, true);
  }, [fetchProducts, loading, loadingMore, pagination.hasMore, pagination.limit, pagination.offset]);

  const openAdjustSheet = useCallback((product: Product, suggestedQty?: number) => {
    setAdjustSheet({ open: true, product, suggestedQty: typeof suggestedQty === "number" && suggestedQty > 0 ? suggestedQty : 1 });
  }, []);

  const closeAdjustSheet = useCallback(() => {
    setAdjustSheet({ open: false, product: null, suggestedQty: 1 });
  }, []);

  const handleProductPress = useCallback(
    (productId: string) => {
      navigation.navigate("ProductDetails", { productId });
    },
    [navigation]
  );

  const renderProduct = useCallback(
    ({ item: product }: { item: Product }) => {
      const price = product.price?.amount || 0;
      const currencySymbol = product.price?.currency === "INR" ? "₹" : "₹";
      const stockQty = product.availableQuantity || 0;
      const stockStatus =
        product.stockStatus || (stockQty <= 0 ? "out_of_stock" : stockQty <= (product.minStockQuantity || 0) ? "low_stock" : "in_stock");

      const statusColor =
        stockStatus === "in_stock" ? colors.success : stockStatus === "low_stock" ? colors.warning : colors.error;

      const statusLabel = stockStatus === "in_stock" ? "In Stock" : stockStatus === "low_stock" ? "Low Stock" : "Out of Stock";

      return (
        <TouchableOpacity
          style={[
            styles.productCard,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
          ]}
          onPress={() => handleProductPress(product._id)}
          activeOpacity={0.75}
        >
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={[styles.productCategory, { color: colors.textMuted }]} numberOfLines={1}>
                {product.category?.replace(/-/g, " ") || "Uncategorized"}
                {product.sku ? `  •  ${product.sku}` : ""}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor + "40" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={[styles.productDetails, { borderTopColor: colors.border }]}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Price</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{currencySymbol}{price.toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Stock</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{stockQty} units</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openAdjustSheet(product, 1)}
              style={[styles.adjustPill, { borderRadius: radius.pill, borderColor: colors.border }]}
            >
              <Ionicons name="swap-vertical" size={16} color={colors.text} />
              <Text style={[styles.adjustPillText, { color: colors.text }]}>Adjust</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [colors.border, colors.error, colors.success, colors.text, colors.textMuted, colors.warning, handleProductPress, openAdjustSheet, radius.md, radius.pill]
  );

  const headerCount = pagination.total || products.length;

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Products</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {headerCount} product{headerCount !== 1 ? "s" : ""} listed
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("AddProduct")}
        >
          <Ionicons name="add" size={20} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search + filters */}
      <View style={[styles.searchWrap, { padding: spacing.md, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search products or SKU"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            autoFocus={autoFocusSearch}
          />
          {query.trim().length ? (
            <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.8} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
          {(
            [
              { key: "all", label: "All" },
              { key: "in_stock", label: "In stock" },
              { key: "low_stock", label: "Low stock" },
              { key: "out_of_stock", label: "Out of stock" },
            ] as const
          ).map((chip) => {
            const isActive = statusFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setStatusFilter(chip.key)}
                activeOpacity={0.85}
                style={[
                  styles.chip,
                  {
                    borderRadius: radius.pill,
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: isActive ? colors.textOnPrimary : colors.text }]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <View style={[styles.errorBanner, { margin: spacing.md, borderRadius: radius.lg, borderColor: colors.error + "35", backgroundColor: colors.error + "12" }]}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text, flex: 1 }]} numberOfLines={2}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => fetchProducts(0, false)} activeOpacity={0.85}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Product list */}
      {loading && !products.length && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading products…</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={[styles.emptyState, { paddingTop: 80 }]}>
          <Ionicons name="cube-outline" size={52} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No products found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {query.trim() || statusFilter !== "all" ? "Try a different search or filter." : "Start adding products to see them here."}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary, borderRadius: radius.lg }]}
            onPress={() => navigation.navigate("AddProduct")}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={18} color={colors.textOnPrimary} />
            <Text style={styles.emptyButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: spacing.md }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <QuickAdjustStockSheet
        visible={adjustSheet.open}
        product={adjustSheet.product}
        suggestedQty={adjustSheet.suggestedQty}
        onClose={closeAdjustSheet}
        onSaved={() => fetchProducts(0, false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 14, marginTop: 12 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { marginRight: 12 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  addButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  searchWrap: { borderBottomWidth: 1 },
  searchBar: { borderWidth: 1, paddingHorizontal: 12, height: 46, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600" },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "800" },

  errorBanner: { borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  errorText: { fontSize: 12, fontWeight: "700" },
  retryText: { fontSize: 12, fontWeight: "900" },

  productCard: { padding: 16, borderWidth: 1 },
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  productCategory: { fontSize: 12, marginTop: 4, textTransform: "capitalize" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: "700" },

  productDetails: { flexDirection: "row", alignItems: "center", paddingTop: 12, borderTopWidth: 1, gap: 10 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: "700" },

  adjustPill: { height: 32, paddingHorizontal: 10, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  adjustPillText: { fontSize: 12, fontWeight: "800" },

  emptyState: { alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", marginBottom: 24 },
  emptyButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  emptyButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

export default MyProductsScreen;
