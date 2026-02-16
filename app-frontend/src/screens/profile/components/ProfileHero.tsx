import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

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
  companiesCount?: number;
  bio?: string | null;
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
  companiesCount = 0,
  bio,
}: Props) => {
  const { colors } = useTheme();
  const isVerified = verificationStatus === "approved";

  return (
    <View style={styles.container}>
      <View style={styles.avatarSection}>
        <View
          style={[
            styles.avatarGlow,
            {
              backgroundColor: (isVerified ? colors.success : colors.primary) + "33",
              shadowColor: isVerified ? colors.success : colors.primary,
            },
          ]}
        />

        <TouchableOpacity onPress={onUploadAvatar} activeOpacity={0.85} disabled={uploading} style={styles.avatarWrapper}>
          <LinearGradient
            colors={
              isVerified
                ? [colors.success, colors.successLight, colors.success, colors.successLight]
                : [colors.primary, colors.primaryDark, colors.accent, colors.primary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.avatarGradient, { shadowColor: colors.primary }]}
          >
            <View style={[styles.avatarInner, { backgroundColor: colors.background }]}> 
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={[colors.surfaceElevated, colors.surface]} style={styles.avatarPlaceholder}>
                  <Text style={[styles.avatarInitials, { color: colors.text }]}>{avatarInitials}</Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>

          <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cameraButton, { borderColor: colors.background }]}> 
            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
          </LinearGradient>

          {isVerified ? (
            <LinearGradient colors={[colors.success, colors.successLight]} style={[styles.verifiedBadge, { borderColor: colors.background }]}> 
              <Ionicons name="checkmark" size={12} color="#fff" />
            </LinearGradient>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.nameSection}>
        <View style={styles.nameRow}>
          <Text style={[styles.fullName, { color: colors.text }]}>{fullName}</Text>
          {isVerified ? (
            <View style={styles.verifiedInline}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </View>
          ) : null}
        </View>
        <Text style={[styles.email, { color: colors.textMuted }]}>{email}</Text>
      </View>

      {bio ? (
        <View style={styles.bioContainer}>
          <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={3}>
            {bio}
          </Text>
        </View>
      ) : null}

      <LinearGradient
        colors={[colors.surface + "dd", colors.surfaceElevated + "dd"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.statsRow, { borderColor: colors.border }]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{companiesCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Companies</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text, textTransform: "capitalize" }]}>{role || "User"}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Role</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{accountType || "Standard"}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Account</Text>
        </View>
      </LinearGradient>

      {isVerified && companyName ? (
        <View style={styles.verifiedBanner}>
          <LinearGradient
            colors={[colors.success + "2e", colors.success + "12"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.verifiedBannerGradient, { borderColor: colors.success + "55" }]}
          >
            <LinearGradient colors={[colors.success + "44", colors.success + "24"]} style={styles.verifiedBannerIcon}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
            </LinearGradient>
            <View style={styles.verifiedBannerText}>
              <Text style={[styles.verifiedLabel, { color: colors.success }]}>VERIFIED BUSINESS</Text>
              <Text style={[styles.verifiedCompanyName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                {companyName}
              </Text>
            </View>
          </LinearGradient>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarGradient: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 4,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 55,
    overflow: "hidden",
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
    shadowColor: "#6366F1",
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
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  nameSection: {
    alignItems: "center",
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  verifiedInline: {
    marginLeft: 10,
  },
  email: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  bioContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  bio: {
    fontSize: 14,
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
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 36,
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
    letterSpacing: 1.2,
  },
  verifiedCompanyName: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 3,
  },
});
