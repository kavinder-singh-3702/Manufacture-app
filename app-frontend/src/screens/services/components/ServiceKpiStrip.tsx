import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

const KpiItem = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.kpiCard, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface }]}> 
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

export const ServiceKpiStrip = ({
  open,
  inProgress,
  completed,
}: {
  open: number;
  inProgress: number;
  completed: number;
}) => {
  const { colors } = useTheme();
  const progressColor = colors.info || colors.primary;

  return (
    <View style={styles.row}>
      <KpiItem label="Open" value={open} color={colors.warningStrong || colors.warning} />
      <KpiItem label="In Progress" value={inProgress} color={progressColor} />
      <KpiItem label="Completed" value={completed} color={colors.success} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  kpiCard: { flex: 1, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 10, alignItems: "center" },
  value: { fontSize: 22, fontWeight: "900", lineHeight: 24 },
  label: { marginTop: 5, fontSize: 11, fontWeight: "700", textAlign: "center" },
});
