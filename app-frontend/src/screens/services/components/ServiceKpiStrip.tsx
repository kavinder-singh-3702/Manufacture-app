import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { neu } from "../services.palette";

const KPI_COLORS = {
  open: { dot: "#D97706", text: "#B45309" },
  inProgress: { dot: "#2563EB", text: "#1D4ED8" },
  completed: { dot: "#059669", text: "#047857" },
};

const KpiItem = ({
  label,
  value,
  dotColor,
  textColor,
  isDark,
}: {
  label: string;
  value: number;
  dotColor: string;
  textColor: string;
  isDark: boolean;
}) => {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.kpiCard,
        neu.pressed(isDark),
        {
          borderRadius: radius.md,
          backgroundColor: neu.insetBg(isDark),
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.value, { color: isDark ? dotColor : textColor }]}>{value}</Text>
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
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";

  return (
    <View style={styles.row}>
      <KpiItem label="Open" value={open} dotColor={KPI_COLORS.open.dot} textColor={KPI_COLORS.open.text} isDark={isDark} />
      <KpiItem label="In Progress" value={inProgress} dotColor={KPI_COLORS.inProgress.dot} textColor={KPI_COLORS.inProgress.text} isDark={isDark} />
      <KpiItem label="Completed" value={completed} dotColor={KPI_COLORS.completed.dot} textColor={KPI_COLORS.completed.text} isDark={isDark} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  kpiCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  value: { fontSize: 22, fontWeight: "900", lineHeight: 24 },
  label: { marginTop: 5, fontSize: 11, fontWeight: "700", textAlign: "center" },
});
