import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export const StockStatusBadge = ({
  status,
  size = "md",
}: {
  status: StockStatus;
  size?: "sm" | "md";
}) => {
  const { colors, radius } = useTheme();

  const meta = useMemo(() => {
    if (status === "in_stock") return { label: "In stock", color: colors.success };
    if (status === "low_stock") return { label: "Low", color: colors.warningStrong || colors.warning };
    return { label: "Out", color: colors.errorStrong || colors.error };
  }, [colors, status]);

  const padding = size === "sm" ? { paddingHorizontal: 8, paddingVertical: 4 } : { paddingHorizontal: 10, paddingVertical: 6 };
  const fontSize = size === "sm" ? 10 : 11;

  return (
    <View
      style={[
        styles.badge,
        padding,
        {
          borderRadius: radius.pill,
          backgroundColor: `${meta.color}14`,
          borderColor: `${meta.color}40`,
        },
      ]}
    >
      <Text style={[styles.text, { color: meta.color, fontSize }]}>{meta.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});

