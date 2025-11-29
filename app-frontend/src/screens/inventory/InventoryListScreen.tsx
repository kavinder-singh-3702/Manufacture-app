import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useCart } from "../../hooks/useCart";
import { inventoryService, InventoryItem } from "../../services/inventory.service";
import { RootStackParamList } from "../../navigation/types";

// ============================================================
// INVENTORY ITEM CARD
// ============================================================
type InventoryItemCardProps = {
  item: InventoryItem;
  onAddToCart: (item: InventoryItem) => void;
  isInCart: boolean;
  cartQuantity: number;
};

const InventoryItemCard = ({ item, onAddToCart, isInCart, cartQuantity }: InventoryItemCardProps) => {
  const { colors, spacing, radius } = useTheme();

  const price = item.sellingPrice || item.costPrice || 0;
  const statusColor =
    item.status === "active"
      ? "#10B981"
      : item.status === "low_stock"
      ? "#F59E0B"
      : "#EF4444";

  return (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      {/* Item Info */}
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <Text style={[styles.itemCategory, { color: colors.textMuted }]}>
          {item.category} {item.sku ? `- ${item.sku}` : ""}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemStock, { color: colors.textSecondary }]}>
            Stock: {item.quantity} {item.unit}
          </Text>
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            {item.currency || "INR"} {price.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity
        onPress={() => onAddToCart(item)}
        style={styles.addButton}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isInCart ? ["#10B981", "#059669"] : ["#FF4757", "#FF6348"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.addButtonGradient, { borderRadius: radius.sm }]}
        >
          {isInCart ? (
            <Text style={styles.addButtonText}>In Cart ({cartQuantity})</Text>
          ) : (
            <Text style={styles.addButtonText}>+ Add</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// INVENTORY LIST SCREEN
// ============================================================
export const InventoryListScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addToCart, isInCart, getCartItem, itemCount } = useCart();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const response = await inventoryService.getAllItems({ limit: 100 });
      setItems(response.items);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [fetchItems]);

  const handleAddToCart = useCallback(
    (item: InventoryItem) => {
      addToCart(item, 1);
    },
    [addToCart]
  );

  const handleGoToCart = useCallback(() => {
    // Reset navigation stack and go directly to cart tab
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            state: {
              routes: [{ name: "cart" }],
            },
          },
        ],
      })
    );
  }, [navigation]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderItem = useCallback(
    ({ item }: { item: InventoryItem }) => {
      const inCart = isInCart(item._id);
      const cartItem = getCartItem(item._id);
      return (
        <InventoryItemCard
          item={item}
          onAddToCart={handleAddToCart}
          isInCart={inCart}
          cartQuantity={cartItem?.quantity || 0}
        />
      );
    },
    [handleAddToCart, isInCart, getCartItem]
  );

  const keyExtractor = useCallback((item: InventoryItem) => item._id, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading inventory...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background */}
      <LinearGradient
        colors={["rgba(108, 99, 255, 0.06)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { padding: spacing.lg, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Browse Inventory</Text>
          <TouchableOpacity onPress={handleGoToCart} style={styles.cartButton}>
            <Text style={styles.cartIcon}>🛒</Text>
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.md }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search items..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery ? "No items found" : "No inventory items"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {searchQuery ? "Try a different search term" : "Add items to get started"}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Cart Button when items are in cart */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={handleGoToCart}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#FF4757", "#FF6348"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.floatingCartGradient, { borderRadius: radius.lg }]}
          >
            <Text style={styles.floatingCartIcon}>🛒</Text>
            <Text style={styles.floatingCartText}>View Cart ({itemCount})</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================
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
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cartButton: {
    position: "relative",
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF4757",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
  },

  // Item card
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemCategory: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    textTransform: "capitalize",
  },
  itemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  itemStock: {
    fontSize: 12,
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  addButton: {
    overflow: "hidden",
  },
  addButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // Floating cart button
  floatingCartButton: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  floatingCartIcon: {
    fontSize: 20,
  },
  floatingCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
