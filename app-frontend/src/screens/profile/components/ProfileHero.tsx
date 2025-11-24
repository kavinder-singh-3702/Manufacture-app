import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../hooks/useTheme";
import { StatusPill } from "./ProfileForm";

type Props = {
  fullName: string;
  email?: string | null;
  avatarUrl?: string;
  avatarInitials: string;
  role?: string | null;
  accountType?: string | null;
  uploading?: boolean;
  onUploadAvatar: () => void;
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
}: Props) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.headerMeta}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onUploadAvatar}
          activeOpacity={0.9}
          disabled={uploading}
        >
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
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
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{fullName}</Text>
          <Text style={{ color: colors.muted }}>{email}</Text>
          <View style={styles.pillRow}>
            {role ? <StatusPill label={role.toUpperCase()} style={styles.pillSpacing} /> : null}
            {accountType ? <StatusPill label={accountType} style={styles.pillSpacing} /> : null}
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
});
