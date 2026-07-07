import { useEffect, useRef } from "react";
import {
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
import { AdFeedCard } from "../../services/ad.service";
import { buildCrossSellView, ShimmerImage } from "../cart/crossSell.shared";

type LoginAdPopupModalProps = {
  visible: boolean;
  card: AdFeedCard | null;
  onView: (card: AdFeedCard) => void;
  onDismiss: () => void;
};

/**
 * Centered promotional popup for the top-priority ad — the classic "commerce app"
 * interstitial. Shows the admin banner (or the product image) plus name, price and
 * a single "View product" CTA. Reuses the cross-sell view model so pricing/discount
 * formatting stays consistent across every ad surface.
 */
export const LoginAdPopupModal = ({ visible, card, onView, onDismiss }: LoginAdPopupModalProps) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 180,
      easing: visible ? Easing.out(Easing.back(1.2)) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  if (!card) return null;

  const v = buildCrossSellView(card);
  // Prefer the admin banner artwork; fall back to the product image.
  const heroImage = card.bannerPosterUrl || card.bannerImageUrl || v.productImage;
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
          <Pressable style={styles.backdrop} onPress={onDismiss} />
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: anim, transform: [{ scale }] }]}>
          <View style={styles.imageWrap}>
            <ShimmerImage uri={heroImage} style={styles.image} />
            <View style={styles.sponsoredTag}>
              <Ionicons name="megaphone" size={10} color="#2E3192" />
              <Text style={styles.sponsoredText}>Sponsored</Text>
            </View>
            {v.discountBadge ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{v.discountBadge}</Text>
              </View>
            ) : null}
            <TouchableOpacity onPress={onDismiss} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
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

            <TouchableOpacity activeOpacity={0.9} onPress={() => onView(card)} style={styles.ctaWrap}>
              <LinearGradient
                colors={["#2E3192", "#1B1464"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>{v.ctaLabel}</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onDismiss} style={styles.secondaryBtn} activeOpacity={0.7}>
              <Text style={styles.secondaryTextLink}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  backdrop: { flex: 1, backgroundColor: "rgba(10,12,24,0.6)" },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 24,
  },
  imageWrap: { position: "relative", width: "100%", height: 200 },
  image: { width: "100%", height: 200 },
  sponsoredTag: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sponsoredText: { color: "#2E3192", fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  discountBadge: {
    position: "absolute",
    top: 12,
    right: 52,
    backgroundColor: "#16A34A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  discountBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  body: { padding: 20, gap: 4 },
  title: { color: "#11131C", fontSize: 19, fontWeight: "900", letterSpacing: -0.2 },
  company: { color: "#8A8F9C", fontSize: 12, fontWeight: "600" },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  price: { color: "#11131C", fontSize: 22, fontWeight: "900" },
  priceUnit: { color: "#8A8F9C", fontSize: 12, fontWeight: "600", marginLeft: 2 },
  priceOriginal: {
    color: "#B4B8C2",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  ctaWrap: { borderRadius: 16, overflow: "hidden", marginTop: 16 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    minHeight: 52,
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
  secondaryBtn: { alignItems: "center", paddingVertical: 12, marginTop: 2 },
  secondaryTextLink: { color: "#9AA0AE", fontSize: 13, fontWeight: "700" },
});
