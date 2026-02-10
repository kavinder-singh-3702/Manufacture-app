import { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { PersonalizedOffer } from "../../../services/preference.service";
import { CampaignStatusBadge } from "./CampaignStatusBadge";

type CampaignCardProps = {
  campaign: PersonalizedOffer;
  updating?: boolean;
  onPublish?: () => void;
  onPause?: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
  onPreview?: () => void;
};

const toDisplayUser = (campaign: PersonalizedOffer) => {
  if (!campaign.user) return "Unknown user";
  if (typeof campaign.user === "string") return campaign.user;
  return campaign.user.displayName || campaign.user.email || campaign.user.id;
};

const toDisplayContact = (campaign: PersonalizedOffer) => {
  const name = campaign.contact?.adminName;
  if (name) return name;
  if (typeof campaign.createdBy !== "string") {
    return campaign.createdBy?.displayName || campaign.createdBy?.email || "Admin";
  }
  return "Admin";
};

export const CampaignCard = memo(
  ({ campaign, updating, onPublish, onPause, onArchive, onDuplicate, onPreview }: CampaignCardProps) => {
    const { colors, spacing, radius } = useTheme();
    const cta = campaign.creative?.ctaLabel || (campaign.contentType === "service" ? "Open service request" : "View offer");
    const status = campaign.status || "draft";

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.md,
          },
        ]}
      >
        <View style={styles.topRow}>
          <CampaignStatusBadge status={status} />
          <Text style={[styles.contentType, { color: colors.textMuted }]}>
            {(campaign.contentType || "product").toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {campaign.creative?.headline || campaign.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
          {campaign.creative?.subheadline || campaign.message || "No subheadline"}
        </Text>

        <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Target: {toDisplayUser(campaign)}</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Contact: {toDisplayContact(campaign)}</Text>
        </View>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>CTA: {cta}</Text>

        <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
          {status !== "active" ? (
            <ActionButton label="Publish" icon="rocket-outline" onPress={onPublish} colors={colors} />
          ) : (
            <ActionButton label="Pause" icon="pause-outline" onPress={onPause} colors={colors} />
          )}
          <ActionButton label="Archive" icon="archive-outline" onPress={onArchive} colors={colors} />
          <ActionButton label="Duplicate" icon="copy-outline" onPress={onDuplicate} colors={colors} />
          <ActionButton label="Preview" icon="eye-outline" onPress={onPreview} colors={colors} />
        </View>

        {updating ? <Text style={[styles.updatingLabel, { color: colors.textMuted }]}>Updating campaign...</Text> : null}
      </View>
    );
  }
);

type ActionButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
};

const ActionButton = ({ label, icon, onPress, colors }: ActionButtonProps) => (
  <TouchableOpacity
    activeOpacity={0.82}
    onPress={onPress}
    style={[styles.actionButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
  >
    <Ionicons name={icon} size={14} color={colors.textSecondary} />
    <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contentType: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  updatingLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
});
