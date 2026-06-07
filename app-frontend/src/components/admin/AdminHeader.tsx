import { ReactNode } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";

type AdminHeaderProps = {
  title: string;
  subtitle?: string;
  count?: number;
  /** Slot for an inline CTA (e.g. "+ Add user"). Rendered to the right of the title row. */
  rightSlot?: ReactNode;
  /**
   * When true, the header applies its own top safe-area inset.
   * Set to false if the parent screen already handles the inset.
   * Default: true.
   */
  applyTopInset?: boolean;
};

export const AdminHeader = ({
  title,
  subtitle,
  count,
  rightSlot,
  applyTopInset = true,
}: AdminHeaderProps) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: applyTopInset ? insets.top + 12 : 0,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        },
      ]}
    >
      {/* Subtle accent strip behind the title — gives the header a premium feel */}
      <LinearGradient
        colors={[colors.primary + "10", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.titleRow}>
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: isCompact ? 24 : 28 },
          ]}
        >
          {title}
        </Text>
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>

      {(subtitle || count !== undefined) && (
        <View style={[styles.metaRow, { marginTop: isCompact ? 6 : 8 }]}>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: colors.textMuted, fontSize: isCompact ? 13 : 14 },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
          {count !== undefined ? (
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.countBadge}
            >
              <Text style={[styles.countText, { color: colors.textOnPrimary }]}>
                {count}
              </Text>
            </LinearGradient>
          ) : null}
        </View>
      )}

      <LinearGradient
        colors={[colors.primary + "55", colors.primary + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.accentBar, { marginTop: spacing.md }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontWeight: "900",
    letterSpacing: -0.6,
    flex: 1,
  },
  rightSlot: {
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  subtitle: {
    flexShrink: 1,
    lineHeight: 20,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  accentBar: {
    height: 2,
    borderRadius: 1,
  },
});
