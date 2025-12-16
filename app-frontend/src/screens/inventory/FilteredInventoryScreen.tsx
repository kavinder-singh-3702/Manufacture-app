import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { productService, Product } from "../../services/product.service";
import { RootStackParamList } from "../../navigation/types";

export const FilteredProductsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "FilteredProducts">>();
  const { filter, title } = route.params;

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const response = await productService.getAll({ status: filter, limit: 100 });
      setItems(response.products);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // Refresh list whenever screen comes into focus (e.g., after deleting a product)
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [fetchItems]);

  const handleEditItem = useCallback(
    (productId: string) => {
      navigation.navigate("EditProduct", { productId });
    },
    [navigation]
  );

  const statusColor = filter === "low_stock" ? "#F59E0B" : "#EF4444";

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const price = item.price?.amount || 0;
      return (
        <TouchableOpacity
          onPress={() => handleEditItem(item._id)}
          activeOpacity={0.7}
          style={[
            styles.itemCard,
            {
              backgroundColor: colors.surface,
              borderColor: statusColor + "40",
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.itemCategory, { color: colors.textMuted }]}>
                {item.category} {item.sku ? `• ${item.sku}` : ""}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {filter === "low_stock" ? "Low Stock" : "Out of Stock"}
              </Text>
            </View>
          </View>

          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Current Stock:</Text>
              <Text style={[styles.detailValue, { color: item.availableQuantity === 0 ? colors.error : colors.text }]}>
                {item.availableQuantity} {item.unit || item.price?.unit || "units"}
              </Text>
            </View>
            {price > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Price:</Text>
                <Text style={[styles.detailValue, { color: colors.primary }]}>
                  {(item.price?.currency || "INR")} {price.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => handleEditItem(item._id)}
              style={[styles.editButton, { borderColor: colors.primary }]}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Product</Text>
            </TouchableOpacity>
            {filter === "low_stock" && (
              <View style={[styles.alertBadge, { backgroundColor: "#FEF3C7" }]}>
                <Text style={styles.alertText}>⚠️ Restock Soon</Text>
              </View>
            )}
            {filter === "out_of_stock" && (
              <View style={[styles.alertBadge, { backgroundColor: "#FEE2E2" }]}>
                <Text style={styles.alertText}>🚨 Urgent Restock</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [colors, radius, spacing, statusColor, handleEditItem, filter]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={filter === "low_stock" ? ["rgba(245, 158, 11, 0.06)", "transparent"] : ["rgba(239, 68, 68, 0.06)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { padding: spacing.lg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.surface, margin: spacing.md, padding: spacing.md, borderRadius: radius.md }]}>
        <Text style={[styles.summaryIcon]}>{filter === "low_stock" ? "⚠️" : "🚨"}</Text>
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryCount, { color: statusColor }]}>
            {items.length} {items.length === 1 ? "Product" : "Products"}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            {filter === "low_stock" ? "need restocking soon" : "need urgent restocking"}
          </Text>
        </View>
      </View>

      {error && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: colors.error + "20", margin: spacing.md, padding: spacing.md, borderRadius: radius.md },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No products</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Nothing matches this stock status right now
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "500" },
  header: { borderBottomWidth: 1 },
  backButton: { fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: { fontSize: 32 },
  summaryInfo: { flex: 1 },
  summaryCount: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 14, fontWeight: "500" },
  errorContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 14, fontWeight: "500" },
  retryText: { fontSize: 14, fontWeight: "600" },
  itemCard: { borderWidth: 1 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "700" },
  itemCategory: { fontSize: 12, fontWeight: "500", marginTop: 2, textTransform: "capitalize" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },
  itemDetails: { marginTop: 12, gap: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 12, fontWeight: "600" },
  detailValue: { fontSize: 14, fontWeight: "700" },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  editButton: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderRadius: 10 },
  editButtonText: { fontSize: 12, fontWeight: "700" },
  alertBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  alertText: { fontSize: 12, fontWeight: "700" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, fontWeight: "500" },
});
