import { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type ProfileSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export const ProfileSection = ({ title, description, children, footer, actionLabel, onAction }: ProfileSectionProps) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: spacing.lg,
        },
      ]}
    >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {description ? (
              <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
            ) : null}
          </View>
          {actionLabel && onAction ? (
            <TouchableOpacity onPress={onAction}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View>{children}</View>
        {footer ? <View style={{ marginTop: spacing.md }}>{footer}</View> : null}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    marginTop: 4,
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  actionLabel: {
    fontWeight: "600",
  },
});
