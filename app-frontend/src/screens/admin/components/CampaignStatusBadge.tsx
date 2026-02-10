import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { CampaignStatus } from "../../../services/preference.service";

type CampaignStatusBadgeProps = {
  status?: CampaignStatus;
};

const STATUS_META: Record<CampaignStatus, { label: string; tone: "success" | "warning" | "neutral" | "error" }> = {
  active: { label: "Active", tone: "success" },
  draft: { label: "Draft", tone: "neutral" },
  expired: { label: "Expired", tone: "warning" },
  archived: { label: "Archived", tone: "error" },
};

export const CampaignStatusBadge = memo(({ status = "draft" }: CampaignStatusBadgeProps) => {
  const { colors, radius } = useTheme();
  const meta = STATUS_META[status] || STATUS_META.draft;

  const bgColor =
    meta.tone === "success"
      ? colors.badgeSuccess
      : meta.tone === "warning"
        ? colors.badgeWarning
        : meta.tone === "error"
          ? colors.badgeError
          : colors.badgePrimary;

  const textColor =
    meta.tone === "success"
      ? colors.success
      : meta.tone === "warning"
        ? colors.warning
        : meta.tone === "error"
          ? colors.error
          : colors.primary;

  return (
    <View style={[styles.pill, { backgroundColor: bgColor, borderRadius: radius.pill }]}>
      <Text style={[styles.label, { color: textColor }]}>{meta.label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
