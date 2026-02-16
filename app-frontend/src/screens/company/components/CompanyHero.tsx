import { useMemo } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { AdaptiveSingleLineText } from "../../../components/text/AdaptiveSingleLineText";
import { AdaptiveTwoLineText } from "../../../components/text/AdaptiveTwoLineText";
import { Company } from "../../../types/company";
import { useCompanyProfileLayout } from "./companyProfile.layout";

type Props = {
  company: Company;
  complianceStatus: string;
  onUploadLogo?: () => void;
  uploading?: boolean;
};

export const CompanyHero = ({ company, complianceStatus, onUploadLogo, uploading }: Props) => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const layout = useCompanyProfileLayout();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark, layout), [colors, isDark, layout]);
  const isVerified = complianceStatus === "approved";
  const logoUrl = company.logoUrl;
  const initials = company.displayName
    ?.split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "CO";

  const showLegalName = company.legalName && company.legalName !== company.displayName;

  return (
    <View style={styles.container}>
      <View style={styles.avatarSection}>
        <View style={[styles.avatarGlow, isVerified && styles.avatarGlowVerified]} />

        <TouchableOpacity
          onPress={onUploadLogo}
          activeOpacity={0.85}
          disabled={uploading || !onUploadLogo}
          style={styles.avatarWrapper}
        >
          <LinearGradient
            colors={
              isVerified
                ? [colors.success, "#34D399", "#059669", colors.success]
                : [colors.primary, colors.primaryDark, colors.accent, colors.primary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarInner}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={[colors.backgroundSecondary, colors.background]}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>

          {onUploadLogo ? (
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cameraButton}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="camera" size={layout.xCompact ? 12 : 14} color={colors.textOnPrimary} />
              )}
            </LinearGradient>
          ) : null}

          {isVerified ? (
            <LinearGradient colors={[colors.success, "#059669"]} style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={layout.xCompact ? 11 : 12} color={colors.textOnPrimary} />
            </LinearGradient>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.nameSection}>
        <View style={styles.nameRow}>
          <AdaptiveTwoLineText
            minimumFontScale={0.7}
            containerStyle={styles.companyNameWrap}
            style={styles.companyName}
          >
            {company.displayName || "Company"}
          </AdaptiveTwoLineText>
          {isVerified ? (
            <View style={styles.verifiedInline}>
              <Ionicons name="checkmark-circle" size={layout.xCompact ? 20 : 22} color={colors.success} />
            </View>
          ) : null}
        </View>

        {showLegalName ? (
          <AdaptiveSingleLineText
            minimumFontScale={0.74}
            allowOverflowScroll={false}
            style={styles.legalName}
          >
            {company.legalName}
          </AdaptiveSingleLineText>
        ) : null}
      </View>

      {company.description ? (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={layout.xCompact ? 2 : 3} ellipsizeMode="clip">
            {company.description}
          </Text>
        </View>
      ) : null}

      <LinearGradient
        colors={[colors.badgeSecondary, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.statsRow}
      >
        <View style={styles.statItem}>
          <View style={[styles.statusDot, isVerified ? styles.statusDotVerified : styles.statusDotPending]} />
          <AdaptiveSingleLineText
            allowOverflowScroll={false}
            minimumFontScale={0.72}
            style={styles.statValue}
          >
            {complianceStatus}
          </AdaptiveSingleLineText>
          <Text style={styles.statLabel}>Status</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <AdaptiveSingleLineText
            allowOverflowScroll={false}
            minimumFontScale={0.72}
            style={styles.statValue}
          >
            {company.type || "Normal"}
          </AdaptiveSingleLineText>
          <Text style={styles.statLabel}>Type</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <AdaptiveSingleLineText
            allowOverflowScroll={false}
            minimumFontScale={0.72}
            style={styles.statValue}
          >
            {company.categories?.length || 0}
          </AdaptiveSingleLineText>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </LinearGradient>

      {isVerified ? (
        <View style={styles.verifiedBanner}>
          <LinearGradient
            colors={[colors.badgeSuccess, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifiedBannerGradient}
          >
            <LinearGradient colors={[colors.badgeSuccess, colors.badgeSuccess]} style={styles.verifiedBannerIcon}>
              <Ionicons name="shield-checkmark" size={layout.xCompact ? 16 : 18} color={colors.success} />
            </LinearGradient>
            <View style={styles.verifiedBannerText}>
              <Text style={styles.verifiedLabel}>VERIFIED BUSINESS</Text>
              <AdaptiveSingleLineText
                allowOverflowScroll={false}
                minimumFontScale={0.72}
                style={styles.verifiedCompanyName}
              >
                Trusted & Compliant
              </AdaptiveSingleLineText>
            </View>
          </LinearGradient>
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  isDark: boolean,
  layout: ReturnType<typeof useCompanyProfileLayout>
) => {
  const glowSize = layout.xCompact ? 116 : layout.compact ? 128 : 140;
  const avatarSize = layout.xCompact ? 96 : layout.compact ? 108 : 118;
  const ringPadding = layout.xCompact ? 3 : 4;
  const cameraSize = layout.xCompact ? 30 : 34;
  const verifiedSize = layout.xCompact ? 22 : 26;

  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: layout.compact ? 10 : 12,
      gap: layout.compact ? 10 : 12,
    },
    avatarSection: {
      marginBottom: layout.compact ? 12 : 16,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarGlow: {
      position: "absolute",
      width: glowSize,
      height: glowSize,
      borderRadius: glowSize / 2,
      backgroundColor: colors.badgePrimary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.45 : 0.35,
      shadowRadius: layout.compact ? 22 : 30,
    },
    avatarGlowVerified: {
      backgroundColor: colors.badgeSuccess,
      shadowColor: colors.success,
    },
    avatarWrapper: {
      position: "relative",
    },
    avatarGradient: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      padding: ringPadding,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: layout.compact ? 8 : 12 },
      shadowOpacity: isDark ? 0.45 : 0.35,
      shadowRadius: layout.compact ? 16 : 24,
      elevation: layout.compact ? 10 : 16,
    },
    avatarInner: {
      flex: 1,
      borderRadius: avatarSize / 2,
      overflow: "hidden",
      backgroundColor: colors.background,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    avatarPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: {
      fontSize: layout.xCompact ? 26 : layout.compact ? 30 : 34,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: layout.compact ? 1.2 : 2,
    },
    cameraButton: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: cameraSize,
      height: cameraSize,
      borderRadius: cameraSize / 2,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.background,
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    verifiedBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      width: verifiedSize,
      height: verifiedSize,
      borderRadius: verifiedSize / 2,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.background,
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
    nameSection: {
      alignItems: "center",
      width: "100%",
      marginBottom: layout.compact ? 4 : 6,
      paddingHorizontal: layout.compact ? 8 : 12,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      minWidth: 0,
      justifyContent: "center",
    },
    companyNameWrap: {
      maxWidth: "88%",
      minWidth: 0,
      flexShrink: 1,
    },
    companyName: {
      fontSize: layout.xCompact ? 20 : layout.compact ? 23 : 26,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: layout.compact ? -0.4 : -0.8,
      textAlign: "center",
      lineHeight: layout.xCompact ? 24 : layout.compact ? 28 : 31,
    },
    verifiedInline: {
      marginLeft: layout.compact ? 8 : 10,
      alignSelf: "center",
    },
    legalName: {
      fontSize: layout.compact ? 12 : 14,
      color: colors.textMuted,
      marginTop: 6,
      fontWeight: "600",
      letterSpacing: 0.1,
      textAlign: "center",
    },
    descriptionContainer: {
      width: "100%",
      paddingHorizontal: layout.compact ? 8 : 12,
    },
    description: {
      fontSize: layout.compact ? 13 : 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: layout.compact ? 19 : 21,
      fontWeight: "500",
      letterSpacing: 0.1,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      borderRadius: layout.compact ? 14 : 18,
      paddingVertical: layout.compact ? 12 : 16,
      paddingHorizontal: layout.compact ? 8 : 12,
      marginTop: layout.compact ? 6 : 10,
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: layout.xCompact ? 3 : 6,
      gap: layout.xCompact ? 2 : 3,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginBottom: layout.xCompact ? 2 : 4,
    },
    statusDotVerified: {
      backgroundColor: colors.success,
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 6,
    },
    statusDotPending: {
      backgroundColor: colors.warning,
      shadowColor: colors.warning,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 6,
    },
    statValue: {
      fontSize: layout.xCompact ? 12 : 14,
      fontWeight: "800",
      color: colors.text,
      textTransform: "capitalize",
      textAlign: "center",
    },
    statLabel: {
      fontSize: layout.xCompact ? 9 : 10,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: "700",
      textAlign: "center",
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginVertical: 3,
    },
    verifiedBanner: {
      width: "100%",
      marginTop: layout.compact ? 8 : 12,
      borderRadius: layout.compact ? 14 : 16,
      overflow: "hidden",
    },
    verifiedBannerGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: layout.compact ? 10 : 14,
      paddingHorizontal: layout.compact ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.success + "44",
      borderRadius: layout.compact ? 14 : 16,
    },
    verifiedBannerIcon: {
      width: layout.compact ? 34 : 40,
      height: layout.compact ? 34 : 40,
      borderRadius: layout.compact ? 10 : 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: layout.compact ? 10 : 14,
    },
    verifiedBannerText: {
      flex: 1,
      minWidth: 0,
    },
    verifiedLabel: {
      fontSize: layout.xCompact ? 9 : 10,
      fontWeight: "800",
      color: colors.success,
      letterSpacing: 1.1,
    },
    verifiedCompanyName: {
      fontSize: layout.compact ? 13 : 15,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
    },
  });
};
