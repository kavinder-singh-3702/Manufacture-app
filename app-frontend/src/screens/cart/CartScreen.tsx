import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { useCart } from "../../hooks/useCart";
import { CartItem } from "../../providers/CartProvider";

const { width } = Dimensions.get("window");

// ============================================================
// CART ITEM CARD - Premium Design
// ============================================================
type CartItemCardProps = {
  cartItem: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  index: number;
};

const CartItemCard = ({ cartItem, onUpdateQuantity, onRemove, index }: CartItemCardProps) => {
  const { colors } = useTheme();
  const { item, quantity } = cartItem;

  const handleIncrement = () => {
    onUpdateQuantity(item._id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity <= 1) {
      Alert.alert("Remove Item", `Remove ${item.name} from cart?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => onRemove(item._id) },
      ]);
    } else {
      onUpdateQuantity(item._id, quantity - 1);
    }
  };

  const handleRemove = () => {
    Alert.alert("Remove Item", `Remove ${item.name} from cart?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onRemove(item._id) },
    ]);
  };

  const unitPrice = item.price?.amount || 0;
  const currency = item.price?.currency || "INR";
  const totalPrice = unitPrice * quantity;

  // Alternating gradient colors for visual variety
  const gradientColors: [string, string] = index % 2 === 0
    ? ["rgba(16, 185, 129, 0.08)", "rgba(16, 185, 129, 0.02)"]
    : ["rgba(99, 102, 241, 0.08)", "rgba(99, 102, 241, 0.02)"];

  const accentColor = index % 2 === 0 ? "#10B981" : "#6366F1";

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Accent line */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

        <View style={styles.cardContent}>
          {/* Product Icon Circle */}
          <View style={[styles.productIconContainer, { backgroundColor: accentColor + "20" }]}>
            <Text style={styles.productIcon}>
              {item.category === "electronics" ? "⚡" :
               item.category === "clothing" ? "👕" :
               item.category === "food" ? "🍎" : "📦"}
            </Text>
          </View>

          {/* Product Details */}
          <View style={styles.productDetails}>
            <View style={styles.productHeader}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <TouchableOpacity onPress={handleRemove} style={styles.removeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.productMeta}>
              <View style={[styles.categoryBadge, { backgroundColor: accentColor + "15" }]}>
                <Text style={[styles.categoryText, { color: accentColor }]}>
                  {item.category}
                </Text>
              </View>
              {item.sku && (
                <Text style={[styles.skuText, { color: colors.textMuted }]}>
                  SKU: {item.sku}
                </Text>
              )}
            </View>

            {/* Price & Quantity Row */}
            <View style={styles.priceQuantityRow}>
              {/* Quantity Controls */}
              <View style={[styles.quantityWrapper, { borderColor: colors.border }]}>
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={[styles.qtyBtn, { backgroundColor: colors.background }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.qtyBtnText, { color: colors.text }]}>−</Text>
                </TouchableOpacity>
                <View style={styles.qtyDisplay}>
                  <Text style={[styles.qtyValue, { color: colors.text }]}>{quantity}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleIncrement}
                  style={[styles.qtyBtn, { backgroundColor: accentColor }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.qtyBtnText, { color: "#fff" }]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Price Display */}
              <View style={styles.priceDisplay}>
                <Text style={[styles.unitPriceText, { color: colors.textMuted }]}>
                  {currency} {unitPrice.toFixed(2)} × {quantity}
                </Text>
                <Text style={[styles.totalPriceText, { color: accentColor }]}>
                  {currency} {totalPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ============================================================
// EMPTY CART STATE - Beautiful Design
// ============================================================
const EmptyCart = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={["rgba(99, 102, 241, 0.15)", "rgba(99, 102, 241, 0.05)", "transparent"]}
        style={styles.emptyGradient}
      />
      <View style={styles.emptyIconWrapper}>
        <LinearGradient
          colors={["rgba(99, 102, 241, 0.2)", "rgba(99, 102, 241, 0.05)"]}
          style={styles.emptyIconBg}
        >
          <Text style={styles.emptyIcon}>🛒</Text>
        </LinearGradient>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Cart is Empty</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Start adding products to build your order
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.browseGradient}
        >
          <Text style={styles.browseText}>Browse Products</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// CART SCREEN
