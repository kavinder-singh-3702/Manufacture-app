import { TouchableOpacity, StyleSheet, ActivityIndicator, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

export const SupportFab = ({
  loading,
  onPress,
  style,
}: {
  loading?: boolean;
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
});
