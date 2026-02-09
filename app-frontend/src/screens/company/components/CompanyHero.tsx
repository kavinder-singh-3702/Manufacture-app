import { useMemo } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { Company } from "../../../types/company";

type Props = {
  company: Company;
  complianceStatus: string;
  onUploadLogo?: () => void;
  uploading?: boolean;
};

export const CompanyHero = ({ company, complianceStatus, onUploadLogo, uploading }: Props) => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const isVerified = complianceStatus === "approved";
  const logoUrl = company.logoUrl;
  const initials = company.displayName
    ?.split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "CO";

  return (
    <View style={styles.container}>
      {/* Premium Avatar Section with Glow */}
      <View style={styles.avatarSection}>
        {/* Outer glow effect */}
        <View style={[styles.avatarGlow, isVerified && styles.avatarGlowVerified]} />

        <TouchableOpacity
          onPress={onUploadLogo}
          activeOpacity={0.85}
          disabled={uploading || !onUploadLogo}
          style={styles.avatarWrapper}
        >
          {/* Animated gradient ring */}
          <LinearGradient
            colors={isVerified
              ? [colors.success, "#34D399", "#059669", colors.success]
              : [colors.primary, colors.primaryDark, colors.accent, colors.primary]}
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

          {/* Camera Icon with gradient */}
          {onUploadLogo && (
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cameraButton}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="camera" size={14} color={colors.textOnPrimary} />
              )}
            </LinearGradient>
          )}

          {/* Verified Badge with glow */}
          {isVerified && (
            <LinearGradient
              colors={[colors.success, "#059669"]}
              style={styles.verifiedBadge}
            >
              <Ionicons name="checkmark" size={12} color={colors.textOnPrimary} />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* Company Name with premium typography */}
      <View style={styles.nameSection}>
        <View style={styles.nameRow}>
          <Text style={styles.companyName} numberOfLines={2}>{company.displayName}</Text>
          {isVerified && (
            <View style={styles.verifiedInline}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </View>
          )}
        </View>
        {company.legalName && company.legalName !== company.displayName && (
          <Text style={styles.legalName}>{company.legalName}</Text>
        )}
      </View>

      {/* Description with elegant styling */}
      {company.description ? (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={3}>{company.description}</Text>
        </View>
      ) : null}

      {/* Stats Row with glassmorphism */}
      <LinearGradient
        colors={[colors.badgeSecondary, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.statsRow}
      >
        <View style={styles.statItem}>
          <View style={[styles.statusDot, isVerified ? styles.statusDotVerified : styles.statusDotPending]} />
          <Text style={styles.statValue}>{complianceStatus}</Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{company.type || "Normal"}</Text>
          <Text style={styles.statLabel}>Type</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{company.categories?.length || 0}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </LinearGradient>

      {/* Verified Banner with premium styling */}
      {isVerified && (
        <View style={styles.verifiedBanner}>
            <LinearGradient
              colors={[colors.badgeSuccess, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifiedBannerGradient}
            >
              <LinearGradient
                colors={[colors.badgeSuccess, colors.badgeSuccess]}
                style={styles.verifiedBannerIcon}
              >
                <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              </LinearGradient>
            <View style={styles.verifiedBannerText}>
              <Text style={styles.verifiedLabel}>VERIFIED BUSINESS</Text>
              <Text style={styles.verifiedCompanyName} numberOfLines={1}>Trusted & Compliant</Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 12,
  },
  avatarSection: {
    marginBottom: 20,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.badgePrimary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  avatarGlowVerified: {
    backgroundColor: colors.badgeSuccess,
    shadowColor: colors.success,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarGradient: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 55,
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
    fontSize: 34,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 2,
  },
  cameraButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.background,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  nameSection: {
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  companyName: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  verifiedInline: {
    marginLeft: 10,
  },
  legalName: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginTop: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
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
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  verifiedBanner: {
    width: "100%",
    marginTop: 18,
    borderRadius: 16,
    overflow: "hidden",
  },
  verifiedBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.success + "44",
    borderRadius: 16,
  },
  verifiedBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  verifiedBannerText: {
    flex: 1,
  },
  verifiedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 1.2,
  },
  verifiedCompanyName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginTop: 3,
  },
  });
