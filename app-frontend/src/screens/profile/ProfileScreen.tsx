import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/user.service";
import { UpdateUserPayload, AuthUser } from "../../types/auth";
import { RootStackParamList } from "../../navigation/types";
import { FormField } from "./components/ProfileForm";
import { ProfileEditorModal } from "./components/ProfileEditorModal";
import { ProfileTopBar } from "./components/ProfileTopBar";
import { ProfileSummaryCard } from "./components/ProfileSummaryCard";
import { ProfileQuickActionsCard } from "./components/ProfileQuickActionsCard";
import { ProfileAccountCard } from "./components/ProfileAccountCard";
import { ProfileProfessionalCard } from "./components/ProfileProfessionalCard";
import { ProfilePreferencesCard } from "./components/ProfilePreferencesCard";
import { EditorType } from "./types";

export const ProfileScreen = () => {
  const { spacing, colors } = useTheme();
  const { mode } = useThemeMode();
  const { user, setUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [activeEditor, setActiveEditor] = useState<EditorType>(null);
  const [identityForm, setIdentityForm] = useState(createIdentityFormState(user));
  const [professionalForm, setProfessionalForm] = useState(createProfessionalFormState(user));
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    setIdentityForm(createIdentityFormState(user));
    setProfessionalForm(createProfessionalFormState(user));
  }, [user]);

  const fullName = useMemo(() => {
    const segments = [user?.firstName, user?.lastName].filter(Boolean);
    if (segments.length) return segments.join(" ");
    if (typeof user?.displayName === "string") return user.displayName;
    return "Unnamed operator";
  }, [user?.displayName, user?.firstName, user?.lastName]);

  const avatarUrl = typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;

  const avatarInitials = useMemo(() => {
    const source = fullName !== "Unnamed operator" ? fullName : user?.email ?? "NA";
    const parts = source
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return "NA";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [fullName, user?.email]);

  const activeCompanyCount = Array.isArray(user?.companies) ? user?.companies.length : 0;

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
    if (address) payload.address = address;
    void submitUpdate(payload);
  };

  const handleSaveProfessional = () => {
    const activityTags = professionalForm.activityTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length);
    const payload: UpdateUserPayload = {
      companyAbout: professionalForm.companyAbout.trim() || undefined,
      bio: professionalForm.bio.trim() || undefined,
      activityTags,
    };
    void submitUpdate(payload);
  };

  const handleUploadAvatar = async () => {
    try {
      setAvatarError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
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
      const fileUri = file.uri;
      if (!fileUri) {
        setAvatarError("We couldn't read that file path. Please pick another image.");
        return;
      }
      setAvatarUploading(true);
      const response = await userService.uploadUserFile({
        fileName: file.name ?? "avatar.jpg",
        mimeType: file.mimeType ?? "image/jpeg",
        uri: fileUri,
        purpose: "avatar",
      });
      const uploadedUrl = response.file?.url ?? undefined;
      if (user) {
        setUser({ ...user, avatarUrl: uploadedUrl ?? user.avatarUrl });
      }
      setBanner({ type: "success", message: "Profile photo updated." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload photo";
      setAvatarError(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const actions = [
    {
      key: "edit-identity",
      label: "Edit Personal",
      icon: "person-circle-outline" as const,
      onPress: () => openEditor("identity"),
    },
    {
      key: "edit-professional",
      label: "Edit Professional",
      icon: "briefcase-outline" as const,
      onPress: () => openEditor("professional"),
    },
    {
      key: "appearance",
      label: "Appearance",
      icon: "contrast-outline" as const,
      onPress: () => navigation.navigate("Appearance"),
    },
    {
      key: "company",
      label: "Open Company",
      icon: "business-outline" as const,
      onPress: () => {
        if (user?.activeCompany) {
          navigation.navigate("CompanyProfile", { companyId: user.activeCompany });
          return;
        }
        navigation.navigate("CompanyCreate");
      },
    },
  ];

  const fullAddress = formatAddress(user);
  const tagList = Array.isArray(user?.activityTags) ? user.activityTags : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          locations={[0, 0.35, 0.72, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlaySecondary]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ProfileTopBar
        title="Profile"
        subtitle="Manage your account and company context"
        onBack={() => navigation.goBack()}
        onOpenAppearance={() => navigation.navigate("Appearance")}
      />

      {avatarError ? (
        <View style={styles.alertBanner}>
          <LinearGradient colors={[colors.error + "26", colors.error + "14"]} style={[styles.alertGlass, { borderColor: colors.error + "4d" }]}> 
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.alertText, { color: colors.error }]}>{avatarError}</Text>
            <TouchableOpacity onPress={() => setAvatarError(null)}>
              <Ionicons name="close" size={18} color={colors.error} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : null}

      {banner ? (
        <View style={styles.alertBanner}>
          <LinearGradient
            colors={banner.type === "success" ? [colors.success + "26", colors.success + "14"] : [colors.error + "26", colors.error + "14"]}
            style={[styles.alertGlass, { borderColor: banner.type === "success" ? colors.success + "55" : colors.error + "55" }]}
          >
            <Ionicons
              name={banner.type === "success" ? "checkmark-circle" : "alert-circle"}
              size={18}
              color={banner.type === "success" ? colors.success : colors.error}
            />
            <Text style={[styles.alertText, { color: banner.type === "success" ? colors.success : colors.error }]}>{banner.message}</Text>
            <TouchableOpacity onPress={() => setBanner(null)}>
              <Ionicons name="close" size={18} color={banner.type === "success" ? colors.success : colors.error} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.lg + insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileSummaryCard
          fullName={fullName}
          email={user?.email}
          avatarUrl={avatarUrl}
          avatarInitials={avatarInitials}
          role={user?.role}
          accountType={user?.accountType}
          companiesCount={activeCompanyCount}
          bio={user?.bio as string | undefined}
          onUploadAvatar={handleUploadAvatar}
          uploading={avatarUploading}
        />

        <ProfileQuickActionsCard actions={actions} />

        <ProfileAccountCard
          fullName={fullName}
          displayName={user?.displayName as string | undefined}
          email={user?.email}
          phone={user?.phone as string | undefined}
          address={fullAddress}
          onEdit={() => openEditor("identity")}
        />

        <ProfileProfessionalCard
          companyAbout={user?.companyAbout as string | undefined}
          bio={user?.bio as string | undefined}
          tags={tagList}
          onEdit={() => openEditor("professional")}
        />

        <ProfilePreferencesCard
          themeMode={mode}
          locale={user?.preferences?.locale}
          timezone={user?.preferences?.timezone}
          onOpenAppearance={() => navigation.navigate("Appearance")}
        />
      </ScrollView>

      <ProfileEditorModal
        title="Edit Personal Info"
        visible={activeEditor === "identity"}
        onClose={closeEditor}
        onSubmit={handleSaveIdentity}
        saving={saving}
        error={editorError}
      >
        <FormField label="First name" value={identityForm.firstName} onChangeText={(v) => setIdentityForm((p) => ({ ...p, firstName: v }))} />
        <FormField label="Last name" value={identityForm.lastName} onChangeText={(v) => setIdentityForm((p) => ({ ...p, lastName: v }))} />
        <FormField label="Display name" value={identityForm.displayName} onChangeText={(v) => setIdentityForm((p) => ({ ...p, displayName: v }))} />
        <FormField label="Phone" value={identityForm.phone} onChangeText={(v) => setIdentityForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
        <FormField label="Address line 1" value={identityForm.line1} onChangeText={(v) => setIdentityForm((p) => ({ ...p, line1: v }))} />
        <FormField label="Address line 2" value={identityForm.line2} onChangeText={(v) => setIdentityForm((p) => ({ ...p, line2: v }))} />
        <FormField label="City" value={identityForm.city} onChangeText={(v) => setIdentityForm((p) => ({ ...p, city: v }))} />
        <FormField label="State" value={identityForm.state} onChangeText={(v) => setIdentityForm((p) => ({ ...p, state: v }))} />
        <FormField label="Postal code" value={identityForm.postalCode} onChangeText={(v) => setIdentityForm((p) => ({ ...p, postalCode: v }))} keyboardType="numbers-and-punctuation" />
        <FormField label="Country" value={identityForm.country} onChangeText={(v) => setIdentityForm((p) => ({ ...p, country: v }))} />
      </ProfileEditorModal>

      <ProfileEditorModal
        title="Edit Professional Info"
        visible={activeEditor === "professional"}
        onClose={closeEditor}
        onSubmit={handleSaveProfessional}
        saving={saving}
        error={editorError}
      >
        <FormField
          label="Company About"
          helperText="Describe your company, mission, and what makes you unique"
          value={professionalForm.companyAbout}
          onChangeText={(v) => setProfessionalForm((p) => ({ ...p, companyAbout: v }))}
          multiline
          numberOfLines={4}
        />
        <FormField
          label="Bio"
          helperText="A short description about yourself"
          value={professionalForm.bio}
          onChangeText={(v) => setProfessionalForm((p) => ({ ...p, bio: v }))}
          multiline
          numberOfLines={3}
        />
        <FormField
          label="Activity tags"
          helperText="Separate with commas"
          value={professionalForm.activityTags}
          onChangeText={(v) => setProfessionalForm((p) => ({ ...p, activityTags: v }))}
        />
      </ProfileEditorModal>
    </View>
  );
};

type IdentityFormState = ReturnType<typeof createIdentityFormState>;

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
  companyAbout: user?.companyAbout ?? "",
  bio: user?.bio ?? "",
  activityTags: Array.isArray(user?.activityTags) ? user?.activityTags.join(", ") : "",
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

const formatAddress = (user?: AuthUser | null) => {
  const address = user?.address;
  if (!address) return null;
  const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

const cleanObject = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === "") return acc;
    (acc as any)[key] = value;
    return acc;
  }, {} as Partial<T>);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  alertBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
  },
  alertGlass: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
});
