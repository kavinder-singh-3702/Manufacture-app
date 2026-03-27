import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { CartItem } from "../../providers/CartProvider";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { RootStackParamList } from "../../navigation/types";
import {
  canCallProduct,
  canMessageProduct,
  callProductSeller,
  startProductConversation,
} from "../product/utils/productContact";

const useCartPalette = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();

  return useMemo(
    () => ({
      background: colors.background,
      surface: resolvedMode === "dark" ? "rgba(22, 22, 30, 0.9)" : colors.surface,
      surfaceLight: resolvedMode === "dark" ? "rgba(32, 32, 42, 0.8)" : colors.surfaceElevated,
      border: resolvedMode === "dark" ? "rgba(255, 255, 255, 0.08)" : colors.border,
      borderLight: resolvedMode === "dark" ? "rgba(255, 255, 255, 0.12)" : colors.borderLight,
      text: colors.text,
      textMuted: colors.textMuted,
      textSubtle: colors.textSecondary,
      accent: colors.primary,
      accentMuted: colors.badgePrimary,
      success: colors.success,
      successMuted: colors.badgeSuccess,
      danger: colors.error,
      dangerMuted: colors.badgeError,
    }),
    [colors, resolvedMode]
  );
};

// ============================================================
// CART ITEM CARD - Premium Subtle Design
// ============================================================
type CartItemCardProps = {
  cartItem: CartItem;
  onUpdateQuantity: (lineKey: string, quantity: number) => void;
  onRemove: (lineKey: string) => void;
  index: number;
};

const CartItemCard = ({ cartItem, onUpdateQuantity, onRemove, index }: CartItemCardProps) => {
  const COLORS = useCartPalette();
  const { isCompact, isXCompact, fs } = useResponsiveLayout();
  const styles = useMemo(() => createStyles(COLORS, fs), [COLORS, fs]);
  const { item, variant, quantity, lineKey } = cartItem;

  const handleIncrement = () => {
    onUpdateQuantity(lineKey, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity <= 1) {
      Alert.alert("Remove Item", `Remove ${item.name} from cart?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => onRemove(lineKey) },
      ]);
    } else {
      onUpdateQuantity(lineKey, quantity - 1);
    }
  };

  const handleRemove = () => {
    Alert.alert("Remove Item", `Remove ${item.name} from cart?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onRemove(lineKey) },
    ]);
  };

  const unitPrice = (variant?.price?.amount ?? item.price?.amount) || 0;
  const currency = variant?.price?.currency || item.price?.currency || "INR";
  const totalPrice = unitPrice * quantity;

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "electronics": return "⚡";
      case "clothing": return "👕";
      case "food": return "🍎";
      case "machinery": return "⚙️";
      case "tools": return "🔧";
      default: return "📦";
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={["rgba(124, 138, 255, 0.04)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.cardContent}>
          {/* Product Icon */}
          <View style={styles.productIconContainer}>
            <LinearGradient
              colors={["rgba(124, 138, 255, 0.12)", "rgba(124, 138, 255, 0.04)"]}
              style={styles.productIconGradient}
            >
              <Text style={styles.productIcon}>{getCategoryIcon(item.category)}</Text>
            </LinearGradient>
          </View>

          {/* Product Details */}
          <View style={styles.productDetails}>
            <View style={styles.productHeader}>
              <Text style={styles.productName} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                {item.name}
              </Text>
              <TouchableOpacity
                onPress={handleRemove}
                style={styles.removeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.removeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.productMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category || "Product"}</Text>
              </View>
              {item.sku && (
                <Text style={styles.skuText}>SKU: {item.sku}</Text>
              )}
            </View>
            {variant ? (
              <Text style={styles.variantText} numberOfLines={2}>
                Variant: {variant.title || "Selected"}
              </Text>
            ) : null}

            {/* Price & Quantity Row */}
            <View style={styles.priceQuantityRow}>
              {/* Quantity Controls */}
              <View style={styles.quantityWrapper}>
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={[styles.qtyBtn, isCompact ? { width: 34, height: 34 } : null]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.qtyDisplay}>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleIncrement}
                  style={[styles.qtyBtn, styles.qtyBtnActive, isCompact ? { width: 34, height: 34 } : null]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.qtyBtnText, styles.qtyBtnTextActive]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Price Display */}
              <View style={[styles.priceDisplay, isXCompact ? { alignItems: "flex-start" } : null]}>
                <Text style={styles.unitPriceText}>
                  {currency} {unitPrice.toFixed(2)} × {quantity}
                </Text>
                <Text style={styles.totalPriceText}>
                  {currency} {totalPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom accent line */}
        <View style={styles.cardAccentLine} />
      </View>
    </View>
  );
};

