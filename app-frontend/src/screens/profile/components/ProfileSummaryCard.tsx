import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type ProfileSummaryCardProps = {
  fullName: string;
  email?: string | null;
  avatarUrl?: string;
  avatarInitials: string;
  role?: string | null;
  accountType?: string | null;
  companiesCount?: number;
  bio?: string | null;
  onUploadAvatar: () => void;
  uploading?: boolean;
};

const StatPill = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.statPill, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

export const ProfileSummaryCard = ({
  fullName,
  email,
  avatarUrl,
  avatarInitials,
  role,
  accountType,
  companiesCount = 0,
  bio,
  onUploadAvatar,
  uploading,
}: ProfileSummaryCardProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.avatarRing, { borderColor: colors.primary + "66", backgroundColor: colors.surfaceElevated }]}
          onPress={onUploadAvatar}
          accessibilityRole="button"
          accessibilityLabel="Upload profile photo"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitials, { color: colors.text }]}>{avatarInitials}</Text>
          )}
          <View style={[styles.cameraBadge, { borderColor: colors.surface, backgroundColor: colors.primary }]}>
            {uploading ? (
              <ActivityIndicator color={colors.textOnPrimary} size="small" />
            ) : (
              <Ionicons name="camera" size={13} color={colors.textOnPrimary} />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={2}>
            {fullName}
          </Text>
          <Text style={[styles.email, { color: colors.textMuted }]} numberOfLines={1}>
            {email || "No email"}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.metaBadge, { borderColor: colors.primary + "44", backgroundColor: colors.primary + "16" }]}>
              <Ionicons name="person-outline" size={12} color={colors.primary} />
              <Text style={[styles.metaBadgeText, { color: colors.primary }]}>{role || "user"}</Text>
            </View>
            <View style={[styles.metaBadge, { borderColor: colors.success + "44", backgroundColor: colors.success + "16" }]}>
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.success} />
              <Text style={[styles.metaBadgeText, { color: colors.success }]}>{accountType || "standard"}</Text>
            </View>
          </View>
        </View>
      </View>

      {bio ? (
        <Text numberOfLines={3} style={[styles.bio, { color: colors.textSecondary }]}>
          {bio}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        <StatPill label="Companies" value={String(companiesCount)} />
        <StatPill label="Profile" value="Ready" />
        <StatPill label="Security" value="Active" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cameraBadge: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  fullName: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 13,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
});
