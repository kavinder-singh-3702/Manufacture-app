import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../hooks/useTheme";
import { AdminRequestDetail } from "../../../hooks/queries/useAdminRequestDetail";
import { toStatusLabel } from "../../../constants/requestStatusTransitions";

type Props = {
  detail: AdminRequestDetail;
};

const formatDate = (value?: string): string => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const describeEntry = (
  entry: AdminRequestDetail["timeline"] extends Array<infer T> ? T : never
): { title: string; detail?: string } => {
  if (!entry) return { title: "—" };
  if (entry.type === "status") {
    const e = entry.entry || {};
    const from = e.fromStatus || e.previous || e.from;
    const to = e.toStatus || e.status || e.to;
    if (from && to) {
      return {
        title: `Status changed`,
        detail: `${toStatusLabel(from)} → ${toStatusLabel(to)}${e.reason ? ` • ${e.reason}` : ""}`,
      };
    }
    return { title: "Status updated", detail: e.reason };
  }
  if (entry.type === "assignment") {
    const e = entry.entry || {};
    const to =
      e.assignedTo?.displayName ||
      e.assignedTo?.email ||
      (e.assignedTo ? "Someone" : "Unassigned");
    return { title: "Assignment changed", detail: `Now: ${to}${e.reason ? ` • ${e.reason}` : ""}` };
  }
  if (entry.type === "note") {
    const e = entry.entry || {};
    return { title: "Note added", detail: e.body || e.text || e.note };
  }
  return { title: String(entry.type || "Event") };
};

export const AdminRequestTimeline = ({ detail }: Props) => {
  const { colors, spacing, radius } = useTheme();

  const events = detail.timeline || [];

  if (!events.length) {
    return (
      <View style={[styles.empty, { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No timeline yet</Text>
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
          Status changes, assignments, and notes will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Timeline</Text>
      {events.map((entry, index) => {
        const { title, detail: line } = describeEntry(entry as any);
        return (
          <View
            key={`${entry.at || index}-${index}`}
            style={[
              styles.eventRow,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.md,
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.eventTitle, { color: colors.text }]}>{title}</Text>
            {line ? (
              <Text style={[styles.eventDetail, { color: colors.textMuted }]} numberOfLines={3}>
                {line}
              </Text>
            ) : null}
            <Text style={[styles.eventTime, { color: colors.textTertiary }]}>{formatDate(entry.at)}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
  eventRow: { gap: 4 },
  eventTitle: { fontSize: 14, fontWeight: "800" },
  eventDetail: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  eventTime: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  empty: { alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: "700" },
  emptyHint: { fontSize: 12, fontWeight: "500", textAlign: "center" },
});
