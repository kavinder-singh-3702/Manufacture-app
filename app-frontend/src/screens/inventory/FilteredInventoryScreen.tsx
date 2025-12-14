import { useState, useCallback, useEffect } from "react";
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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { inventoryService, InventoryItem } from "../../services/inventory.service";
import { RootStackParamList } from "../../navigation/types";

export const FilteredInventoryScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "FilteredInventory">>();
  const { filter, title } = route.params;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const response = await inventoryService.getAllItems({ status: filter, limit: 100 });
      setItems(response.items);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [fetchItems]);

  const handleEditItem = useCallback((itemId: string) => {
    navigation.navigate("EditInventoryItem", { itemId });
  }, [navigation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#10B981";
      case "low_stock": return "#F59E0B";
      case "out_of_stock": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "low_stock": return "Low Stock";
      case "out_of_stock": return "Out of Stock";
      case "discontinued": return "Discontinued";
      default: return status;
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: InventoryItem }) => {
      const statusColor = getStatusColor(item.status);
      const price = item.sellingPrice || item.costPrice || 0;

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
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Current Stock:</Text>
              <Text style={[styles.detailValue, { color: item.quantity === 0 ? colors.error : colors.text }]}>
                {item.quantity} {item.unit}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Min Level:</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                {item.minStockLevel} {item.unit}
              </Text>
            </View>
            {price > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Price:</Text>
                <Text style={[styles.detailValue, { color: colors.primary }]}>
                  ₹{price.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => handleEditItem(item._id)}
              style={[styles.editButton, { borderColor: colors.primary }]}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Item</Text>
            </TouchableOpacity>
            {item.status === "low_stock" && (
              <View style={[styles.alertBadge, { backgroundColor: "#FEF3C7" }]}>
                <Text style={styles.alertText}>⚠️ Restock Soon</Text>
              </View>
            )}
            {item.status === "out_of_stock" && (
              <View style={[styles.alertBadge, { backgroundColor: "#FEE2E2" }]}>
                <Text style={styles.alertText}>🚨 Urgent Restock</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [colors, radius, spacing, handleEditItem]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading items...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background */}
      <LinearGradient
        colors={filter === "low_stock" ? ["rgba(245, 158, 11, 0.06)", "transparent"] : ["rgba(239, 68, 68, 0.06)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { padding: spacing.lg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, margin: spacing.md, padding: spacing.md, borderRadius: radius.md }]}>
        <Text style={[styles.summaryIcon]}>
          {filter === "low_stock" ? "⚠️" : "🚨"}
        </Text>
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryCount, { color: filter === "low_stock" ? "#F59E0B" : "#EF4444" }]}>
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            {filter === "low_stock" ? "need restocking soon" : "need urgent restocking"}
          </Text>
        </View>
      </View>

      {/* Error State */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + "20", margin: spacing.md, padding: spacing.md, borderRadius: radius.md }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Items List */}
      {!error && (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                All Clear!
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {filter === "low_stock"
                  ? "No items are running low on stock"
                  : "No items are out of stock"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIcon: {
    fontSize: 32,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  itemCard: {
    borderWidth: 1.5,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemCategory: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    textTransform: "capitalize",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  itemDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  alertBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
