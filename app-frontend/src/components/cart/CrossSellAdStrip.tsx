import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdFeedCard } from "../../services/ad.service";
import { buildCrossSellView, ShimmerImage } from "./crossSell.shared";

const AUTO_HIDE_MS = 6000;

type CrossSellAdStripProps = {
  visible: boolean;
  card: AdFeedCard | null;
  adding?: boolean;
  onAdd: (card: AdFeedCard) => void;
  onView: (card: AdFeedCard) => void;
  /** User actively closed it (logs a dismiss). */
  onDismiss: () => void;
  /** Auto-hid after the timeout (no dismiss event). */
  onTimeout: () => void;
};

// Lightweight, top-anchored "heads-up" used for non-discounted cross-sells — less
// interruptive than the full bottom sheet, auto-dismisses, tap to view.
export const CrossSellAdStrip = ({
  visible,
  card,
  adding,
  onAdd,
  onView,
  onDismiss,
  onTimeout,
}: CrossSellAdStripProps) => {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 360 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onTimeout, AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [visible, onTimeout]);

  if (!card) return null;

  const v = buildCrossSellView(card);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-140, 0] });

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.root]}>
      <Animated.View
        style={[
          styles.strip,
          { top: insets.top + 8, opacity: anim, transform: [{ translateY }] },
        ]}
      >
        <TouchableOpacity activeOpacity={0.92} onPress={() => onView(card)} style={styles.tappable}>
          <ShimmerImage uri={v.productImage} style={styles.image} borderRadius={12} />

          <View style={styles.info}>
            <View style={styles.topLine}>
              <View style={styles.sponsoredTag}>
                <Text style={styles.sponsoredText}>SPONSORED</Text>
              </View>
              {v.urgency ? (
                <Text style={styles.urgencyText} numberOfLines={1}>
                  · {v.urgency.text}
                </Text>
              ) : (
                <Text style={styles.youMightLike} numberOfLines={1}>
                  You might also like
                </Text>
              )}
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {v.productName}
            </Text>
            {v.priceText ? (
              <Text style={styles.price} numberOfLines={1}>
                {v.priceText}
                {v.unit ? <Text style={styles.priceUnit}>/{v.unit}</Text> : null}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={adding}
          onPress={() => onAdd(card)}
          style={styles.addBtn}
        >
          {adding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add" size={20} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onDismiss} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color="#9AA0AE" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { alignItems: "center" },
  strip: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 16,
  },
  tappable: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  image: { width: 48, height: 48 },
  info: { flex: 1, gap: 1 },
  topLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  sponsoredTag: {
    backgroundColor: "#EEF0FB",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sponsoredText: { color: "#2E3192", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  youMightLike: { flex: 1, color: "#9AA0AE", fontSize: 11, fontWeight: "600" },
  urgencyText: { flex: 1, color: "#D9480F", fontSize: 11, fontWeight: "700" },
  title: { color: "#11131C", fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  price: { color: "#3A3F4B", fontSize: 13, fontWeight: "700" },
  priceUnit: { color: "#9AA0AE", fontSize: 10, fontWeight: "600" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2E3192",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F7",
  },
});
