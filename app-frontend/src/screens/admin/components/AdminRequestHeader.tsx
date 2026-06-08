import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../hooks/useTheme";
import { AdminRequestDetail } from "../../../hooks/queries/useAdminRequestDetail";
import { toStatusLabel } from "../../../constants/requestStatusTransitions";

type Props = {
  detail: AdminRequestDetail;
};

const KIND_LABEL: Record<AdminRequestDetail["kind"], string> = {
  service: "Service request",
  business_setup: "Startup request",
};

const KIND_ICON: Record<AdminRequestDetail["kind"], keyof typeof Ionicons.glyphMap> = {
  service: "construct-outline",
  business_setup: "rocket-outline",
};

type StatusTone = "success" | "warning" | "error" | "neutral";

const statusTone = (status: string): StatusTone => {
  if (["completed", "approved", "launched"].includes(status)) return "success";
  if (["cancelled", "rejected", "closed"].includes(status)) return "error";
  if (["pending", "in_review", "scheduled", "new", "contacted", "planning", "onboarding"].includes(status)) {
    return "warning";
  }
  return "neutral";
};

const priorityTone = (priority?: string): StatusTone => {
  if (!priority) return "neutral";
  if (["urgent", "critical", "high"].includes(priority.toLowerCase())) return "error";
  if (["normal", "medium"].includes(priority.toLowerCase())) return "warning";
  return "neutral";
};

export const AdminRequestHeader = ({ detail }: Props) => {
  const { colors, spacing, radius } = useTheme();

  const statusToneKey = statusTone(detail.status);
  const priorityToneKey = priorityTone(detail.priority);

  const toneToColor = (tone: StatusTone): string => {
    if (tone === "success") return colors.success;
    if (tone === "warning") return colors.warning;
    if (tone === "error") return colors.error;
    return colors.textMuted;
  };

  const company = detail.company?.displayName;
  const assignee = detail.assignedTo?.displayName || detail.assignedTo?.email;
  const owner = detail.createdBy?.displayName || detail.createdBy?.email;

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      <View style={[styles.kindRow, { gap: 8 }]}>
        <View
          style={[
            styles.kindIcon,
            {
              backgroundColor: colors.primary + "14",
              borderRadius: radius.md,
            },
          ]}
        >
          <Ionicons name={KIND_ICON[detail.kind]} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.kindLabel, { color: colors.textMuted }]}>{KIND_LABEL[detail.kind]}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text, marginTop: spacing.sm }]} numberOfLines={3}>
        {detail.title || "Untitled request"}
      </Text>

      <View style={[styles.pillRow, { gap: 8, marginTop: spacing.sm }]}>
        <View style={[styles.pill, { backgroundColor: toneToColor(statusToneKey) + "1f", borderRadius: radius.pill }]}>
          <View style={[styles.pillDot, { backgroundColor: toneToColor(statusToneKey) }]} />
          <Text style={[styles.pillText, { color: toneToColor(statusToneKey) }]}>
            {toStatusLabel(detail.status)}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: toneToColor(priorityToneKey) + "1f", borderRadius: radius.pill }]}>
          <Ionicons name="flag-outline" size={11} color={toneToColor(priorityToneKey)} />
          <Text style={[styles.pillText, { color: toneToColor(priorityToneKey) }]}>
            {detail.priority || "normal"} priority
          </Text>
        </View>
      </View>

      <View style={{ marginTop: spacing.md, gap: 6 }}>
        {company ? (
          <Text style={[styles.metaLine, { color: colors.text }]}>
            🏢 <Text style={{ color: colors.textMuted }}>Company</Text>  {company}
          </Text>
        ) : null}
        {owner ? (
          <Text style={[styles.metaLine, { color: colors.text }]}>
            👤 <Text style={{ color: colors.textMuted }}>Created by</Text>  {owner}
          </Text>
        ) : null}
        <Text style={[styles.metaLine, { color: colors.text }]}>
          🎯 <Text style={{ color: colors.textMuted }}>Assigned to</Text>  {assignee || "Unassigned"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  kindRow: { flexDirection: "row", alignItems: "center" },
  kindIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  kindLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.3, lineHeight: 28 },
  pillRow: { flexDirection: "row", flexWrap: "wrap" },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, gap: 6 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  metaLine: { fontSize: 13, fontWeight: "600", lineHeight: 19 },
});
