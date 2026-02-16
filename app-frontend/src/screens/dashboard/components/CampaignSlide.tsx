import { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { PersonalizedOffer } from "../../../services/preference.service";
import { CampaignContactBar } from "./CampaignContactBar";

type CampaignSlideProps = {
  campaign: PersonalizedOffer;
  onPrimaryPress?: () => void;
  onMessagePress?: () => void;
  onCallPress?: () => void;
  messageDisabled?: boolean;
  callDisabled?: boolean;
  compact?: boolean;
};

const GRADIENTS: Record<string, [string, string]> = {
  default: ["#2B7FFF", "#6366F1"],
  warm: ["#F97316", "#EF4444"],
  premium: ["#0EA5E9", "#2563EB"],
  emerald: ["#059669", "#16A34A"],
};

const resolveGradient = (themeKey?: string): [string, string] => {
  if (!themeKey) return GRADIENTS.default;
  return GRADIENTS[themeKey] || GRADIENTS.default;
};

const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined || price === null || Number.isNaN(Number(price))) return undefined;
  const prefix = currency || "INR";
  return `${prefix} ${Number(price).toLocaleString("en-IN")}`;
};

export const CampaignSlide = memo(
  ({
    campaign,
    onPrimaryPress,
    onMessagePress,
    onCallPress,
    messageDisabled,
    callDisabled,
    compact,
  }: CampaignSlideProps) => {
    const { colors, spacing, radius } = useTheme();
    const headline = campaign.creative?.headline || campaign.title;
    const subheadline =
      campaign.creative?.subheadline ||
      campaign.message ||
      "Curated by admin for your recent activity.";
    const badge = campaign.creative?.badge || (campaign.contentType === "service" ? "Service Campaign" : "Product Campaign");
    const ctaLabel =
      campaign.creative?.ctaLabel ||
      (campaign.contentType === "service" ? "Open service request" : "View offer");
    const gradient = resolveGradient(campaign.creative?.themeKey);
    const newPriceLabel = formatPrice(campaign.newPrice, campaign.currency);
    const oldPriceLabel = formatPrice(campaign.oldPrice, campaign.currency);

    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderRadius: radius.lg,
            padding: compact ? spacing.md : spacing.lg,
            minHeight: compact ? 248 : 280,
          },
        ]}
      >
        <View style={styles.overlayGlow} />
        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
          <View style={styles.priorityPill}>
            <Text style={styles.priorityText}>{(campaign.priority || "normal").toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {headline}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subheadline}
        </Text>

        {campaign.contentType === "product" && newPriceLabel ? (
          <View style={[styles.priceRow, { marginTop: spacing.sm }]}>
            {oldPriceLabel ? <Text style={styles.oldPrice}>{oldPriceLabel}</Text> : null}
            <Text style={styles.newPrice}>{newPriceLabel}</Text>
          </View>
        ) : (
          <View style={[styles.serviceMeta, { marginTop: spacing.sm }]}>
            <Ionicons name="construct-outline" size={14} color="#FFFFFF" />
            <Text style={styles.serviceMetaText}>{campaign.serviceType || "service"}</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.86}
          onPress={onPrimaryPress}
          style={[
            styles.primaryButton,
            {
              marginTop: spacing.md,
              borderRadius: radius.md,
              minHeight: compact ? 42 : 46,
            },
          ]}
        >
          <Text style={styles.primaryButtonText}>{ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color="#111827" />
        </TouchableOpacity>

        <CampaignContactBar
          onMessage={onMessagePress}
          onCall={onCallPress}
          messageDisabled={messageDisabled}
          callDisabled={callDisabled}
          compact={compact}
        />
      </LinearGradient>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  overlayGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.18)",
    top: -70,
    right: -50,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.28)",
  },
  priorityText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  oldPrice: {
    color: "rgba(255,255,255,0.72)",
    textDecorationLine: "line-through",
    fontSize: 14,
    fontWeight: "600",
  },
  newPrice: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serviceMetaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  primaryButton: {
    backgroundColor: "#FDE047",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
});
