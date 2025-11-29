import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../hooks/useTheme";
import { StatusPill } from "./ProfileForm";

type VerificationStatus = "pending" | "submitted" | "approved" | "rejected" | null;

type Props = {
  fullName: string;
  email?: string | null;
  avatarUrl?: string;
  avatarInitials: string;
  role?: string | null;
  accountType?: string | null;
  uploading?: boolean;
  onUploadAvatar: () => void;
  verificationStatus?: VerificationStatus;
  companyName?: string | null;
};

export const ProfileHero = ({
  fullName,
  email,
  avatarUrl,
  avatarInitials,
  role,
  accountType,
  uploading,
  onUploadAvatar,
  verificationStatus,
  companyName,
}: Props) => {
  const { colors, spacing } = useTheme();

  const isVerified = verificationStatus === "approved";

  return (
    <View style={styles.headerMeta}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onUploadAvatar}
          activeOpacity={0.9}
          disabled={uploading}
        >
          <LinearGradient
            colors={isVerified ? ["#10B981", "#059669"] : [colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          >
            <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarInitials, { color: colors.text }]}>{avatarInitials}</Text>
              )}
              {uploading ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </View>
          </LinearGradient>
          {/* Verified Badge on Avatar */}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeIcon}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={[styles.title, { color: colors.text }]}>{fullName}</Text>
            {isVerified && (
              <View style={styles.verifiedInlineBadge}>
                <Text style={styles.verifiedInlineIcon}>✓</Text>
              </View>
            )}
          </View>
          <Text style={{ color: colors.muted }}>{email}</Text>

          {/* Verified Company Banner */}
          {isVerified && companyName && (
            <View style={styles.verifiedBanner}>
              <View style={styles.verifiedBannerIcon}>
                <Text style={styles.verifiedBannerIconText}>✓</Text>
              </View>
              <View style={styles.verifiedBannerText}>
                <Text style={styles.verifiedLabel}>VERIFIED</Text>
                <Text style={styles.verifiedCompanyName} numberOfLines={1}>{companyName}</Text>
              </View>
            </View>
          )}

          <View style={styles.pillRow}>
            {role ? <StatusPill label={role.toUpperCase()} style={styles.pillSpacing} /> : null}
            {accountType ? <StatusPill label={accountType} style={styles.pillSpacing} /> : null}
            {isVerified && <StatusPill label="VERIFIED" tone="success" style={styles.pillSpacing} />}
          </View>
          <TouchableOpacity onPress={onUploadAvatar} disabled={uploading} style={styles.avatarAction}>
            <Text style={[styles.avatarActionText, { color: colors.text }]}>
              {uploading ? "Uploading photo..." : "Update profile photo"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerMeta: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  pillSpacing: {
    marginRight: 8,
    marginBottom: 8,
  },
  gradientRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(163,136,238,0.5)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: "700",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarAction: {
    marginTop: 8,
  },
  avatarActionText: {
    fontWeight: "700",
  },
  // Verified badge on avatar
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0F1115",
  },
  verifiedBadgeIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  // Verified inline badge next to name
  verifiedInlineBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  verifiedInlineIcon: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  // Verified company banner
  verifiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  verifiedBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  verifiedBannerIconText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  verifiedBannerText: {
    flex: 1,
  },
  verifiedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
    letterSpacing: 1,
  },
  verifiedCompanyName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4ADE80",
    marginTop: 1,
  },
});
