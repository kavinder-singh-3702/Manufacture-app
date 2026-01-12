import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Company } from "../../../types/company";
import { CompanyEditorSection } from "./types";

type Props = {
  company: Company;
  onEdit?: (section: Exclude<CompanyEditorSection, null>) => void;
  formatAddress: (company?: Company | null) => string | null;
  formatCategories: (company?: Company | null) => string;
};

const SectionCard = ({
  title,
  icon,
  children,
  onEdit,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  onEdit?: () => void;
}) => {
  return (
    <LinearGradient
      colors={["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.sectionCard}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.2)", "rgba(99, 102, 241, 0.15)"]}
            style={styles.sectionIcon}
          >
            <Ionicons name={icon} size={18} color="#A78BFA" />
          </LinearGradient>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.18)", "rgba(99, 102, 241, 0.12)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit</Text>
              <Ionicons name="pencil" size={13} color="#A78BFA" />
            </LinearGradient>
          </TouchableOpacity>
        )}
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
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrapper}>
        <Ionicons name={icon} size={18} color="rgba(255, 255, 255, 0.4)" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value || "Not provided"}
        </Text>
      </View>
    </View>
  );
};

const TagPill = ({ label }: { label: string }) => (
  <LinearGradient
    colors={["rgba(139, 92, 246, 0.2)", "rgba(99, 102, 241, 0.15)"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.tagPill}
  >
    <Text style={styles.tagText}>{label}</Text>
  </LinearGradient>
);

export const CompanySections = ({ company, onEdit, formatAddress, formatCategories }: Props) => {
  const categories = company.categories || [];

  return (
    <View style={styles.container}>
      {/* Company Overview Section */}
      <SectionCard title="Company Overview" icon="business-outline" onEdit={onEdit ? () => onEdit("overview") : undefined}>
        <InfoRow icon="text" label="Display Name" value={company.displayName} />
        <InfoRow icon="document-text" label="Legal Name" value={company.legalName} />
        <InfoRow icon="pricetag" label="Type" value={company.type} />
        <InfoRow icon="information-circle" label="Description" value={company.description} />

        {/* Categories Tags */}
        <View style={styles.tagsSection}>
          <View style={styles.tagsSectionHeader}>
            <View style={styles.tagsIconWrapper}>
              <Ionicons name="grid" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.tagsTitle}>Categories</Text>
          </View>
          {categories.length > 0 ? (
            <View style={styles.tagsContainer}>
              {categories.map((cat) => (
                <TagPill key={cat} label={cat} />
              ))}
            </View>
          ) : (
            <Text style={styles.tagsPlaceholder}>Add categories to help buyers discover you</Text>
          )}
        </View>
      </SectionCard>

      {/* Contact & Presence Section */}
      <SectionCard title="Contact & Presence" icon="call-outline" onEdit={onEdit ? () => onEdit("contact") : undefined}>
        <InfoRow icon="mail" label="Email" value={company.contact?.email} />
        <InfoRow icon="call" label="Phone" value={company.contact?.phone} />
        <InfoRow icon="globe" label="Website" value={company.contact?.website} />

        {/* Social Links */}
        <View style={styles.socialSection}>
          <View style={styles.tagsSectionHeader}>
            <View style={[styles.tagsIconWrapper, { backgroundColor: "rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.2)" }]}>
              <Ionicons name="share-social" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.tagsTitle}>Social Links</Text>
          </View>
          <View style={styles.socialLinksGrid}>
            <SocialLink icon="logo-linkedin" label="LinkedIn" value={company.socialLinks?.linkedin} />
            <SocialLink icon="logo-twitter" label="Twitter" value={company.socialLinks?.twitter} />
            <SocialLink icon="logo-instagram" label="Instagram" value={company.socialLinks?.instagram} />
            <SocialLink icon="logo-youtube" label="YouTube" value={company.socialLinks?.youtube} />
          </View>
        </View>
      </SectionCard>

      {/* Headquarters Section */}
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

const SocialLink = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) => {
  const hasValue = Boolean(value);
  return (
    <View style={[styles.socialLinkItem, !hasValue && styles.socialLinkItemEmpty]}>
      <View style={[styles.socialLinkIcon, hasValue && styles.socialLinkIconActive]}>
        <Ionicons name={icon} size={18} color={hasValue ? "#FAFAFA" : "rgba(255, 255, 255, 0.3)"} />
      </View>
      <Text style={[styles.socialLinkLabel, hasValue && styles.socialLinkLabelActive]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
    marginTop: 8,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: -0.3,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A78BFA",
  },
  sectionContent: {
    padding: 16,
  },
  // Info Row Styles
  infoRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  infoIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FAFAFA",
  },
  // Tags Section
  tagsSection: {
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    marginTop: 8,
  },
  tagsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  tagsIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: -0.2,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagsPlaceholder: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.35)",
    fontStyle: "italic",
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.35)",
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C4B5FD",
    letterSpacing: 0.2,
  },
  // Social Section
  socialSection: {
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    marginTop: 8,
  },
  socialLinksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  socialLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 8,
  },
  socialLinkItemEmpty: {
    opacity: 0.5,
  },
  socialLinkIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  socialLinkIconActive: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  socialLinkLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.4)",
  },
  socialLinkLabelActive: {
    color: "#FAFAFA",
  },
});
