import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { neu } from "../services.palette";

export const QuickAdvancedToggle = ({
  advanced,
  onToggle,
}: {
  advanced: boolean;
  onToggle: () => void;
}) => {
  const { colors, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.85}
      style={[
        styles.wrap,
        neu.pressed(isDark),
        {
          borderRadius: radius.lg,
          backgroundColor: neu.insetBg(isDark),
        },
      ]}
    >
      <View style={styles.left}>
        <Ionicons
          name={advanced ? "layers" : "flash-outline"}
          size={16}
          color={colors.textMuted}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          {advanced ? "Advanced mode" : "Quick mode"}
        </Text>
      </View>
      <Text style={[styles.action, { color: colors.textMuted }]}>
        {advanced ? "Show less" : "Show more"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 13, fontWeight: "700" },
  action: { fontSize: 12, fontWeight: "800" },
});
