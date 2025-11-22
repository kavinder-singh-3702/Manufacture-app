import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/user.service";
import { UpdateUserPayload, AuthUser } from "../../types/auth";
import { RootStackParamList } from "../../navigation/types";
import { ProfileHero } from "./components/ProfileHero";
import { ProfileSections } from "./components/ProfileSections";
import { FormField, SwitchRow } from "./components/ProfileForm";
import { ProfileEditorModal } from "./components/ProfileEditorModal";
import { EditorType } from "./types";

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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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

  const avatarUrl = typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;

  const avatarInitials = useMemo(() => {
    const source = fullName !== "Unnamed operator" ? fullName : user?.email ?? "NA";
    const parts = source
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return "NA";
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [fullName, user?.email]);

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

  const handleUploadAvatar = async () => {
    try {
      setAvatarError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets?.[0];
      if (!file) {
        setAvatarError("Unable to read that file. Please try another image.");
        return;
      }

      if (file.size && file.size > 5 * 1024 * 1024) {
        setAvatarError("Please choose an image smaller than 5 MB.");
        return;
      }

      if (file.mimeType && !file.mimeType.startsWith("image/")) {
        setAvatarError("Please choose an image file (JPG or PNG).");
        return;
      }

      setAvatarUploading(true);
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });

      const response = await userService.uploadUserFile({
        fileName: file.name ?? "avatar.jpg",
        mimeType: file.mimeType ?? "image/jpeg",
        content: base64,
        purpose: "avatar",
      });

      const uploadedUrl = response.file?.url ?? undefined;
      setUser((prev) => (prev ? { ...prev, avatarUrl: uploadedUrl ?? prev.avatarUrl } : prev));
      setBanner({ type: "success", message: "Profile photo updated." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload photo";
      setAvatarError(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <ProfileHero
          fullName={fullName}
          email={user?.email}
          avatarUrl={avatarUrl}
          avatarInitials={avatarInitials}
          role={user?.role}
          accountType={user?.accountType}
          onUploadAvatar={handleUploadAvatar}
          uploading={avatarUploading}
        />
      </View>
      {avatarError ? <Text style={[styles.errorText, { marginHorizontal: spacing.lg }]}>{avatarError}</Text> : null}
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
        <ProfileSections
          user={user}
          tags={tags}
          commsPrefs={commsPrefs}
          activeCompanyCount={activeCompanyCount}
          onEdit={openEditor}
        />
      </ScrollView>

      <ProfileEditorModal
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
      </ProfileEditorModal>

      <ProfileEditorModal
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
      </ProfileEditorModal>

      <ProfileEditorModal
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
      </ProfileEditorModal>
    </SafeAreaView>
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
  banner: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
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
