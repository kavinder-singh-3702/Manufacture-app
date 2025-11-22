import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Company } from "../../../types/company";
import { CompanyAvatar } from "../../../navigation/components/MainTabs/components/ProfileAvatar";

type Props = {
  company: Company;
  complianceStatus: Company["complianceStatus"] | string;
  onUploadLogo?: () => void;
  uploading?: boolean;
};

const StatusPill = ({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "secondary" | "warning";
}) => {
  const { colors, spacing } = useTheme();
  const background =
    tone === "success" ? "rgba(17, 164, 64, 0.12)" : tone === "secondary" ? "rgba(59, 31, 43, 0.08)" : "rgba(249, 115, 22, 0.12)";
  const textColor = tone === "success" ? "#0f9f4c" : tone === "secondary" ? colors.secondary : "#b45309";

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: background,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
      ]}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: textColor }}>{label}</Text>
    </View>
  );
};

export const CompanyHero = ({ company, complianceStatus, onUploadLogo, uploading }: Props) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.hero}>
      <CompanyAvatar company={company} size={84} />
      <View style={{ marginLeft: spacing.md, flex: 1, justifyContent: "center" }}>
        <Text style={[styles.heroTitle, { color: colors.text }]} numberOfLines={1}>
          {company.displayName}
        </Text>
        <View style={styles.pillRow}>
          <StatusPill label={company.type ?? "normal"} tone="secondary" />
          <StatusPill label={complianceStatus} tone={complianceStatus === "approved" ? "success" : "warning"} />
        </View>
        {onUploadLogo ? (
          <TouchableOpacity
            onPress={onUploadLogo}
            style={[styles.logoAction, { opacity: uploading ? 0.6 : 1 }]}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.logoActionText, { color: colors.text }]}>Update logo</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  pill: {
    borderRadius: 999,
    marginRight: 8,
    marginTop: 4,
  },
  logoAction: {
    marginTop: 8,
  },
  logoActionText: {
    fontWeight: "700",
  },
});
