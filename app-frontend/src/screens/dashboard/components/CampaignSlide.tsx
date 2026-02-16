import { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { PersonalizedOffer } from "../../../services/preference.service";
import { CampaignContactBar } from "./CampaignContactBar";
import { resolveCampaignGradient } from "./campaignTheme";

type CampaignSlideProps = {
  campaign: PersonalizedOffer;
  onPrimaryPress?: () => void;
  onMessagePress?: () => void;
  onCallPress?: () => void;
  messageDisabled?: boolean;
  callDisabled?: boolean;
  compact?: boolean;
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
    const { colors, spacing, radius, nativeGradients } = useTheme();
    const headline = campaign.creative?.headline || campaign.title;
    const subheadline =
      campaign.creative?.subheadline ||
      campaign.message ||
      "Curated by admin for your recent activity.";
    const badge = campaign.creative?.badge || (campaign.contentType === "service" ? "Service Campaign" : "Product Campaign");
    const ctaLabel =
      campaign.creative?.ctaLabel ||
      (campaign.contentType === "service" ? "Open service request" : "View offer");
    const gradient = resolveCampaignGradient(nativeGradients, campaign.creative?.themeKey);
    const newPriceLabel = formatPrice(campaign.newPrice, campaign.currency);
    const oldPriceLabel = formatPrice(campaign.oldPrice, campaign.currency);

    const overlayColor = `${colors.textOnDarkSurface}26`;
    const softButtonBg = `${colors.textOnDarkSurface}38`;
    const strongButtonBg = `${colors.accentEmberSoft}EE`;

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
            borderColor: `${colors.textOnDarkSurface}22`,
          },
        ]}
      >
        <View style={[styles.overlayGlow, { backgroundColor: overlayColor }]} />

        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: softButtonBg }]}> 
            <Text style={[styles.badgeText, { color: colors.textOnDarkSurface }]}>{badge}</Text>
          </View>
          <View style={[styles.priorityPill, { backgroundColor: `${colors.background}66` }]}>
            <Text style={[styles.priorityText, { color: colors.textOnDarkSurface }]}>
              {(campaign.priority || "normal").toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.textOnDarkSurface }]} numberOfLines={2}>
          {headline}
        </Text>
        <Text style={[styles.subtitle, { color: `${colors.textOnDarkSurface}E8` }]} numberOfLines={2}>
          {subheadline}
        </Text>

        {campaign.contentType === "product" && newPriceLabel ? (
          <View style={[styles.priceRow, { marginTop: spacing.sm }]}> 
            {oldPriceLabel ? <Text style={[styles.oldPrice, { color: `${colors.textOnDarkSurface}BE` }]}>{oldPriceLabel}</Text> : null}
            <Text style={[styles.newPrice, { color: colors.textOnDarkSurface }]}>{newPriceLabel}</Text>
          </View>
        ) : (
          <View style={[styles.serviceMeta, { marginTop: spacing.sm }]}> 
            <Ionicons name="construct-outline" size={14} color={colors.textOnDarkSurface} />
            <Text style={[styles.serviceMetaText, { color: colors.textOnDarkSurface }]}> 
              {campaign.serviceType || "service"}
            </Text>
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
              minHeight: compact ? 44 : 46,
              backgroundColor: strongButtonBg,
              borderColor: `${colors.background}22`,
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.textOnAccent }]}>{ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textOnAccent} />
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
    borderWidth: 1,
  },
  overlayGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -70,
    right: -50,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    flexWrap: "wrap",
  },
  oldPrice: {
    textDecorationLine: "line-through",
    fontSize: 14,
    fontWeight: "600",
  },
  newPrice: {
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
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
