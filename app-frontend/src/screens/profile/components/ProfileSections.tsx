import { Linking, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { ProfileSection } from "./ProfileSection";
import { ProfileField } from "./ProfileField";
import { StatusPill, TagList } from "./ProfileForm";
import { AuthUser } from "../../../types/auth";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Not captured";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const MetricCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginTop: spacing.xs }}>{value}</Text>
      {helper ? (
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: spacing.xs }} numberOfLines={2}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
};

type Props = {
  user: AuthUser | null | undefined;
  tags: string[];
  commsPrefs: Record<string, boolean>;
  activeCompanyCount: number;
  onEdit: (section: "identity" | "professional" | "preferences") => void;
};

const Link = ({ label, url }: { label: string; url?: string | null }) => {
  const { colors } = useTheme();
  if (!url) {
    return <Text style={{ color: colors.muted }}>Not provided</Text>;
  }
  const handlePress = () => {
    Linking.openURL(url).catch(() => null);
  };
  return (
    <TouchableOpacity onPress={handlePress}>
      <Text style={{ color: colors.primary, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
};

export const ProfileSections = ({ user, tags, commsPrefs, activeCompanyCount, onEdit }: Props) => {
  const { colors } = useTheme();

  return (
    <>
      <View style={{ marginBottom: 24 }}>
        <ProfileSection title="Account Highlights" description="Snapshot of access level and engagement.">
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <MetricCard label="Workspace Role" value={user?.role ?? "user"} helper="Controls what features you see" />
            </View>
            <View style={{ flex: 1 }}>
              <MetricCard label="Companies" value={activeCompanyCount} helper="Organizations you own or collaborate with" />
            </View>
          </View>
        </ProfileSection>
      </View>

      <View style={{ marginBottom: 24 }}>
        <ProfileSection
          title="Identity & Contact"
          description="Primary handles we use to reach you."
          actionLabel="Edit"
          onAction={() => onEdit("identity")}
        >
          <ProfileField label="Legal Name" value={user?.firstName || user?.lastName ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() : "Unnamed operator"} helperText="Used for agreements and invoicing." />
          <ProfileField label="Display Name" value={user?.displayName} helperText="Shown across collaboration surfaces." />
          <ProfileField label="Username" value={user?.username} helperText="Your unique handle across the network." />
          <ProfileField
            label="Primary Email"
            value={`${user?.email ?? "Not provided"}`}
            helperText={user?.emailVerifiedAt ? `Verified ${formatDate(user.emailVerifiedAt)}` : "Waiting for verification"}
          />
          <ProfileField
            label="Secondary Emails"
            value={
              Array.isArray(user?.secondaryEmails) && user.secondaryEmails.length ? (
                <TagList items={user.secondaryEmails} />
              ) : undefined
            }
            helperText="Backup addresses we can escalate to."
          />
          <ProfileField
            label="Phone"
            value={user?.phone}
            helperText={user?.phoneVerifiedAt ? `Verified ${formatDate(user.phoneVerifiedAt)}` : "SMS delivery pending verification"}
          />
          <ProfileField
            label="Address"
            value={
              user?.address ? (
                <Text style={{ color: colors.text }}>
                  {[user.address.line1, user.address.line2, user.address.city, user.address.state, user.address.postalCode, user.address.country]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              ) : undefined
            }
          />
        </ProfileSection>
      </View>

      <View style={{ marginBottom: 24 }}>
        <ProfileSection
          title="Professional Footprint"
          description="How you engage with partner organizations."
          actionLabel="Edit"
          onAction={() => onEdit("professional")}
        >
          <ProfileField label="Account Type" value={user?.accountType} helperText="Drives workspace defaults and workflows." />
          <ProfileField
            label="Active Company"
            value={user?.activeCompany ? String(user.activeCompany) : undefined}
            helperText="Switch inside the workspace to change context."
          />
          <ProfileField
            label="Activity Tags"
            value={tags.length ? <TagList items={tags} /> : undefined}
            helperText="Smart segmentation used for betas and rollouts."
          />
          <ProfileField
            label="Social Links"
            value={
              user?.socialLinks ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  <View style={{ marginRight: 12, marginBottom: 6 }}>
                    <Link label="Website" url={user.socialLinks.website} />
                  </View>
                  <View style={{ marginRight: 12, marginBottom: 6 }}>
                    <Link label="LinkedIn" url={user.socialLinks.linkedin} />
                  </View>
                  <View style={{ marginRight: 12, marginBottom: 6 }}>
                    <Link label="Twitter" url={user.socialLinks.twitter} />
                  </View>
                  <View style={{ marginRight: 12, marginBottom: 6 }}>
                    <Link label="GitHub" url={user.socialLinks.github} />
                  </View>
                </View>
              ) : undefined
            }
          />
          <ProfileField label="Bio" value={user?.bio} />
        </ProfileSection>
      </View>

      <View style={{ marginBottom: 24 }}>
        <ProfileSection
          title="Preferences & Notifications"
          description="Control how we personalize and alert."
          actionLabel="Edit"
          onAction={() => onEdit("preferences")}
        >
          <ProfileField label="Locale" value={user?.preferences?.locale} />
          <ProfileField label="Timezone" value={user?.preferences?.timezone} />
          <ProfileField label="Theme" value={user?.preferences?.theme} helperText="Syncs across devices." />
          <ProfileField
            label="Notification Delivery"
            value={
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {(["email", "sms", "push"] as const).map((key) => (
                  <StatusPill
                    key={key}
                    style={{ marginRight: 8, marginBottom: 8 }}
                    label={`${key.toUpperCase()}: ${commsPrefs[key] ? "On" : "Off"}`}
                    tone={commsPrefs[key] ? "success" : "default"}
                  />
                ))}
              </View>
            }
          />
        </ProfileSection>
      </View>
    </>
  );
};
