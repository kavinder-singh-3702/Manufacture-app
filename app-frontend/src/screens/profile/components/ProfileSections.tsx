import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AuthUser } from "../../../types/auth";
import { useTheme } from "../../../hooks/useTheme";

type Props = {
  user: AuthUser | null | undefined;
  onEdit: (section: "identity" | "professional") => void;
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
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.surface + "ee", colors.surfaceElevated + "f2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.sectionCard, { borderColor: colors.border }]}
    >
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}> 
        <View style={styles.sectionTitleRow}>
          <LinearGradient colors={[colors.primary + "33", colors.primary + "22"]} style={styles.sectionIcon}>
            <Ionicons name={icon} size={18} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        </View>
        {onEdit ? (
          <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
            <LinearGradient colors={[colors.primary + "2e", colors.primary + "1c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.editButton, { borderColor: colors.primary + "55" }]}> 
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
              <Ionicons name="pencil" size={13} color={colors.primary} />
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
  verified,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  verified?: boolean;
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}> 
      <View style={[styles.infoIconWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
        <Ionicons name={icon} size={18} color={colors.textMuted} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <View style={styles.infoValueRow}>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
            {value || "Not provided"}
          </Text>
          {verified ? (
            <View style={[styles.verifiedTag, { backgroundColor: colors.success + "26", borderColor: colors.success + "4d" }]}> 
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const TagPill = ({ label }: { label: string }) => {
  const { colors } = useTheme();
  return (
    <LinearGradient colors={[colors.primary + "2e", colors.primary + "1c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.tagPill, { borderColor: colors.primary + "59" }]}> 
      <Text style={[styles.tagText, { color: colors.primaryLight }]}>{label}</Text>
    </LinearGradient>
  );
};

const FeaturedCard = ({
  icon,
  title,
  content,
  placeholder,
  gradientColors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  content?: string | null;
  placeholder: string;
  gradientColors: [string, string];
}) => {
  const { colors } = useTheme();
  const hasContent = !!content;

  return (
    <View style={styles.featuredCard}>
      <LinearGradient
        colors={hasContent ? gradientColors : [colors.surfaceElevated, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.featuredCardGradient, { borderColor: colors.border }]}
      >
        <View style={styles.featuredCardHeader}>
          <View style={[styles.featuredCardIcon, hasContent && { backgroundColor: "rgba(255,255,255,0.18)" }]}> 
            <Ionicons name={icon} size={16} color={hasContent ? "#FFFFFF" : colors.textMuted} />
          </View>
          <Text style={[styles.featuredCardTitle, { color: hasContent ? "#FFFFFF" : colors.textMuted }]}>{title}</Text>
        </View>
        <Text style={[styles.featuredCardContent, { color: hasContent ? "rgba(255,255,255,0.95)" : colors.textSecondary }, !hasContent && styles.featuredCardPlaceholder]} numberOfLines={3}>
          {content || placeholder}
        </Text>
      </LinearGradient>
    </View>
  );
};

export const ProfileSections = ({ user, onEdit }: Props) => {
  const { colors } = useTheme();
  const tags = (user?.activityTags as string[]) ?? [];

  const formatAddress = () => {
    if (!user?.address) return null;
    const parts = [
      user.address.line1,
      user.address.line2,
      user.address.city,
      user.address.state,
      user.address.postalCode,
      user.address.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  return (
    <View style={styles.container}>
      <SectionCard title="Personal Info" icon="person-outline" onEdit={() => onEdit("identity")}>
        <InfoRow icon="person" label="Full Name" value={fullName} />
        <InfoRow icon="at" label="Display Name" value={user?.displayName} />
        <InfoRow icon="mail" label="Email" value={user?.email} verified={!!user?.emailVerifiedAt} />
        <InfoRow icon="call" label="Phone" value={user?.phone} verified={!!user?.phoneVerifiedAt} />
        <InfoRow icon="location" label="Address" value={formatAddress()} />
      </SectionCard>

      <SectionCard title="Professional" icon="briefcase-outline" onEdit={() => onEdit("professional")}>
        <View style={styles.featuredCardsRow}>
          <FeaturedCard
            icon="business"
            title="Company"
            content={user?.companyAbout}
            placeholder="Share what your company does..."
            gradientColors={[colors.primary + "66", colors.primaryDark + "3d"]}
          />
          <FeaturedCard
            icon="person-circle"
            title="About Me"
            content={user?.bio}
            placeholder="Tell your story..."
            gradientColors={[colors.accent + "5c", colors.primary + "33"]}
          />
        </View>

        <View style={[styles.tagsSection, { borderTopColor: colors.border }]}> 
          <View style={styles.tagsSectionHeader}>
            <View style={[styles.tagsIconWrapper, { backgroundColor: colors.warning + "26", borderColor: colors.warning + "4d" }]}> 
              <Ionicons name="sparkles" size={16} color={colors.warning} />
            </View>
            <Text style={[styles.tagsTitle, { color: colors.text }]}>Interests & Skills</Text>
          </View>
          {tags.length > 0 ? (
            <View style={styles.tagsContainer}>{tags.map((tag) => <TagPill key={tag} label={tag} />)}</View>
          ) : (
            <Text style={[styles.tagsPlaceholder, { color: colors.textMuted }]}>Add tags to highlight your expertise</Text>
          )}
        </View>
      </SectionCard>
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
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  infoValueRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "700",
  },
  featuredCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  featuredCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  featuredCardGradient: {
    padding: 14,
    minHeight: 115,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
  },
  featuredCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featuredCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  featuredCardTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  featuredCardContent: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  featuredCardPlaceholder: {
    fontStyle: "italic",
    fontSize: 12,
  },
  tagsSection: {
    paddingVertical: 18,
    borderTopWidth: 1,
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagsPlaceholder: {
    fontSize: 13,
    fontStyle: "italic",
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
