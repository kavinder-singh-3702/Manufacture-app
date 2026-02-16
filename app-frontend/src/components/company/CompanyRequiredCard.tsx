import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../hooks/useTheme";

type CompanyRequiredCardProps = {
  title?: string;
  description: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  style?: ViewStyle;
};

export const CompanyRequiredCard = ({
  title = "Select a company to continue",
  description,
  primaryLabel = "Choose Company",
  secondaryLabel = "Create Company",
  onPrimaryPress,
  onSecondaryPress,
  style,
}: CompanyRequiredCardProps) => {
  const { colors, spacing, radius } = useTheme();
  const { isCompact } = useResponsiveLayout();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWrap,
            {
              borderRadius: radius.md,
              borderColor: colors.accentEmber + "44",
              backgroundColor: colors.accentEmber + "20",
            },
          ]}
        >
          <Ionicons name="business-outline" size={18} color={colors.accentEmber} />
        </View>
        <View style={styles.copyWrap}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
        </View>
      </View>

      <View style={[styles.actionsRow, isCompact && styles.actionsRowStack]}>
        {onPrimaryPress ? (
          <TouchableOpacity
            onPress={onPrimaryPress}
            activeOpacity={0.85}
            style={[
              styles.primaryButton,
              {
                borderRadius: radius.md,
                backgroundColor: colors.primary,
                minHeight: 44,
              },
            ]}
          >
            <Ionicons name="swap-horizontal-outline" size={16} color={colors.textOnPrimary} />
            <Text style={[styles.primaryLabel, { color: colors.textOnPrimary }]}>{primaryLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {onSecondaryPress ? (
          <TouchableOpacity
            onPress={onSecondaryPress}
            activeOpacity={0.85}
            style={[
              styles.secondaryButton,
              {
                borderRadius: radius.md,
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                minHeight: 44,
              },
            ]}
          >
            <Ionicons name="add-circle-outline" size={16} color={colors.text} />
            <Text style={[styles.secondaryLabel, { color: colors.text }]}>{secondaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copyWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionsRowStack: {
    flexDirection: "column",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 6,
    paddingHorizontal: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  primaryLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  secondaryLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
});