// ============================================================
// EMPTY CART STATE - Elegant Design
// ============================================================
const EmptyCart = () => {
  const COLORS = useCartPalette();
  const { isCompact, fs } = useResponsiveLayout();
  const styles = useMemo(() => createStyles(COLORS, fs), [COLORS, fs]);
  const navigation = useNavigation();

  return (
    <View style={styles.emptyContainer}>
      {/* Subtle background glow */}
      <View style={styles.emptyGlowContainer}>
        <LinearGradient
          colors={["rgba(124, 138, 255, 0.08)", "transparent"]}
          style={styles.emptyGlow}
        />
      </View>

      <View style={styles.emptyIconWrapper}>
        <LinearGradient
          colors={["rgba(124, 138, 255, 0.12)", "rgba(124, 138, 255, 0.04)"]}
          style={styles.emptyIconBg}
        >
          <Text style={styles.emptyIcon}>🛒</Text>
        </LinearGradient>
        {/* Decorative ring */}
        <View style={styles.emptyIconRing} />
      </View>

      <Text style={styles.emptyTitle}>Your Shortlist is Empty</Text>
      <Text style={[styles.emptySubtitle, isCompact ? { fontSize: fs(14), lineHeight: fs(20) } : null]}>
        Shortlist products and contact sellers through message or call.
      </Text>

      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[COLORS.accent, "#6572e0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.browseGradient}
        >
          <Text style={styles.browseText}>Browse Products</Text>
          <Text style={styles.browseArrow}>→</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// CART SCREEN
// ============================================================
export const CartScreen = () => {
  const COLORS = useCartPalette();
  const { isCompact, isXCompact, contentPadding, fs } = useResponsiveLayout();
  const styles = useMemo(() => createStyles(COLORS, fs), [COLORS, fs]);
  const { items, totalItems, updateQuantity, removeFromCart, clearCart, refreshCartItems } = useCart();
  const { user, requestLogin } = useAuth();
  const { error: toastError } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [sellerPickerVisible, setSellerPickerVisible] = useState(false);
  const [contactMode, setContactMode] = useState<"message" | "call">("message");
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const itemsRef = useRef(items);
  const refreshCartItemsRef = useRef(refreshCartItems);
  itemsRef.current = items;
  refreshCartItemsRef.current = refreshCartItems;

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
    const price = (ci.variant?.price?.amount ?? ci.item.price?.amount) || 0;
    return sum + price * ci.quantity;
  }, 0);

  type SellerContactOption = {
    sellerId: string;
    sellerName: string;
    product: CartItem["item"];
    itemCount: number;
  };

  const sellerOptions = useMemo<SellerContactOption[]>(() => {
    const groups = new Map<string, SellerContactOption>();
    items.forEach((cartItem) => {
      const product = cartItem.item;
      const sellerId = product.createdBy ? String(product.createdBy) : product.company?._id ? String(product.company._id) : null;
      if (!sellerId) return;
      if (!groups.has(sellerId)) {
        groups.set(sellerId, {
          sellerId,
          sellerName: product.company?.displayName || "Seller",
          product,
          itemCount: cartItem.quantity,
        });
        return;
      }
      const existing = groups.get(sellerId);
      if (existing) {
        existing.itemCount += cartItem.quantity;
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.sellerName.localeCompare(b.sellerName));
  }, [items]);

  const messageOptions = useMemo(
    () => sellerOptions.filter((option) => canMessageProduct(option.product)),
    [sellerOptions]
  );
  const callOptions = useMemo(
    () => sellerOptions.filter((option) => canCallProduct(option.product)),
    [sellerOptions]
  );

  const activeOptions = contactMode === "message" ? messageOptions : callOptions;

  const runSellerContact = useCallback(
    async (mode: "message" | "call", option: SellerContactOption) => {
      if (mode === "message") {
        await startProductConversation({
          product: option.product,
          isGuest: user?.role === "guest",
          requestLogin,
          navigation,
          toastError,
        });
        return;
      }
      await callProductSeller({
        product: option.product,
        toastError,
      });
    },
    [navigation, requestLogin, toastError, user?.role]
  );

  const handleOpenSellerPicker = useCallback(
    (mode: "message" | "call") => {
      const options = mode === "message" ? messageOptions : callOptions;
      if (!options.length) return;
      if (options.length === 1) {
        runSellerContact(mode, options[0]);
        return;
      }
      setContactMode(mode);
      setSellerPickerVisible(true);
    },
    [callOptions, messageOptions, runSellerContact]
  );

  const handleCloseSellerPicker = useCallback(() => {
    setSellerPickerVisible(false);
  }, []);

  const handleSelectSeller = useCallback(
    async (option: SellerContactOption) => {
      setSellerPickerVisible(false);
      await runSellerContact(contactMode, option);
    },
    [contactMode, runSellerContact]
  );

  const contactHelperText = useMemo(() => {
    if (!messageOptions.length && !callOptions.length) {
      return "No seller contact options available for shortlisted items.";
    }
    if (!messageOptions.length) {
      return "Messaging is unavailable for current shortlisted sellers.";
    }
    if (!callOptions.length) {
      return "Calling is unavailable for current shortlisted sellers.";
    }
    return "Contact sellers directly to finalize pricing and order terms.";
  }, [callOptions.length, messageOptions.length]);

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

  const keyExtractor = useCallback((item: CartItem) => item.lineKey, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Background gradient orbs */}
      <View style={styles.bgOrbContainer}>
        <LinearGradient
          colors={[COLORS.accent, "transparent"]}
          style={[styles.bgOrb, styles.bgOrb1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[COLORS.success, "transparent"]}
          style={[styles.bgOrb, styles.bgOrb2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: contentPadding }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, isCompact ? { fontSize: fs(20) } : null]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
              My Shortlist
            </Text>
            {refreshing && (
              <ActivityIndicator size="small" color={COLORS.accent} style={{ marginLeft: 8 }} />
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
            <Text style={[styles.clearButtonText, isCompact ? { fontSize: fs(12) } : null]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
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
          extraData={items}
          contentContainerStyle={[styles.listContent, { padding: contentPadding, paddingBottom: isXCompact ? 270 : 280 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Bottom Summary Bar */}
      {items.length > 0 && (
        <View style={styles.summaryWrapper}>
          <LinearGradient
            colors={["rgba(10, 10, 15, 0.95)", "rgba(10, 10, 15, 1)"]}
            style={[
              styles.summaryGradient,
              {
                paddingHorizontal: isCompact ? 16 : 20,
                paddingTop: isCompact ? 16 : 20,
              },
            ]}
          >
            {/* Summary Header */}
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Shortlist Summary</Text>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{totalItems} items</Text>
              </View>
            </View>

            {/* Shortlist details */}
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated value</Text>
                <Text style={styles.summaryAmount}>INR {totalValue.toFixed(2)}</Text>
              </View>
              <Text style={styles.contactHelperText}>{contactHelperText}</Text>
            </View>

            {/* Seller contact actions */}
            <View style={styles.contactActionRow}>
              <TouchableOpacity
                style={[styles.contactActionButton, !messageOptions.length ? styles.contactActionButtonDisabled : null]}
                activeOpacity={0.9}
                disabled={!messageOptions.length}
                onPress={() => handleOpenSellerPicker("message")}
              >
                <LinearGradient
                  colors={messageOptions.length ? [COLORS.accent, "#6572e0"] : [COLORS.surfaceLight, COLORS.surfaceLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.contactActionGradient}
                >
                  <Text style={styles.contactActionText}>Message Seller</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactActionButton, !callOptions.length ? styles.contactActionButtonDisabled : null]}
                activeOpacity={0.9}
                disabled={!callOptions.length}
                onPress={() => handleOpenSellerPicker("call")}
              >
                <LinearGradient
                  colors={callOptions.length ? [COLORS.success, "#4bc08f"] : [COLORS.surfaceLight, COLORS.surfaceLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.contactActionGradient}
                >
                  <Text style={styles.contactActionText}>Call Seller</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      <Modal visible={sellerPickerVisible} transparent animationType="fade" onRequestClose={handleCloseSellerPicker}>
        <Pressable style={styles.pickerBackdrop} onPress={handleCloseSellerPicker}>
          <Pressable style={[styles.pickerSheet, { marginHorizontal: contentPadding }]} onPress={() => {}}>
            <Text style={styles.pickerTitle}>
              {contactMode === "message" ? "Select Seller to Message" : "Select Seller to Call"}
            </Text>
            <Text style={styles.pickerSubtitle}>
              {activeOptions.length} seller{activeOptions.length === 1 ? "" : "s"} available
            </Text>
            <View style={styles.pickerOptionList}>
              {activeOptions.map((option) => (
                <TouchableOpacity
                  key={`${contactMode}-${option.sellerId}`}
                  style={styles.pickerOption}
                  activeOpacity={0.85}
                  onPress={() => handleSelectSeller(option)}
                >
                  <Text style={styles.pickerOptionName}>{option.sellerName}</Text>
                  <Text style={styles.pickerOptionMeta}>
                    {option.itemCount} shortlisted item{option.itemCount === 1 ? "" : "s"}
                  </Text>
                  {contactMode === "call" && option.product.company?.contact?.phone ? (
                    <Text style={styles.pickerOptionMeta}>{option.product.company.contact.phone}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.pickerCloseButton} activeOpacity={0.8} onPress={handleCloseSellerPicker}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================
const createStyles = (COLORS: ReturnType<typeof useCartPalette>, fs: (size: number) => number) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Background orbs
  bgOrbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.08,
  },
  bgOrb1: {
    width: 280,
    height: 280,
    top: -80,
    right: -100,
  },
  bgOrb2: {
    width: 200,
    height: 200,
    bottom: 150,
    left: -80,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backIcon: {
    fontSize: fs(20),
    color: COLORS.text,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fs(22),
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  itemCountBadge: {
    marginTop: 4,
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: fs(12),
    fontWeight: "600",
    color: COLORS.accent,
  },
  clearButton: {
    backgroundColor: COLORS.dangerMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: fs(13),
    fontWeight: "700",
    color: COLORS.danger,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 280,
  },

  // Cart Item Card
  cardWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    gap: 14,
  },
  productIconContainer: {
    borderRadius: 14,
    overflow: "hidden",
  },
  productIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  productIcon: {
    fontSize: fs(26),
  },
  productDetails: {
    flex: 1,
    minWidth: 0,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    minWidth: 0,
  },
  productName: {
    fontSize: fs(16),
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginRight: 8,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.dangerMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  removeIcon: {
    fontSize: fs(16),
    color: COLORS.danger,
    fontWeight: "600",
    marginTop: -1,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: fs(11),
    fontWeight: "600",
    color: COLORS.accent,
    textTransform: "capitalize",
  },
  skuText: {
    fontSize: fs(11),
    fontWeight: "500",
    color: COLORS.textSubtle,
  },
  variantText: {
    marginTop: 6,
    fontSize: fs(11),
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  priceQuantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 14,
    rowGap: 10,
  },
  quantityWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnActive: {
    backgroundColor: COLORS.accent,
  },
  qtyBtnText: {
    fontSize: fs(18),
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  qtyBtnTextActive: {
    color: "#fff",
  },
  qtyDisplay: {
    paddingHorizontal: 16,
  },
  qtyValue: {
    fontSize: fs(15),
    fontWeight: "700",
    color: COLORS.text,
  },
  priceDisplay: {
    alignItems: "flex-end",
    minWidth: 0,
    flexShrink: 1,
  },
  unitPriceText: {
    fontSize: fs(11),
    fontWeight: "500",
    color: COLORS.textSubtle,
  },
  totalPriceText: {
    fontSize: fs(18),
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 2,
  },
  cardAccentLine: {
    height: 2,
    backgroundColor: COLORS.accent,
    opacity: 0.3,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyGlowContainer: {
    position: "absolute",
    top: "20%",
    width: 300,
    height: 300,
  },
  emptyGlow: {
    width: "100%",
    height: "100%",
    borderRadius: 150,
  },
  emptyIconWrapper: {
    marginBottom: 28,
    position: "relative",
  },
  emptyIconBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: fs(48),
  },
  emptyIconRing: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: fs(24),
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: fs(15),
    fontWeight: "500",
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: fs(22),
  },
  browseButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  browseGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  browseText: {
    color: "#fff",
    fontSize: fs(16),
    fontWeight: "700",
  },
  browseArrow: {
    color: "#fff",
    fontSize: fs(18),
    fontWeight: "700",
  },

  // Summary Bar
  summaryWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  summaryGradient: {
    padding: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: fs(18),
    fontWeight: "800",
    color: COLORS.text,
  },
  summaryBadge: {
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  summaryBadgeText: {
    fontSize: fs(12),
    fontWeight: "600",
    color: COLORS.accent,
  },
  summaryDetails: {
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: fs(14),
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  summaryAmount: {
    fontSize: fs(18),
    fontWeight: "800",
    color: COLORS.text,
  },
  contactHelperText: {
    marginTop: 8,
    fontSize: fs(12),
    fontWeight: "500",
    color: COLORS.textSubtle,
    lineHeight: fs(17),
  },
  contactActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  contactActionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  contactActionButtonDisabled: {
    opacity: 0.6,
  },
  contactActionGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  contactActionText: {
    color: "#fff",
    fontSize: fs(14),
    fontWeight: "700",
  },

  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
  },
  pickerSheet: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16,
    maxHeight: "70%",
  },
  pickerTitle: {
    fontSize: fs(17),
    fontWeight: "800",
    color: COLORS.text,
  },
  pickerSubtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: fs(12),
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  pickerOptionList: {
    gap: 10,
  },
  pickerOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
  },
  pickerOptionName: {
    fontSize: fs(14),
    fontWeight: "700",
    color: COLORS.text,
  },
  pickerOptionMeta: {
    marginTop: 3,
    fontSize: fs(12),
    color: COLORS.textMuted,
  },
  pickerCloseButton: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceLight,
  },
  pickerCloseText: {
    fontSize: fs(13),
    fontWeight: "700",
    color: COLORS.text,
  },
  });
