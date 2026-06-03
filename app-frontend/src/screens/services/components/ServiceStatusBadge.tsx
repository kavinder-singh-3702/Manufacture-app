import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { ServicePriority, ServiceStatus } from "../../../services/serviceRequest.service";
import { SERVICE_PRIORITY_META, SERVICE_STATUS_META, ServiceStatusTone } from "../services.constants";

const toneToColors = (
  tone: ServiceStatusTone,
  colors: ReturnType<typeof useTheme>["colors"],
  isDark: boolean,
) => {
  // Resolve a single anchor color per tone
  let anchor: string = colors.textMuted;
  if (tone === "success") anchor = colors.success;
  else if (tone === "warning") anchor = colors.warningStrong || colors.warning;
  else if (tone === "danger") anchor = colors.errorStrong || colors.error;
  else if (tone === "progress") anchor = colors.primary;
  else if (tone === "info") anchor = colors.info || colors.primary;

  // Higher-contrast pill: bolder background + strong text
  return {
    dot: anchor,
    text: anchor,
    bg: anchor + (isDark ? "26" : "1F"),
    border: anchor + (isDark ? "55" : "44"),
  };
};

export const ServiceStatusBadge = ({
  status,
  priority,
  size = "sm",
}: {
  status?: ServiceStatus;
  priority?: ServicePriority;
  size?: "sm" | "md";
}) => {
  const { colors, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const { fs } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";

  const statusMeta = status ? SERVICE_STATUS_META[status] : null;
  const priorityMeta = priority ? SERVICE_PRIORITY_META[priority] : null;
  const meta = statusMeta || priorityMeta;

  if (!meta) return null;

  const palette = toneToColors(meta.tone, colors, isDark);
  const dotSize = size === "sm" ? 7 : 8;

  return (
    <View
      style={[
        styles.badge,
        {
          borderRadius: radius.pill,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: size === "sm" ? 9 : 11,
          paddingVertical: size === "sm" ? 5 : 7,
        },
      ]}
    >
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: palette.dot,
        }}
      />
      <Text
        style={[
          styles.text,
          {
            color: palette.text,
            fontSize: fs(size === "sm" ? 11 : 12),
          },
        ]}
      >
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    fontWeight: "800",
    letterSpacing: 0.1,
  },
});
