import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../hooks/useTheme";
import { AdminRequestDetail } from "../../../hooks/queries/useAdminRequestDetail";

type Props = {
  detail: AdminRequestDetail;
};

/**
 * Renders the user-submitted body of an ops request — what the requester
 * actually wrote when they filed it. Without this section, the detail screen
 * shows only metadata (title, status, assignee) and no admin can answer
 * "what does this person actually need?".
 *
 * Grouped into named sections with field-pairs rather than a flat dump.
 * Service-type-specific blobs (machineRepairDetails / workerDetails /
 * transportDetails / advertisementDetails) are rendered as a final
 * key/value block since their shapes vary per service type.
 */
export const AdminRequestContent = ({ detail }: Props) => {
  const { colors, spacing, radius } = useTheme();

  const sections: { title: string; rows: { label: string; value?: string | null }[] }[] = [];

  if (detail.kind === "service") {
    const description = detail.description?.trim();
    const userNotes = detail.notes?.trim();

    if (description || userNotes) {
      sections.push({
        title: "Request",
        rows: [
          description ? { label: "Description", value: description } : null,
          userNotes ? { label: "Notes", value: userNotes } : null,
        ].filter(Boolean) as { label: string; value: string }[],
      });
    }

    if (detail.contact) {
      const c = detail.contact;
      sections.push({
        title: "Contact",
        rows: [
          c.name ? { label: "Name", value: String(c.name) } : null,
          c.phone ? { label: "Phone", value: String(c.phone) } : null,
          c.email ? { label: "Email", value: String(c.email) } : null,
        ].filter(Boolean) as { label: string; value: string }[],
      });
    }

    if (detail.location) {
      const l = detail.location;
      const addrLine = [l.address, l.city, l.state, l.postalCode].filter(Boolean).join(", ");
      sections.push({
        title: "Location",
        rows: [
          addrLine ? { label: "Address", value: addrLine } : null,
          l.landmark ? { label: "Landmark", value: String(l.landmark) } : null,
        ].filter(Boolean) as { label: string; value: string }[],
      });
    }

    if (detail.schedule) {
      const s = detail.schedule;
      const start = s.startDate ? formatDate(String(s.startDate)) : undefined;
      const end = s.endDate ? formatDate(String(s.endDate)) : undefined;
      sections.push({
        title: "Schedule",
        rows: [
          start ? { label: "Start", value: start } : null,
          end ? { label: "End", value: end } : null,
          s.preferredWindow ? { label: "Preferred window", value: String(s.preferredWindow) } : null,
          s.notes ? { label: "Notes", value: String(s.notes) } : null,
        ].filter(Boolean) as { label: string; value: string }[],
      });
    }

    if (detail.budget) {
      const b = detail.budget;
      const cost =
        typeof b.estimatedCost === "number"
          ? `${b.currency || "USD"} ${b.estimatedCost.toLocaleString()}`
          : null;
      sections.push({
        title: "Budget",
        rows: [
          cost ? { label: "Estimated", value: cost } : null,
          b.notes ? { label: "Notes", value: String(b.notes) } : null,
        ].filter(Boolean) as { label: string; value: string }[],
      });
    }

    const serviceTypeDetails =
      detail.machineRepairDetails ||
      detail.workerDetails ||
      detail.transportDetails ||
      detail.advertisementDetails;
    if (serviceTypeDetails) {
      const rows = Object.entries(serviceTypeDetails)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => ({
          label: humanizeKey(key),
          value: stringifyValue(value),
        }));
      if (rows.length) {
        sections.push({
          title: `${humanizeKey(detail.serviceType)} details`,
          rows,
        });
      }
    }
  } else {
    // business_setup
    sections.push({
      title: "Business",
      rows: [
        detail.businessType ? { label: "Type", value: detail.businessType } : null,
        detail.workModel ? { label: "Work model", value: detail.workModel } : null,
        detail.location ? { label: "Location", value: detail.location } : null,
        detail.budgetRange ? { label: "Budget range", value: detail.budgetRange } : null,
        detail.startTimeline ? { label: "Start timeline", value: detail.startTimeline } : null,
        detail.supportAreas?.length
          ? { label: "Support areas", value: detail.supportAreas.join(", ") }
          : null,
        detail.founderExperience
          ? { label: "Founder experience", value: detail.founderExperience }
          : null,
        typeof detail.teamSize === "number"
          ? { label: "Team size", value: String(detail.teamSize) }
          : null,
      ].filter(Boolean) as { label: string; value: string }[],
    });

    sections.push({
      title: "Contact",
      rows: [
        detail.contactName ? { label: "Name", value: detail.contactName } : null,
        detail.contactPhone ? { label: "Phone", value: detail.contactPhone } : null,
        detail.contactEmail ? { label: "Email", value: detail.contactEmail } : null,
        detail.preferredContactChannel
          ? { label: "Preferred via", value: detail.preferredContactChannel }
          : null,
      ].filter(Boolean) as { label: string; value: string }[],
    });

    if (detail.notes?.trim()) {
      sections.push({
        title: "Notes",
        rows: [{ label: "From requester", value: detail.notes.trim() }],
      });
    }

    if (detail.referenceCode) {
      sections.push({
        title: "Reference",
        rows: [{ label: "Code", value: detail.referenceCode }],
      });
    }
  }

  const nonEmptySections = sections.filter((s) => s.rows.length > 0);

  if (!nonEmptySections.length) {
    return (
      <View style={[styles.empty, { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No content yet</Text>
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
          The requester didn't include any details in their submission.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      {nonEmptySections.map((section) => (
        <View
          key={section.title}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            {section.rows.map((row, idx) => (
              <View key={`${row.label}-${idx}`} style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: colors.text }]} selectable>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const formatDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const humanizeKey = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => stringifyValue(v)).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => `${humanizeKey(k)}: ${stringifyValue(v)}`)
      .join(" • ");
  }
  return String(value);
};

const styles = StyleSheet.create({
  card: {},
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  row: { gap: 2 },
  rowLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  rowValue: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  empty: { alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: "700" },
  emptyHint: { fontSize: 12, fontWeight: "500", textAlign: "center" },
});
