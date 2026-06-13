import { TouchableOpacity, StyleSheet, ActivityIndicator, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

export const SupportFab = ({
  loading,
  unreadCount = 0,
  onPress,
  style,
}: {
  loading?: boolean;
  /**
   * Count of unread admin/support messages waiting for the user. Surfaces
   * a small red badge in the corner of the FAB so the user proactively
   * knows admin replied without needing to open the chat. Tapping the FAB
   * opens the support thread, which calls markRead → badge clears.
   */
  unreadCount?: number;
  onPress: () => void;
  style?: ViewStyle;
}) => {
  const { colors, radius } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={loading}
      style={[
        styles.fab,
        {
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.textOnPrimary} />
      ) : (
        <>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.textOnPrimary} />
          <Text style={[styles.label, { color: colors.textOnPrimary }]}>Support</Text>
        </>
      )}
      {unreadCount > 0 && !loading ? (
        <View
          style={[
            styles.badge,
            { borderColor: colors.textOnPrimary, backgroundColor: colors.error },
          ]}
        >
          <Text style={styles.badgeText} numberOfLines={1}>
            {unreadCount > 9 ? "9+" : String(unreadCount)}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    paddingHorizontal: 16,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  label: { fontSize: 13, fontWeight: "800" },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
