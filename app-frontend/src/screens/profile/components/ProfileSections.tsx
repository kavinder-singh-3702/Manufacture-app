import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AuthUser } from "../../../types/auth";

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
  verified,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  verified?: boolean;
  onPress?: () => void;
}) => {
  const content = (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrapper}>
        <Ionicons name={icon} size={18} color="rgba(255, 255, 255, 0.4)" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.infoValueRow}>
          <Text style={[styles.infoValue, onPress && styles.infoValueLink]} numberOfLines={2}>
            {value || "Not provided"}
          </Text>
          {verified && (
            <View style={styles.verifiedTag}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress && value) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
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

// Featured card for Company About and Bio
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
  const hasContent = !!content;

  return (
    <View style={styles.featuredCard}>
      <LinearGradient
        colors={hasContent ? gradientColors : ["rgba(255,255,255,0.03)", "rgba(255,255,255,0.01)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featuredCardGradient}
      >
        <View style={styles.featuredCardHeader}>
          <View style={[styles.featuredCardIcon, hasContent && { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Ionicons name={icon} size={16} color={hasContent ? "#FFFFFF" : "rgba(255,255,255,0.4)"} />
          </View>
          <Text style={[styles.featuredCardTitle, hasContent && { color: "#FFFFFF" }]}>{title}</Text>
        </View>
        <Text style={[styles.featuredCardContent, !hasContent && styles.featuredCardPlaceholder]} numberOfLines={3}>
          {content || placeholder}
        </Text>
        {hasContent && (
          <View style={styles.featuredCardQuote}>
            <Ionicons name="chatbox-ellipses" size={18} color="rgba(255,255,255,0.1)" />
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

export const ProfileSections = ({ user, onEdit }: Props) => {
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
      {/* Identity & Contact Section */}
      <SectionCard title="Personal Info" icon="person-outline" onEdit={() => onEdit("identity")}>
        <InfoRow icon="person" label="Full Name" value={fullName} />
        <InfoRow icon="at" label="Display Name" value={user?.displayName} />
        <InfoRow icon="mail" label="Email" value={user?.email} verified={!!user?.emailVerifiedAt} />
        <InfoRow icon="call" label="Phone" value={user?.phone} verified={!!user?.phoneVerifiedAt} />
        <InfoRow icon="location" label="Address" value={formatAddress()} />
      </SectionCard>

      {/* Professional Section - Redesigned */}
      <SectionCard title="Professional" icon="briefcase-outline" onEdit={() => onEdit("professional")}>
        {/* Featured Cards Row */}
        <View style={styles.featuredCardsRow}>
          <FeaturedCard
            icon="business"
            title="Company"
            content={user?.companyAbout}
            placeholder="Share what your company does..."
            gradientColors={["rgba(99, 102, 241, 0.25)", "rgba(139, 92, 246, 0.15)"]}
          />
          <FeaturedCard
            icon="person-circle"
            title="About Me"
            content={user?.bio}
            placeholder="Tell your story..."
            gradientColors={["rgba(236, 72, 153, 0.2)", "rgba(168, 85, 247, 0.15)"]}
          />
        </View>

        {/* Activity Tags */}
        <View style={styles.tagsSection}>
          <View style={styles.tagsSectionHeader}>
            <View style={styles.tagsIconWrapper}>
              <Ionicons name="sparkles" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.tagsTitle}>Interests & Skills</Text>
          </View>
          {tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TagPill key={tag} label={tag} />
              ))}
            </View>
          ) : (
            <Text style={styles.tagsPlaceholder}>Add tags to highlight your expertise</Text>
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
  infoValueRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FAFAFA",
  },
  infoValueLink: {
    color: "#A78BFA",
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#34D399",
  },
  // Featured Cards
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
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  featuredCardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.55)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  featuredCardContent: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  featuredCardPlaceholder: {
    color: "rgba(255, 255, 255, 0.3)",
    fontStyle: "italic",
    fontSize: 12,
  },
  featuredCardQuote: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  // Tags Section
  tagsSection: {
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
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
});
