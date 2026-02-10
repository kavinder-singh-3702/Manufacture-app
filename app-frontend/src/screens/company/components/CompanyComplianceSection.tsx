import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { ComplianceStatus } from "../../../types/company";

type CompanyComplianceSectionProps = {
  complianceStatus: ComplianceStatus;
  isReadOnly: boolean;
  onOpenVerification: () => void;
};

const getStatusMeta = (status: ComplianceStatus) => {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        tone: "success" as const,
        description: "Your company is verified and trusted for marketplace visibility.",
      };
    case "submitted":
      return {
        label: "Submitted",
        tone: "info" as const,
        description: "Verification documents are under review by the admin team.",
      };
    case "rejected":
      return {
        label: "Rejected",
        tone: "error" as const,
        description: "Verification was rejected. Review notes and resubmit updated documents.",
      };
    default:
      return {
        label: "Pending",
        tone: "warning" as const,
        description: "Verification is pending. Submit documents to unlock full trust signals.",
      };
  }
};

export const CompanyComplianceSection = ({
  complianceStatus,
  isReadOnly,
  onOpenVerification,
}: CompanyComplianceSectionProps) => {
  const { colors } = useTheme();
  const meta = getStatusMeta(complianceStatus);

  const toneColor =
    meta.tone === "success"
      ? colors.success
      : meta.tone === "warning"
        ? colors.warning
        : meta.tone === "error"
          ? colors.error
          : colors.info;

  return (
    <View style={styles.container}>
      <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: toneColor + "18", borderColor: toneColor + "50" }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={toneColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Verification Status</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>{meta.description}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { borderColor: toneColor + "60", backgroundColor: toneColor + "18" }]}>
          <Text style={[styles.statusLabel, { color: toneColor }]}>{meta.label}</Text>
        </View>

        {isReadOnly ? (
          <Text style={[styles.readOnlyText, { color: colors.textMuted }]}>
            Admin read-only mode: verification actions are disabled in this view.
          </Text>
        ) : complianceStatus === "approved" ? null : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onOpenVerification}
            style={[styles.cta, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.ctaText, { color: colors.textOnPrimary }]}>Open Verification</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  description: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  readOnlyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cta: {
    marginTop: 2,
    borderRadius: 12,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
