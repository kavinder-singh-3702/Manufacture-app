import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

export const InventorySectionHeader = ({
  title,
  subtitle,
  actionLabel,
  onPressAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
}) => {
  const { spacing, colors } = useTheme();
  const hasAction = Boolean(actionLabel && onPressAction);

  return (
    <View style={[styles.container, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
        {hasAction ? (
          <TouchableOpacity onPress={onPressAction} activeOpacity={0.8} style={styles.action}>
            <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  subtitle: { marginTop: 3, fontSize: 12, fontWeight: "600" },
  action: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 8 },
  actionText: { fontSize: 12, fontWeight: "800" },
});

