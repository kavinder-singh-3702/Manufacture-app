import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
          style={[styles.avatarContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={onUploadAvatar}
          activeOpacity={0.9}
          disabled={uploading}
        >
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
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    marginRight: 16,
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