// ============================================================
export const CartScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { items, totalItems, updateQuantity, removeFromCart, clearCart, refreshCartItems } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Use refs to access current values without adding to dependencies
  const itemsRef = useRef(items);
  const refreshCartItemsRef = useRef(refreshCartItems);
  itemsRef.current = items;
  refreshCartItemsRef.current = refreshCartItems;

  // Refresh cart items when screen gains focus to get updated product data
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const refresh = async () => {
        if (itemsRef.current.length > 0 && isMounted) {
          setRefreshing(true);
          await refreshCartItemsRef.current();
          if (isMounted) setRefreshing(false);
        }
      };
      refresh();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleClearCart = useCallback(() => {
    if (items.length === 0) return;
    Alert.alert("Clear Cart", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearCart },
    ]);
  }, [items.length, clearCart]);

  const totalValue = items.reduce((sum, ci) => {
    const price = ci.item.price?.amount || 0;
    return sum + price * ci.quantity;
  }, 0);

  const renderItem = useCallback(
    ({ item, index }: { item: CartItem; index: number }) => (
      <CartItemCard
        cartItem={item}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        index={index}
      />
    ),
    [updateQuantity, removeFromCart]
  );

  const keyExtractor = useCallback((item: CartItem) => item.item._id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      {/* Background Gradients */}
      <LinearGradient
        colors={["rgba(99, 102, 241, 0.08)", "transparent", "rgba(16, 185, 129, 0.05)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={["rgba(15, 17, 21, 0.98)", "rgba(15, 17, 21, 0.95)"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["rgba(99, 102, 241, 0.2)", "rgba(99, 102, 241, 0.1)"]}
                style={styles.backButtonGradient}
              >
                <Text style={styles.backIcon}>←</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
                {refreshing && (
                  <View style={styles.refreshIndicator}>
                    <ActivityIndicator size="small" color="#6366F1" />
                  </View>
                )}
              </View>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </Text>
              </View>
            </View>

            {items.length > 0 ? (
              <TouchableOpacity onPress={handleClearCart} style={styles.clearButton} activeOpacity={0.7}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 50 }} />
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Cart Items List */}
      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          extraData={items}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Bottom Summary Bar */}
      {items.length > 0 && (
        <View style={styles.summaryWrapper}>
          <LinearGradient
            colors={["rgba(15, 17, 21, 0.98)", "rgba(15, 17, 21, 1)"]}
            style={styles.summaryGradient}
          >
            {/* Order Summary */}
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal</Text>
                <Text style={[styles.summaryAmount, { color: colors.text }]}>
                  INR {totalValue.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Items</Text>
                <Text style={[styles.summaryAmount, { color: colors.text }]}>{totalItems}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                <Text style={styles.totalAmount}>INR {totalValue.toFixed(2)}</Text>
              </View>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity style={styles.checkoutButton} activeOpacity={0.85}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkoutGradient}
              >
                <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                <View style={styles.checkoutArrow}>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
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

  // Header
  header: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  backIcon: {
    fontSize: 20,
    color: "#6366F1",
    fontWeight: "700",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  refreshIndicator: {
    width: 20,
    height: 20,
  },
  itemCountBadge: {
    marginTop: 4,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
  },
  clearButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 220,
  },

  // Cart Item Card
  cardWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  accentLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    paddingLeft: 20,
    gap: 14,
  },
  productIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  productIcon: {
    fontSize: 24,
  },
  productDetails: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeIcon: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "700",
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  skuText: {
    fontSize: 11,
    fontWeight: "500",
  },
  priceQuantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  quantityWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "600",
  },
  qtyDisplay: {
    paddingHorizontal: 14,
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  priceDisplay: {
    alignItems: "flex-end",
  },
  unitPriceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  totalPriceText: {
    fontSize: 17,
    fontWeight: "800",
    marginTop: 2,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  emptyIconWrapper: {
    marginBottom: 24,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 32,
  },
  browseButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  browseGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  browseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Summary Bar
  summaryWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  summaryGradient: {
    padding: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  summaryDetails: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#10B981",
  },
  checkoutButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  checkoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  checkoutArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
