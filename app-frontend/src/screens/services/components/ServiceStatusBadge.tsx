import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { ServicePriority, ServiceStatus } from "../../../services/serviceRequest.service";
import { SERVICE_PRIORITY_META, SERVICE_STATUS_META, ServiceStatusTone } from "../services.constants";

const toneToColors = (tone: ServiceStatusTone, colors: ReturnType<typeof useTheme>["colors"]) => {
  if (tone === "success") return { text: colors.success, bg: `${colors.success}1A`, border: `${colors.success}4D` };
  if (tone === "warning") {
    const toneColor = colors.warningStrong || colors.warning;
    return { text: toneColor, bg: `${toneColor}1A`, border: `${toneColor}4D` };
  }
  if (tone === "danger") {
    const toneColor = colors.errorStrong || colors.error;
    return { text: toneColor, bg: `${toneColor}1A`, border: `${toneColor}4D` };
  }
  if (tone === "progress") return { text: colors.primary, bg: `${colors.primary}1A`, border: `${colors.primary}4D` };
  if (tone === "info") return { text: colors.info || colors.primary, bg: `${colors.info || colors.primary}1A`, border: `${colors.info || colors.primary}4D` };
  return { text: colors.textMuted, bg: colors.surfaceElevated, border: colors.border };
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

  const statusMeta = status ? SERVICE_STATUS_META[status] : null;
  const priorityMeta = priority ? SERVICE_PRIORITY_META[priority] : null;
  const meta = statusMeta || priorityMeta;

  if (!meta) return null;

  const palette = toneToColors(meta.tone, colors);

  return (
    <View
      style={[
        styles.badge,
        {
          borderRadius: radius.pill,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: size === "sm" ? 8 : 10,
          paddingVertical: size === "sm" ? 4 : 6,
        },
      ]}
    >
      <Text style={[styles.text, { color: palette.text, fontSize: size === "sm" ? 10 : 11 }]}>{meta.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { borderWidth: 1, alignSelf: "flex-start" },
  text: { fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 },
});
