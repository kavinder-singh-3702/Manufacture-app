import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdFeedCard } from "../../services/ad.service";
import { buildCrossSellView, ShimmerImage } from "./crossSell.shared";

type CrossSellAdModalProps = {
  visible: boolean;
  card: AdFeedCard | null;
  adding?: boolean;
  onAdd: (card: AdFeedCard) => void;
  onView: (card: AdFeedCard) => void;
  onDismiss: () => void;
};

export const CrossSellAdModal = ({ visible, card, adding, onAdd, onView, onDismiss }: CrossSellAdModalProps) => {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? 340 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!card) return null;

  const v = buildCrossSellView(card);
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [440, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: slide }]}>
          <Pressable style={styles.backdrop} onPress={onDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 4, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.grabber} />

          <View style={styles.headerRow}>
            <View style={styles.sponsoredTag}>
              <Ionicons name="megaphone" size={10} color="#2E3192" />
              <Text style={styles.sponsoredText}>Sponsored</Text>
            </View>
            {v.categoryLabel ? <Text style={styles.featuredIn}>in {v.categoryLabel}</Text> : null}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onDismiss} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#9AA0AE" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.imageWrap}>
              <ShimmerImage uri={v.productImage} style={styles.image} borderRadius={16} />
              {v.discountBadge ? (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{v.discountBadge}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                {v.productName}
              </Text>
              {v.companyName ? (
                <Text style={styles.company} numberOfLines={1}>
                  by {v.companyName}
                </Text>
              ) : null}

              {v.priceText ? (
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{v.priceText}</Text>
                  {v.unit ? <Text style={styles.priceUnit}>/{v.unit}</Text> : null}
                  {v.originalPriceText ? <Text style={styles.priceOriginal}>{v.originalPriceText}</Text> : null}
                </View>
              ) : null}

              {v.urgency ? (
                <View style={styles.urgencyPill}>
                  <Ionicons name={v.urgency.icon} size={11} color="#D9480F" />
                  <Text style={styles.urgencyText}>{v.urgency.text}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.reasonRow}>
            <Ionicons name="sparkles" size={14} color="#2E3192" />
            <Text style={styles.reasonText} numberOfLines={2}>
              {v.reason}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={adding}
              onPress={() => onAdd(card)}
              style={styles.ctaWrap}
            >
              <LinearGradient
                colors={["#2E3192", "#1B1464"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cart" size={16} color="#fff" />
                    <Text style={styles.ctaText}>Add to cart</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={() => onView(card)} style={styles.viewBtn}>
              <Text style={styles.viewText}>View</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onDismiss} style={styles.secondaryBtn} activeOpacity={0.7}>
            <Text style={styles.secondaryTextLink}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(10,12,24,0.55)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E5EC",
    marginBottom: 14,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
  sponsoredTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF0FB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sponsoredText: { color: "#2E3192", fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  featuredIn: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F7",
  },
  card: { flexDirection: "row", alignItems: "center", gap: 14 },
  imageWrap: { width: 88, height: 88 },
  image: { width: 88, height: 88 },
  discountBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    backgroundColor: "#16A34A",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  discountBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },
  info: { flex: 1, gap: 3 },
  title: { color: "#11131C", fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  company: { color: "#8A8F9C", fontSize: 12, fontWeight: "600" },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  price: { color: "#11131C", fontSize: 19, fontWeight: "900" },
  priceUnit: { color: "#8A8F9C", fontSize: 11, fontWeight: "600", marginLeft: 2 },
  priceOriginal: {
    color: "#B4B8C2",
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  urgencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#FFF1E8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    marginTop: 6,
  },
  urgencyText: { color: "#D9480F", fontSize: 11, fontWeight: "800" },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F5F6FB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  reasonText: { flex: 1, color: "#3A3F4B", fontSize: 13, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "stretch", gap: 10, marginTop: 16 },
  ctaWrap: { flex: 1, borderRadius: 16, overflow: "hidden" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    minHeight: 50,
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
  viewBtn: {
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E5EC",
    alignItems: "center",
    justifyContent: "center",
  },
  viewText: { color: "#2E3192", fontSize: 14, fontWeight: "800" },
  secondaryBtn: { alignItems: "center", paddingVertical: 12, marginTop: 2 },
  secondaryTextLink: { color: "#9AA0AE", fontSize: 13, fontWeight: "700" },
});
