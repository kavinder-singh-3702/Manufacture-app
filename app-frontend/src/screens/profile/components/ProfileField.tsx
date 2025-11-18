import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type ProfileFieldProps = {
  label: string;
  value?: ReactNode;
  helperText?: string;
};

export const ProfileField = ({ label, value, helperText }: ProfileFieldProps) => {
  const { colors, spacing } = useTheme();
  const resolvedValue = value ?? <Text style={{ color: colors.muted }}>Not provided</Text>;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border, paddingVertical: spacing.sm }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <View style={styles.valueColumn}>
        {typeof resolvedValue === "string" ? (
          <Text style={[styles.value, { color: colors.text }]}>{resolvedValue}</Text>
        ) : (
          resolvedValue
        )}
        {helperText ? (
          <Text style={[styles.helper, { color: colors.muted }]} numberOfLines={2}>
            {helperText}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 16,
  },
  label: {
    width: 120,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueColumn: {
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  helper: {
    marginTop: 4,
    fontSize: 13,
  },
});
