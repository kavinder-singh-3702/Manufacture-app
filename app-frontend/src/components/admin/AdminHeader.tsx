import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type AdminHeaderProps = {
  title: string;
  subtitle?: string;
  count?: number;
};

export const AdminHeader = ({ title, subtitle, count }: AdminHeaderProps) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {(subtitle || count !== undefined) && (
        <View style={styles.subtitleRow}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
          {count !== undefined && (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.countText, { color: colors.primary }]}>
                {count}
              </Text>
            </View>
          )}
        </View>
      )}
      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border, marginTop: spacing.lg },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  subtitle: {
    fontSize: 16,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    opacity: 0.5,
  },
});
