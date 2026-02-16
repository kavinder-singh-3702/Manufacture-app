import { useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { RootStackParamList } from "../../navigation/types";

/**
 * FloatingCartBar - Blinkit-style floating cart bar
 * Shows above the footer when items are in cart
 * Hides when user is already on the cart screen
 * Displays product thumbnail, "View cart" text with item count, and arrow button
 */
export const FloatingCartBar = () => {
  const { items, totalItems } = useCart();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, radius } = useTheme();
  const { isCompact } = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  // Check if we're currently on the cart screen
  const navigationState = useNavigationState((state) => state);
  const isOnCartScreen = useCallback(() => {
    try {
      // Check if current route is Cart (stack screen)
      const currentRoute = navigationState?.routes?.[navigationState?.index];
      return currentRoute?.name === "Cart";
    } catch {
      return false;
    }
  }, [navigationState]);

  const slideAnim = useRef(new Animated.Value(100)).current;
  const hasItems = items.length > 0;
  const shouldShow = hasItems && !isOnCartScreen();

  // Animate in/out based on cart items and current screen
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: shouldShow ? 0 : 100,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [shouldShow, slideAnim]);

  const handleGoToCart = useCallback(() => {
    // Navigate to Cart screen (standalone stack screen)
    navigation.navigate("Cart");
  }, [navigation]);

  // Don't render if no items or on cart screen
  if (!hasItems) {
    return null;
  }

  // Hide completely when on cart screen (after animation)
  if (isOnCartScreen()) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: (isCompact ? 78 : 88) + insets.bottom,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleGoToCart}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              borderRadius: radius.pill,
              paddingVertical: isCompact ? 10 : 12,
              paddingHorizontal: isCompact ? 16 : 20,
            },
          ]}
        >
          <Text style={[styles.cartText, { color: colors.textOnPrimary, fontSize: isCompact ? 13 : 15 }]}>View Cart</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{totalItems}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  touchable: {
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    gap: 10,
  },
  cartText: {
    fontSize: 15,
    fontWeight: "700",
  },
  countBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
  },
  countText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "800",
  },
});
