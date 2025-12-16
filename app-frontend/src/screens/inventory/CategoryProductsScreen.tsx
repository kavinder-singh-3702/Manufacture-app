import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { productService, Product } from "../../services/product.service";
import { useCart } from "../../hooks/useCart";
import { RootStackParamList } from "../../navigation/types";

const PAGE_SIZE = 25;

const getStockStatus = (product: Product) => {
  if (product.availableQuantity <= 0) {
    return { label: "Out of stock", color: "#EF4444" };
  }
  if (product.availableQuantity <= product.minStockQuantity) {
    return { label: "Low stock", color: "#F59E0B" };
  }
  return { label: "In stock", color: "#10B981" };
};

export const CategoryProductsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CategoryProducts">>();
  const { categoryId, title } = route.params;
  const { addToCart, removeFromCart, isInCart, getCartItem, items: cartItems } = useCart();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });

  const categoryLabel = title || categoryId;

  const loadProducts = useCallback(
    async (offset = 0, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await productService.getProductsByCategory(categoryId, { limit: PAGE_SIZE, offset });
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
    [categoryId]
  );

  // Refresh list whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const handleDeleteProduct = useCallback(
    (product: Product) => {
      Alert.alert(
        "Delete Product",
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await productService.delete(product._id);
                // Remove from local state immediately
                setItems((prev) => prev.filter((item) => item._id !== product._id));
                setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
              } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to delete product");
              }
            },
          },
        ]
      );
    },
    []
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

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const stock = getStockStatus(item);
      const inCart = isInCart(item._id);
      const cartQty = getCartItem(item._id)?.quantity || 0;
      const price = item.price?.amount || 0;

      // Green border for items in cart, yellow for items not in cart
      const cardBorderColor = inCart ? "#10B981" : "#F59E0B";

      return (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: cardBorderColor,
              borderWidth: 2,
              borderRadius: radius.md,
              padding: spacing.md,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                {item.sku || "No SKU"} • {stock.label}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: stock.color + "20", borderColor: stock.color }]}>
              <Text style={[styles.statusText, { color: stock.color }]}>{stock.label}</Text>
            </View>
          </View>

          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <View>
              <Text style={[styles.label, { color: colors.textMuted }]}>Available</Text>
              <Text style={[styles.value, { color: colors.text }]}>{item.availableQuantity} {item.unit || item.price?.unit || "units"}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Price</Text>
              <Text style={[styles.value, { color: colors.primary }]}>
                {(item.price?.currency || "INR")} {price.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={[styles.actionsRow, { marginTop: spacing.sm }]}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate("EditProduct", { productId: item._id })}
                style={[styles.editButton, { borderColor: colors.primary, borderRadius: radius.sm }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteProduct(item)}
                style={[styles.deleteButton, { borderColor: colors.error, borderRadius: radius.sm }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cartActions}>
              {inCart && (
                <TouchableOpacity onPress={() => removeFromCart(item._id)} style={[styles.secondaryButton, { borderColor: colors.border, borderRadius: radius.sm }]}>
                  <Text style={[styles.secondaryText, { color: colors.text }]}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => addToCart(item, 1)}
                style={[styles.primaryButton, { borderRadius: radius.sm }]}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#FF4757", "#FF6348"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.primaryButtonGradient, { borderRadius: radius.sm }]}
                >
                  <Text style={styles.primaryButtonText}>{inCart ? `Add more (${cartQty})` : "Add to cart"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [colors.border, colors.error, colors.primary, colors.surface, colors.text, colors.textMuted, navigation, radius.md, radius.sm, spacing.md, spacing.sm, addToCart, getCartItem, isInCart, removeFromCart, handleDeleteProduct]
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
      <LinearGradient colors={["rgba(108, 99, 255, 0.08)", "transparent"]} style={StyleSheet.absoluteFill} />

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

      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, margin: spacing.md, padding: spacing.md }]}>
        <Text style={styles.summaryIcon}>🗂️</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>{categoryLabel}</Text>
          <Text style={[styles.summaryText, { color: colors.textMuted }]}>
            {pagination.total > 0 ? "Products available in this category" : "No products yet for this category"}
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
          <Text style={[styles.countBadgeText, { color: colors.primary }]}>{pagination.total}</Text>
        </View>
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
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        extraData={cartItems}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          pagination.hasMore ? (
            <View style={{ paddingVertical: spacing.md }}>
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <TouchableOpacity onPress={handleLoadMore} style={[styles.loadMoreButton, { borderColor: colors.border, borderRadius: radius.sm }]}>
                  <Text style={[styles.loadMoreText, { color: colors.text }]}>Load more</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No products</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Add products to {categoryLabel} to see them here
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
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
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: { fontSize: 24 },
  summaryTitle: { fontSize: 16, fontWeight: "700" },
  summaryText: { fontSize: 13, fontWeight: "500" },
  countBadge: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 999 },
  countBadgeText: { fontSize: 14, fontWeight: "800" },
  errorBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 14, fontWeight: "600" },
  retryText: { fontSize: 14, fontWeight: "700" },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  productName: { fontSize: 16, fontWeight: "800" },
  productMeta: { fontSize: 12, fontWeight: "600" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  label: { fontSize: 12, fontWeight: "600" },
  value: { fontSize: 14, fontWeight: "700" },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  leftActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editButton: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5 },
  editButtonText: { fontSize: 11, fontWeight: "700" },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5 },
  deleteButtonText: { fontSize: 11, fontWeight: "700" },
  cartActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  secondaryButton: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5 },
  secondaryText: { fontSize: 12, fontWeight: "700" },
  primaryButton: { overflow: "hidden" },
  primaryButtonGradient: { paddingHorizontal: 16, paddingVertical: 12 },
  primaryButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  loadMoreButton: { paddingVertical: 12, alignItems: "center", borderWidth: 1.5 },
  loadMoreText: { fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptySubtitle: { fontSize: 14, fontWeight: "500", textAlign: "center", paddingHorizontal: 16 },
});
