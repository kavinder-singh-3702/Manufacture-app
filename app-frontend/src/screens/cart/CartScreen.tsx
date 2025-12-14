import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";
import { useCart } from "../../hooks/useCart";
import { CartItem } from "../../providers/CartProvider";

// ============================================================
// CART ITEM CARD
// ============================================================
type CartItemCardProps = {
  cartItem: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

const CartItemCard = ({ cartItem, onUpdateQuantity, onRemove }: CartItemCardProps) => {
  const { colors, spacing, radius } = useTheme();
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

  const totalPrice = (item.sellingPrice || item.costPrice || 0) * quantity;

  return (
    <View
      style={[
        styles.cartItemCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      {/* Item Header */}
      <View style={styles.cartItemHeader}>
        <View style={styles.cartItemInfo}>
          <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cartItemCategory, { color: colors.textMuted }]}>
            {item.category} {item.sku ? `- ${item.sku}` : ""}
          </Text>
        </View>
        <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
          <Text style={[styles.removeButtonText, { color: colors.error }]}>Remove</Text>
        </TouchableOpacity>
      </View>

      {/* Quantity Controls & Price */}
      <View style={styles.cartItemFooter}>
        <View style={[styles.quantityControls, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
          <TouchableOpacity
            onPress={handleDecrement}
            style={[styles.quantityButton, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.quantityButtonText, { color: colors.text }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
          <TouchableOpacity
            onPress={handleIncrement}
            style={[styles.quantityButton, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.quantityButtonText, { color: colors.text }]}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.unitPrice, { color: colors.textMuted }]}>
            {item.sellingPrice || item.costPrice || 0} x {quantity}
          </Text>
          <Text style={[styles.totalPrice, { color: colors.primary }]}>
            {item.currency || "INR"} {totalPrice.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============================================================
// EMPTY CART STATE
// ============================================================
const EmptyCart = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Cart is Empty</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Add inventory items to get started
      </Text>
    </View>
  );
};

// ============================================================
// CART SCREEN
// ============================================================
export const CartScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { items, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();

  const handleClearCart = useCallback(() => {
    if (items.length === 0) return;
    Alert.alert("Clear Cart", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearCart },
    ]);
  }, [items.length, clearCart]);

  const totalValue = items.reduce((sum, ci) => {
    const price = ci.item.sellingPrice || ci.item.costPrice || 0;
    return sum + price * ci.quantity;
  }, 0);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <CartItemCard
        cartItem={item}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
      />
    ),
    [updateQuantity, removeFromCart]
  );

  const keyExtractor = useCallback((item: CartItem) => item.item._id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["rgba(255, 71, 87, 0.08)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { padding: spacing.lg, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Your Cart</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {totalItems} {totalItems === 1 ? "item" : "items"} added
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={[styles.clearButton, { color: colors.error }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items List */}
      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Summary Bar */}
      {items.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Value</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              INR {totalValue.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} activeOpacity={0.8}>
            <LinearGradient
              colors={["#FF4757", "#FF6348"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.checkoutGradient, { borderRadius: radius.md }]}
            >
              <Text style={styles.checkoutText}>Proceed</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Cart item card
  cartItemCard: {
    borderWidth: 1,
  },
  cartItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "700",
  },
  cartItemCategory: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    textTransform: "capitalize",
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cartItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  unitPrice: {
    fontSize: 12,
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Summary bar
  summaryBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  summaryInfo: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  checkoutButton: {
    overflow: "hidden",
  },
  checkoutGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
