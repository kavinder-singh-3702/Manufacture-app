import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

export const QuickAdvancedToggle = ({
  advanced,
  onToggle,
}: {
  advanced: boolean;
  onToggle: () => void;
}) => {
  const { colors, radius } = useTheme();

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[styles.wrap, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
    >
      <View style={styles.left}>
        <Ionicons name={advanced ? "layers" : "flash-outline"} size={16} color={advanced ? colors.primary : colors.textMuted} />
        <Text style={[styles.title, { color: colors.text }]}>{advanced ? "Advanced mode" : "Quick mode"}</Text>
      </View>
      <Text style={[styles.action, { color: colors.primary }]}>{advanced ? "Show less" : "Show more"}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 13, fontWeight: "700" },
  action: { fontSize: 12, fontWeight: "800" },
});
