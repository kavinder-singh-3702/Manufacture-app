import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

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
  const isVerified = verificationStatus === "approved";

  return (
    <View style={styles.container}>
      {/* Premium Avatar Section with Glow */}
      <View style={styles.avatarSection}>
        {/* Outer glow effect */}
        <View style={[styles.avatarGlow, isVerified && styles.avatarGlowVerified]} />

        <TouchableOpacity
          onPress={onUploadAvatar}
          activeOpacity={0.85}
          disabled={uploading}
          style={styles.avatarWrapper}
        >
          {/* Animated gradient ring */}
          <LinearGradient
            colors={isVerified
              ? ["#10B981", "#34D399", "#059669", "#10B981"]
              : ["#8B5CF6", "#6366F1", "#EC4899", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarInner}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={["#1E1E24", "#141418"]}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitials}>{avatarInitials}</Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>

          {/* Camera Icon with gradient */}
          <LinearGradient
            colors={["#6366F1", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cameraButton}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={14} color="#fff" />
            )}
          </LinearGradient>

          {/* Verified Badge with glow */}
          {isVerified && (
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.verifiedBadge}
            >
              <Ionicons name="checkmark" size={12} color="#fff" />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* Name & Email with premium typography */}
      <View style={styles.nameSection}>
        <View style={styles.nameRow}>
          <Text style={styles.fullName}>{fullName}</Text>
          {isVerified && (
            <View style={styles.verifiedInline}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            </View>
          )}
        </View>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Bio with elegant styling */}
      {bio ? (
        <View style={styles.bioContainer}>
          <Text style={styles.bio} numberOfLines={3}>{bio}</Text>
        </View>
      ) : null}

      {/* Stats Row with glassmorphism */}
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.statsRow}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{companiesCount}</Text>
          <Text style={styles.statLabel}>Companies</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{role || "User"}</Text>
          <Text style={styles.statLabel}>Role</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{accountType || "Standard"}</Text>
          <Text style={styles.statLabel}>Account</Text>
        </View>
      </LinearGradient>

      {/* Verified Company Banner with premium styling */}
      {isVerified && companyName && (
        <View style={styles.verifiedBanner}>
          <LinearGradient
            colors={["rgba(16, 185, 129, 0.18)", "rgba(16, 185, 129, 0.06)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifiedBannerGradient}
          >
            <LinearGradient
              colors={["rgba(16, 185, 129, 0.25)", "rgba(16, 185, 129, 0.12)"]}
              style={styles.verifiedBannerIcon}
            >
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            </LinearGradient>
            <View style={styles.verifiedBannerText}>
              <Text style={styles.verifiedLabel}>VERIFIED BUSINESS</Text>
              <Text style={styles.verifiedCompanyName} numberOfLines={1}>{companyName}</Text>
            </View>
          </LinearGradient>
        </View>
      )}
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
    backgroundColor: "rgba(139, 92, 246, 0.25)",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  avatarGlowVerified: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    shadowColor: "#10B981",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarGradient: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 4,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 55,
    overflow: "hidden",
    backgroundColor: "#0F1115",
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
    color: "#FAFAFA",
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
    borderColor: "#0F1115",
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
    borderColor: "#0F1115",
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
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  verifiedInline: {
    marginLeft: 10,
  },
  email: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.45)",
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
    color: "rgba(255, 255, 255, 0.65)",
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
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.45)",
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
    borderColor: "rgba(16, 185, 129, 0.25)",
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
    color: "#34D399",
    letterSpacing: 1.2,
  },
  verifiedCompanyName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 3,
  },
});
