import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

export const SectionHeader = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  const { colors } = useTheme();
  const showAction = Boolean(actionLabel && onAction);

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {showAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.8}>
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  left: { flex: 1 },
  title: { fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  subtitle: { marginTop: 3, fontSize: 12, fontWeight: "600" },
  action: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 4 },
  actionText: { fontSize: 12, fontWeight: "800" },
});
