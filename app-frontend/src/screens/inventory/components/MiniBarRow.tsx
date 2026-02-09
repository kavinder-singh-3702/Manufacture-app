import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

export const MiniBarRow = ({
  label,
  value,
  max,
  color,
  valueLabel,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  valueLabel?: string;
}) => {
  const { colors, radius } = useTheme();
  const accent = color || colors.primary;

  const pct = useMemo(() => {
    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
    return Math.max(0, Math.min(1, value / max));
  }, [max, value]);

  return (
    <View style={styles.row}>
      <View style={styles.topLine}>
        <Text style={[styles.label, { color: colors.textOnLightSurface }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.textOnLightSurface }]}>
          {valueLabel ?? value.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.pill }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.round(pct * 100)}%`,
              backgroundColor: accent,
              borderRadius: radius.pill,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { gap: 8, marginBottom: 12 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  label: { fontSize: 12, fontWeight: "700", flex: 1 },
  value: { fontSize: 12, fontWeight: "900" },
  track: { height: 8, overflow: "hidden" },
  fill: { height: "100%" },
});
