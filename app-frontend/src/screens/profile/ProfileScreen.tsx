import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { ProfileSection } from "./components/ProfileSection";
import { ProfileField } from "./components/ProfileField";
import { userService } from "../../services/user.service";
import { UpdateUserPayload, AuthUser } from "../../types/auth";
import { RootStackParamList } from "../../navigation/types";

type EditorType = "identity" | "professional" | "preferences" | null;

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Not captured";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const StatusPill = ({
  label,
  tone = "default",
  style,
}: {
  label: string;
  tone?: "default" | "success" | "warning";
  style?: StyleProp<ViewStyle>;
}) => {
  const { colors, spacing } = useTheme();
  const background =
    tone === "success" ? "rgba(16, 185, 129, 0.12)" : tone === "warning" ? "rgba(249, 115, 22, 0.12)" : colors.background;
  const textColor = tone === "success" ? "#059669" : tone === "warning" ? "#EA580C" : colors.text;

  return (
    <View
      style={[
        {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: 999,
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: textColor }}>{label}</Text>
    </View>
  );
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

export const ProfileScreen = () => {
  const { colors, spacing } = useTheme();
  const { user, setUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeEditor, setActiveEditor] = useState<EditorType>(null);
  const [identityForm, setIdentityForm] = useState(createIdentityFormState(user));
  const [professionalForm, setProfessionalForm] = useState(createProfessionalFormState(user));
  const [preferencesForm, setPreferencesForm] = useState(createPreferencesFormState(user));
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setIdentityForm(createIdentityFormState(user));
    setProfessionalForm(createProfessionalFormState(user));
    setPreferencesForm(createPreferencesFormState(user));
  }, [user]);

  const fullName = useMemo(() => {
    const segments = [user?.firstName, user?.lastName].filter(Boolean);
    if (segments.length) return segments.join(" ");
    if (typeof user?.displayName === "string") return user.displayName;
    return "Unnamed operator";
  }, [user]);

  const activeCompanyCount = Array.isArray(user?.companies) ? user?.companies.length : 0;
  const tags = (user?.activityTags as string[]) ?? [];
  const commsPrefs = (user?.preferences?.communications as Record<string, boolean>) ?? {};

  const openEditor = (type: EditorType) => {
    setActiveEditor(type);
    setEditorError(null);
  };

  const closeEditor = () => {
    setActiveEditor(null);
    setEditorError(null);
  };

  const submitUpdate = async (payload: UpdateUserPayload) => {
    try {
      setSaving(true);
      setEditorError(null);
      const { user: updatedUser } = await userService.updateCurrentUser(payload);
      setUser(updatedUser);
      setBanner({ type: "success", message: "Profile updated successfully." });
      closeEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update profile";
      setEditorError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIdentity = () => {
    const payload: UpdateUserPayload = {
      firstName: identityForm.firstName.trim() || undefined,
      lastName: identityForm.lastName.trim() || undefined,
      displayName: identityForm.displayName.trim() || undefined,
      phone: identityForm.phone.trim() || undefined,
    };

    const address = buildAddressPayload(identityForm);
    if (address) {
      payload.address = address;
    }

    submitUpdate(payload);
  };

  const handleSaveProfessional = () => {
    const activityTags = professionalForm.activityTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length);

    const payload: UpdateUserPayload = {
      bio: professionalForm.bio.trim() || undefined,
      socialLinks: cleanObject({
        website: professionalForm.website.trim() || undefined,
        linkedin: professionalForm.linkedin.trim() || undefined,
        twitter: professionalForm.twitter.trim() || undefined,
        github: professionalForm.github.trim() || undefined,
      }),
      activityTags,
    };

    submitUpdate(payload);
  };

  const handleSavePreferences = () => {
    const payload: UpdateUserPayload = {
      preferences: {
        locale: preferencesForm.locale.trim() || undefined,
        timezone: preferencesForm.timezone.trim() || undefined,
        theme: preferencesForm.theme,
        communications: {
          email: preferencesForm.email,
          sms: preferencesForm.sms,
          push: preferencesForm.push,
        },
      },
    };

    submitUpdate(payload);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{fullName}</Text>
          <Text style={{ color: colors.muted }}>{user?.email}</Text>
          <View style={styles.pillRow}>
            {user?.role ? <StatusPill label={user.role.toUpperCase()} style={styles.pillSpacing} /> : null}
            {user?.status ? (
              <StatusPill
                style={styles.pillSpacing}
                label={user.status}
                tone={user.status === "active" ? "success" : user.status === "suspended" ? "warning" : "default"}
              />
            ) : null}
            {user?.accountType ? <StatusPill label={user.accountType} style={styles.pillSpacing} /> : null}
          </View>
        </View>
      </View>
      {banner ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: banner.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(248, 113, 113, 0.12)",
              borderColor: banner.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(248, 113, 113, 0.4)",
            },
          ]}
        >
          <Text
            style={{
              color: banner.type === "success" ? "#059669" : "#B91C1C",
              fontWeight: "600",
            }}
          >
            {banner.message}
          </Text>
        </View>
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
      >
        <View style={styles.sectionSpacing}>
          <ProfileSection title="Account Highlights" description="Snapshot of access level and engagement.">
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <MetricCard label="Workspace Role" value={user?.role ?? "user"} helper="Controls what features you see" />
              </View>
              <View style={[styles.metricItem, styles.metricItemLast]}>
                <MetricCard
                  label="Companies"
                  value={activeCompanyCount}
                  helper="Organizations you own or collaborate with"
                />
              </View>
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <MetricCard
                  label="Last Login"
                  value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "—"}
                  helper={user?.lastLoginIp ? `From ${user.lastLoginIp}` : undefined}
                />
              </View>
              <View style={[styles.metricItem, styles.metricItemLast]}>
                <MetricCard
                  label="Onboarding"
                  value={user?.onboardingCompletedAt ? "Completed" : "Pending"}
                  helper={user?.onboardingCompletedAt ? formatDate(user.onboardingCompletedAt) : "Finish guided setup"}
                />
              </View>
            </View>
          </ProfileSection>
        </View>

        <View style={styles.sectionSpacing}>
          <ProfileSection
            title="Identity & Contact"
            description="Primary handles we use to reach you."
            actionLabel="Edit"
            onAction={() => openEditor("identity")}
          >
            <ProfileField label="Legal Name" value={fullName} helperText="Used for agreements and invoicing." />
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

        <View style={styles.sectionSpacing}>
          <ProfileSection
            title="Professional Footprint"
            description="How you engage with partner organizations."
            actionLabel="Edit"
            onAction={() => openEditor("professional")}
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
                  <View style={styles.linkRow}>
                    <View style={styles.linkItem}>
                      <Link label="Website" url={user.socialLinks.website} />
                    </View>
                    <View style={styles.linkItem}>
                      <Link label="LinkedIn" url={user.socialLinks.linkedin} />
                    </View>
                    <View style={styles.linkItem}>
                      <Link label="Twitter" url={user.socialLinks.twitter} />
                    </View>
                    <View style={styles.linkItem}>
                      <Link label="GitHub" url={user.socialLinks.github} />
                    </View>
                  </View>
                ) : undefined
              }
            />
            <ProfileField label="Bio" value={user?.bio} />
          </ProfileSection>
        </View>

        <View style={styles.sectionSpacing}>
          <ProfileSection
            title="Preferences & Notifications"
            description="Control how we personalize and alert."
            actionLabel="Edit"
            onAction={() => openEditor("preferences")}
          >
            <ProfileField label="Locale" value={user?.preferences?.locale} />
            <ProfileField label="Timezone" value={user?.preferences?.timezone} />
            <ProfileField label="Theme" value={user?.preferences?.theme} helperText="Syncs across devices." />
            <ProfileField
              label="Notification Delivery"
              value={
                <View style={styles.tagWrap}>
                  {(["email", "sms", "push"] as const).map((key) => (
                    <StatusPill
                      key={key}
                      style={styles.tagItem}
                      label={`${key.toUpperCase()}: ${commsPrefs[key] ? "On" : "Off"}`}
                      tone={commsPrefs[key] ? "success" : "default"}
                    />
                  ))}
                </View>
              }
            />
          </ProfileSection>
        </View>
      </ScrollView>

      <EditorModal
        title="Edit identity"
        visible={activeEditor === "identity"}
        onClose={closeEditor}
        onSubmit={handleSaveIdentity}
        saving={saving}
        error={editorError}
      >
        <FormField label="First name" value={identityForm.firstName} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, firstName: value }))} />
        <FormField label="Last name" value={identityForm.lastName} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, lastName: value }))} />
        <FormField label="Display name" value={identityForm.displayName} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, displayName: value }))} />
        <FormField label="Phone" value={identityForm.phone} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, phone: value }))} keyboardType="phone-pad" />
        <FormField label="Address line 1" value={identityForm.line1} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, line1: value }))} />
        <FormField label="Address line 2" value={identityForm.line2} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, line2: value }))} />
        <FormField label="City" value={identityForm.city} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, city: value }))} />
        <FormField label="State" value={identityForm.state} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, state: value }))} />
        <FormField label="Postal code" value={identityForm.postalCode} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, postalCode: value }))} keyboardType="numbers-and-punctuation" />
        <FormField label="Country" value={identityForm.country} onChangeText={(value) => setIdentityForm((prev) => ({ ...prev, country: value }))} />
      </EditorModal>

      <EditorModal
        title="Edit professional details"
        visible={activeEditor === "professional"}
        onClose={closeEditor}
        onSubmit={handleSaveProfessional}
        saving={saving}
        error={editorError}
      >
        <FormField
          label="Bio"
          value={professionalForm.bio}
          onChangeText={(value) => setProfessionalForm((prev) => ({ ...prev, bio: value }))}
          multiline
          numberOfLines={4}
        />
        <FormField label="Website" value={professionalForm.website} onChangeText={(value) => setProfessionalForm((prev) => ({ ...prev, website: value }))} />
        <FormField label="LinkedIn" value={professionalForm.linkedin} onChangeText={(value) => setProfessionalForm((prev) => ({ ...prev, linkedin: value }))} />
        <FormField label="Twitter" value={professionalForm.twitter} onChangeText={(value) => setProfessionalForm((prev) => ({ ...prev, twitter: value }))} />
        <FormField label="GitHub" value={professionalForm.github} onChangeText={(value) => setProfessionalForm((prev) => ({ ...prev, github: value }))} />
        <FormField
          label="Activity tags"
          helperText="Separate with commas"
          value={professionalForm.activityTags}
          onChangeText={(value) => setProfessionalForm((prev) => ({ ...prev, activityTags: value }))}
        />
      </EditorModal>

      <EditorModal
        title="Edit preferences"
        visible={activeEditor === "preferences"}
        onClose={closeEditor}
        onSubmit={handleSavePreferences}
        saving={saving}
        error={editorError}
      >
        <FormField label="Locale" value={preferencesForm.locale} onChangeText={(value) => setPreferencesForm((prev) => ({ ...prev, locale: value }))} />
        <FormField label="Timezone" value={preferencesForm.timezone} onChangeText={(value) => setPreferencesForm((prev) => ({ ...prev, timezone: value }))} />
        <View style={styles.segmentLabelRow}>
          <Text style={styles.formLabel}>Theme</Text>
          <View style={styles.segmentRow}>
            {(["system", "light", "dark"] as const).map((option) => {
              const isActive = preferencesForm.theme === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentButton, isActive ? styles.segmentButtonActive : null]}
                  onPress={() => setPreferencesForm((prev) => ({ ...prev, theme: option }))}
                >
                  <Text style={[styles.segmentButtonText, { color: isActive ? "#fff" : colors.text }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.toggleList}>
          <SwitchRow
            label="Email notifications"
            value={preferencesForm.email}
            onValueChange={(value) => setPreferencesForm((prev) => ({ ...prev, email: value }))}
          />
          <SwitchRow
            label="SMS alerts"
            value={preferencesForm.sms}
            onValueChange={(value) => setPreferencesForm((prev) => ({ ...prev, sms: value }))}
          />
          <SwitchRow
            label="Push notifications"
            value={preferencesForm.push}
            onValueChange={(value) => setPreferencesForm((prev) => ({ ...prev, push: value }))}
          />
        </View>
      </EditorModal>
    </SafeAreaView>
  );
};

 const EditorModal = ({
  title,
  visible,
  onClose,
  onSubmit,
  saving,
  children,
  error,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  children: ReactNode;
  error?: string | null;
}) => {
  const { colors, spacing } = useTheme();
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            {children}
            {error ? (
              <Text style={[styles.errorText, { marginTop: spacing.md }]}>{error}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: spacing.lg, opacity: saving ? 0.7 : 1 }]}
              onPress={onSubmit}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

 const FormField = ({
  label,
  value,
  onChangeText,
  helperText,
  multiline,
  numberOfLines,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helperText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad" | "numbers-and-punctuation";
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        style={[styles.formInput, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9CA3AF"
      />
      {helperText ? <Text style={styles.formHelper}>{helperText}</Text> : null}
    </View>
  );
};

 const SwitchRow = ({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
};

 const TagList = ({ items }: { items: string[] }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.tagWrap}>
      {items.map((item) => (
        <View key={item} style={[styles.tag, { borderColor: colors.border }] }>
          <Text style={{ fontWeight: "600", color: colors.text }}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

 type IdentityFormState = ReturnType<typeof createIdentityFormState>;
 type ProfessionalFormState = ReturnType<typeof createProfessionalFormState>;
 type PreferencesFormState = ReturnType<typeof createPreferencesFormState>;

 const createIdentityFormState = (user?: AuthUser | null) => ({
  firstName: user?.firstName ?? "",
  lastName: user?.lastName ?? "",
  displayName: user?.displayName ?? "",
  phone: user?.phone ?? "",
  line1: user?.address?.line1 ?? "",
  line2: user?.address?.line2 ?? "",
  city: user?.address?.city ?? "",
  state: user?.address?.state ?? "",
  postalCode: user?.address?.postalCode ?? "",
  country: user?.address?.country ?? "",
});

 const createProfessionalFormState = (user?: AuthUser | null) => ({
  bio: user?.bio ?? "",
  website: user?.socialLinks?.website ?? "",
  linkedin: user?.socialLinks?.linkedin ?? "",
  twitter: user?.socialLinks?.twitter ?? "",
  github: user?.socialLinks?.github ?? "",
  activityTags: Array.isArray(user?.activityTags) ? user?.activityTags.join(", ") : "",
});

 const createPreferencesFormState = (user?: AuthUser | null) => ({
  locale: user?.preferences?.locale ?? "",
  timezone: user?.preferences?.timezone ?? "",
  theme: (user?.preferences?.theme as "system" | "light" | "dark" | undefined) ?? "system",
  email: Boolean(user?.preferences?.communications?.email ?? true),
  sms: Boolean(user?.preferences?.communications?.sms ?? false),
  push: Boolean(user?.preferences?.communications?.push ?? true),
});

 const buildAddressPayload = (form: IdentityFormState) => {
  const payload = cleanObject({
    line1: form.line1.trim() || undefined,
    line2: form.line2.trim() || undefined,
    city: form.city.trim() || undefined,
    state: form.state.trim() || undefined,
    postalCode: form.postalCode.trim() || undefined,
    country: form.country.trim() || undefined,
  });

  return Object.keys(payload).length ? payload : undefined;
};

const cleanObject = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === "") {
      return acc;
    }
    (acc as any)[key] = value;
    return acc;
  }, {} as Partial<T>);
};

 const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "600",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  pillSpacing: {
    marginRight: 8,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    marginRight: 12,
  },
  metricItemLast: {
    marginRight: 0,
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  linkItem: {
    marginRight: 12,
    marginBottom: 6,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  sectionSpacing: {
    marginBottom: 24,
  },
  banner: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  formHelper: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  modalClose: {
    marginRight: 12,
  },
  modalCloseText: {
    fontWeight: "600",
    color: "#6B7280",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#000",
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 8,
  },
  segmentLabelRow: {
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 999,
  },
  segmentButtonActive: {
    backgroundColor: "#111",
  },
  segmentButtonText: {
    textTransform: "capitalize",
    fontWeight: "600",
  },
  toggleList: {
    marginTop: 8,
  },
});
