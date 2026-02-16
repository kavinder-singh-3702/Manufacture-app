import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { AdaptiveSingleLineText } from "../../../components/text/AdaptiveSingleLineText";
import { AdaptiveTwoLineText } from "../../../components/text/AdaptiveTwoLineText";
import { ComplianceStatus } from "../../../types/company";
import { useCompanyProfileLayout } from "./companyProfile.layout";

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
  const layout = useCompanyProfileLayout();
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
    <View style={[styles.container, { gap: layout.sectionGap }]}> 
      <View
        style={[
          styles.panel,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            borderRadius: layout.compact ? 14 : 16,
            padding: layout.cardPadding,
            gap: layout.compact ? 10 : 12,
          },
        ]}
      >
        <View style={[styles.header, layout.compact && styles.headerCompact]}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: toneColor + "18",
                borderColor: toneColor + "50",
                width: layout.compact ? 34 : 38,
                height: layout.compact ? 34 : 38,
                borderRadius: layout.compact ? 10 : 12,
              },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={layout.compact ? 18 : 20} color={toneColor} />
          </View>
          <View style={styles.headerText}>
            <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.title, { color: colors.text, fontSize: layout.compact ? 15 : 16 }]}>
              Verification Status
            </AdaptiveSingleLineText>
            <AdaptiveTwoLineText
              minimumFontScale={0.72}
              style={[styles.description, { color: colors.textMuted, fontSize: layout.compact ? 12 : 13 }]}
            >
              {meta.description}
            </AdaptiveTwoLineText>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              borderColor: toneColor + "60",
              backgroundColor: toneColor + "18",
              minHeight: layout.chipHeight,
              paddingHorizontal: layout.compact ? 10 : 12,
            },
          ]}
        >
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.statusLabel, { color: toneColor, fontSize: layout.compact ? 11 : 12 }]}>
            {meta.label}
          </AdaptiveSingleLineText>
        </View>

        {isReadOnly ? (
          <AdaptiveTwoLineText
            minimumFontScale={0.72}
            style={[styles.readOnlyText, { color: colors.textMuted, fontSize: layout.compact ? 11 : 12 }]}
          >
            Admin read-only mode: verification actions are disabled in this view.
          </AdaptiveTwoLineText>
        ) : complianceStatus === "approved" ? null : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onOpenVerification}
            style={[
              styles.cta,
              {
                backgroundColor: colors.primary,
                minHeight: layout.ctaHeight,
                borderRadius: layout.compact ? 10 : 12,
              },
            ]}
          >
            <AdaptiveSingleLineText
              allowOverflowScroll={false}
              style={[styles.ctaText, { color: colors.textOnPrimary, fontSize: layout.compact ? 13 : 14 }]}
            >
              Open Verification
            </AdaptiveSingleLineText>
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
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minWidth: 0,
  },
  headerCompact: {
    alignItems: "center",
  },
  iconWrap: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontWeight: "800",
    minWidth: 0,
    flexShrink: 1,
  },
  description: {
    fontWeight: "500",
    lineHeight: 18,
    minWidth: 0,
    flexShrink: 1,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 0,
  },
  statusLabel: {
    fontWeight: "800",
    textTransform: "uppercase",
    minWidth: 0,
    flexShrink: 1,
  },
  readOnlyText: {
    fontWeight: "700",
    minWidth: 0,
    flexShrink: 1,
  },
  cta: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontWeight: "800",
    minWidth: 0,
    flexShrink: 1,
  },
});
