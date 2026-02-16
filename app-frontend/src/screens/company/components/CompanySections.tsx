import { ReactNode, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { AdaptiveSingleLineText } from "../../../components/text/AdaptiveSingleLineText";
import { AdaptiveTwoLineText } from "../../../components/text/AdaptiveTwoLineText";
import { Company } from "../../../types/company";
import { CompanyEditorSection } from "./types";
import { useCompanyProfileLayout } from "./companyProfile.layout";

type Props = {
  company: Company;
  onEdit?: (section: Exclude<CompanyEditorSection, null>) => void;
  formatAddress: (company?: Company | null) => string | null;
  formatCategories: (company?: Company | null) => string;
};

const useCompanySectionsTheme = () => {
  const { colors } = useTheme();
  const layout = useCompanyProfileLayout();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);
  return { colors, styles, layout };
};

const SectionCard = ({
  title,
  icon,
  children,
  onEdit,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  onEdit?: () => void;
}) => {
  const { colors, styles, layout } = useCompanySectionsTheme();

  return (
    <LinearGradient
      colors={[colors.badgeSecondary, "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.sectionCard}
    >
      <View style={[styles.sectionHeader, layout.compact && styles.sectionHeaderCompact]}>
        <View style={styles.sectionTitleRow}>
          <LinearGradient colors={[colors.badgePrimary, colors.badgePrimary]} style={styles.sectionIcon}>
            <Ionicons name={icon} size={layout.xCompact ? 16 : 18} color={colors.primaryLight} />
          </LinearGradient>
          <AdaptiveSingleLineText
            allowOverflowScroll={false}
            minimumFontScale={0.72}
            style={styles.sectionTitle}
          >
            {title}
          </AdaptiveSingleLineText>
        </View>
        {onEdit ? (
          <TouchableOpacity onPress={onEdit} activeOpacity={0.75}>
            <LinearGradient
              colors={[colors.badgePrimary, colors.badgePrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editButton}
            >
              <AdaptiveSingleLineText
                allowOverflowScroll={false}
                minimumFontScale={0.75}
                style={styles.editButtonText}
              >
                Edit
              </AdaptiveSingleLineText>
              <Ionicons name="pencil" size={layout.xCompact ? 12 : 13} color={colors.primaryLight} />
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </LinearGradient>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) => {
  const { colors, styles } = useCompanySectionsTheme();

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrapper}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
      </View>
      <View style={styles.infoContent}>
        <AdaptiveSingleLineText allowOverflowScroll={false} style={styles.infoLabel}>
          {label}
        </AdaptiveSingleLineText>
        <AdaptiveTwoLineText minimumFontScale={0.68} style={styles.infoValue}>
          {value || "Not provided"}
        </AdaptiveTwoLineText>
      </View>
    </View>
  );
};

const TagPill = ({ label }: { label: string }) => {
  const { styles } = useCompanySectionsTheme();

  return (
    <LinearGradient
      colors={["rgba(108,99,255,0.18)", "rgba(108,99,255,0.10)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.tagPill}
    >
      <AdaptiveSingleLineText
        allowOverflowScroll={false}
        minimumFontScale={0.74}
        style={styles.tagText}
      >
        {label}
      </AdaptiveSingleLineText>
    </LinearGradient>
  );
};

const SocialLink = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) => {
  const { colors, styles } = useCompanySectionsTheme();
  const hasValue = Boolean(value);

  return (
    <View style={[styles.socialLinkItem, !hasValue && styles.socialLinkItemEmpty]}>
      <View style={[styles.socialLinkIcon, hasValue && styles.socialLinkIconActive]}>
        <Ionicons name={icon} size={16} color={hasValue ? colors.text : colors.textMuted} />
      </View>
      <AdaptiveSingleLineText
        allowOverflowScroll={false}
        minimumFontScale={0.75}
        style={[styles.socialLinkLabel, hasValue && styles.socialLinkLabelActive]}
      >
        {label}
      </AdaptiveSingleLineText>
    </View>
  );
};

export const CompanySections = ({ company, onEdit, formatAddress, formatCategories }: Props) => {
  const { colors, styles } = useCompanySectionsTheme();
  const categories = company.categories || [];
  const categoriesSummary = formatCategories(company);

  return (
    <View style={styles.container}>
      <SectionCard title="Company Overview" icon="business-outline" onEdit={onEdit ? () => onEdit("overview") : undefined}>
        <InfoRow icon="text" label="Display Name" value={company.displayName} />
        <InfoRow icon="document-text" label="Legal Name" value={company.legalName} />
        <InfoRow icon="pricetag" label="Type" value={company.type} />
        <InfoRow icon="information-circle" label="Description" value={company.description} />

        <View style={styles.tagsSection}>
          <View style={styles.tagsSectionHeader}>
            <View style={styles.tagsIconWrapper}>
              <Ionicons name="grid" size={14} color={colors.warning} />
            </View>
            <AdaptiveSingleLineText allowOverflowScroll={false} style={styles.tagsTitle}>
              Categories
            </AdaptiveSingleLineText>
          </View>
          {categories.length > 0 ? (
            <View style={styles.tagsContainer}>
              {categories.map((cat) => (
                <TagPill key={cat} label={cat} />
              ))}
            </View>
          ) : (
            <AdaptiveTwoLineText minimumFontScale={0.72} style={styles.tagsPlaceholder}>
              {categoriesSummary}
            </AdaptiveTwoLineText>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Contact & Presence" icon="call-outline" onEdit={onEdit ? () => onEdit("contact") : undefined}>
        <InfoRow icon="mail" label="Email" value={company.contact?.email} />
        <InfoRow icon="call" label="Phone" value={company.contact?.phone} />
        <InfoRow icon="globe" label="Website" value={company.contact?.website} />

        <View style={styles.socialSection}>
          <View style={styles.tagsSectionHeader}>
            <View style={[styles.tagsIconWrapper, { backgroundColor: colors.badgeInfo, borderColor: colors.info + "44" }]}>
              <Ionicons name="share-social" size={14} color={colors.info} />
            </View>
            <AdaptiveSingleLineText allowOverflowScroll={false} style={styles.tagsTitle}>
              Social Links
            </AdaptiveSingleLineText>
          </View>
          <View style={styles.socialLinksGrid}>
            <SocialLink icon="logo-linkedin" label="LinkedIn" value={company.socialLinks?.linkedin} />
            <SocialLink icon="logo-twitter" label="Twitter" value={company.socialLinks?.twitter} />
            <SocialLink icon="logo-instagram" label="Instagram" value={company.socialLinks?.instagram} />
            <SocialLink icon="logo-youtube" label="YouTube" value={company.socialLinks?.youtube} />
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Headquarters" icon="location-outline" onEdit={onEdit ? () => onEdit("address") : undefined}>
        <InfoRow icon="location" label="Full Address" value={formatAddress(company)} />
        <InfoRow icon="business" label="City" value={company.headquarters?.city} />
        <InfoRow icon="map" label="State / Region" value={company.headquarters?.state} />
        <InfoRow icon="mail-open" label="Postal Code" value={company.headquarters?.postalCode} />
        <InfoRow icon="earth" label="Country" value={company.headquarters?.country} />
      </SectionCard>
    </View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  layout: ReturnType<typeof useCompanyProfileLayout>
) =>
  StyleSheet.create({
    container: {
      gap: layout.sectionGap,
      marginTop: 6,
    },
    sectionCard: {
      borderRadius: layout.compact ? 16 : 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: layout.cardPadding,
      paddingVertical: layout.compact ? 10 : 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
      minWidth: 0,
    },
    sectionHeaderCompact: {
      alignItems: "flex-start",
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
      flexShrink: 1,
      flex: 1,
      gap: layout.compact ? 8 : 10,
    },
    sectionIcon: {
      width: layout.compact ? 30 : 34,
      height: layout.compact ? 30 : 34,
      borderRadius: layout.compact ? 10 : 12,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      fontSize: layout.compact ? 14 : 16,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.2,
      minWidth: 0,
      flexShrink: 1,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: layout.compact ? 10 : 12,
      paddingVertical: layout.compact ? 6 : 8,
      borderRadius: 20,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.primary + "44",
      minHeight: layout.ctaHeight - 8,
    },
    editButtonText: {
      fontSize: layout.compact ? 12 : 13,
      fontWeight: "700",
      color: colors.primaryLight,
      minWidth: 0,
      flexShrink: 1,
    },
    sectionContent: {
      padding: layout.cardPadding,
      gap: layout.compact ? 6 : 8,
    },
    infoRow: {
      flexDirection: "row",
      paddingVertical: layout.compact ? 10 : 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
      minWidth: 0,
    },
    infoIconWrapper: {
      width: layout.compact ? 34 : 38,
      height: layout.compact ? 34 : 38,
      borderRadius: layout.compact ? 10 : 12,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoContent: {
      flex: 1,
      justifyContent: "center",
      minWidth: 0,
      gap: 4,
    },
    infoLabel: {
      fontSize: layout.compact ? 10 : 11,
      fontWeight: "800",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      minWidth: 0,
      flexShrink: 1,
    },
    infoValue: {
      fontSize: layout.compact ? 13 : 14,
      fontWeight: "600",
      color: colors.text,
      minWidth: 0,
      flexShrink: 1,
    },
    tagsSection: {
      paddingVertical: layout.compact ? 12 : 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: layout.compact ? 4 : 6,
      gap: 10,
    },
    tagsSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    tagsIconWrapper: {
      width: layout.compact ? 26 : 28,
      height: layout.compact ? 26 : 28,
      borderRadius: 9,
      backgroundColor: colors.badgeWarning,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.warning + "44",
    },
    tagsTitle: {
      fontSize: layout.compact ? 13 : 14,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.2,
      minWidth: 0,
      flexShrink: 1,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.compact ? 8 : 10,
      minWidth: 0,
    },
    tagsPlaceholder: {
      fontSize: layout.compact ? 12 : 13,
      color: colors.textMuted,
      fontStyle: "italic",
      minWidth: 0,
      flexShrink: 1,
    },
    tagPill: {
      maxWidth: "100%",
      paddingHorizontal: layout.compact ? 10 : 12,
      paddingVertical: layout.compact ? 6 : 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary + "66",
      minHeight: layout.chipHeight,
      justifyContent: "center",
      minWidth: 0,
      flexShrink: 1,
    },
    tagText: {
      fontSize: layout.compact ? 12 : 13,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.1,
      minWidth: 0,
      flexShrink: 1,
    },
    socialSection: {
      paddingVertical: layout.compact ? 12 : 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: layout.compact ? 4 : 6,
      gap: 10,
    },
    socialLinksGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.compact ? 8 : 10,
      minWidth: 0,
    },
    socialLinkItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: layout.compact ? 10 : 12,
      paddingVertical: layout.compact ? 7 : 8,
      borderRadius: 12,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      minWidth: 0,
      flexShrink: 1,
      maxWidth: "100%",
    },
    socialLinkItemEmpty: {
      opacity: 0.55,
    },
    socialLinkIcon: {
      width: layout.compact ? 28 : 30,
      height: layout.compact ? 28 : 30,
      borderRadius: 9,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    socialLinkIconActive: {
      backgroundColor: colors.badgeInfo,
    },
    socialLinkLabel: {
      fontSize: layout.compact ? 12 : 13,
      fontWeight: "700",
      color: colors.textMuted,
      minWidth: 0,
      flexShrink: 1,
    },
    socialLinkLabelActive: {
      color: colors.text,
    },
  });
