import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

type CommandCenterHeaderProps = {
  title?: string;
  subtitle?: string;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
};

export const CommandCenterHeader = ({
  title = "COMMAND CENTER",
  subtitle = "ADMIN NODE 04",
  onSearchPress,
  onNotificationPress,
  notificationCount = 0,
}: CommandCenterHeaderProps) => {
  const { colors, radius } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.logoIcon, { backgroundColor: colors.primary + "15", borderRadius: radius.md }]}>
          <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.right}>
        {onSearchPress && (
          <TouchableOpacity
            onPress={onSearchPress}
            style={[styles.iconButton, {
              backgroundColor: colors.primary + "12",
              borderColor: colors.primary + "30",
            }]}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
        {onNotificationPress && (
          <TouchableOpacity
            onPress={onNotificationPress}
            style={[styles.iconButton, {
              backgroundColor: colors.primary + "12",
              borderColor: colors.primary + "30",
            }]}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={18} color={colors.primary} />
            {notificationCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  subtitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
});
