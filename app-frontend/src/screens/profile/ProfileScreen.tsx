import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/user.service";
import { verificationService } from "../../services/verificationService";
import { UpdateUserPayload, AuthUser } from "../../types/auth";
import { ComplianceStatus } from "../../types/company";
import { RootStackParamList } from "../../navigation/types";
import { ProfileHero } from "./components/ProfileHero";
import { ProfileSections } from "./components/ProfileSections";
import { FormField } from "./components/ProfileForm";
import { ProfileEditorModal } from "./components/ProfileEditorModal";
import { EditorType } from "./types";

export const ProfileScreen = () => {
  const { spacing, colors } = useTheme();
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
  const [verificationStatus, setVerificationStatus] = useState<ComplianceStatus | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchVerificationStatus = async () => {
        if (!user?.activeCompany) return;
        try {
          const response = await verificationService.getVerificationStatus(user.activeCompany);
          if (response.request && response.request.status === "pending") {
            setVerificationStatus("submitted");
          } else {
            setVerificationStatus(response.company?.complianceStatus || null);
          }
          setCompanyName(response.company?.displayName || null);
        } catch (error) {
          console.error("Failed to fetch verification status:", error);
        }
      };
      void fetchVerificationStatus();
    }, [user?.activeCompany])
  );

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

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, colors.surfaceOverlaySecondary, "transparent"]}
          locations={[0, 0.4, 0.8]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["transparent", colors.surfaceOverlayAccent, colors.surfaceOverlayPrimary]}
          locations={[0.3, 0.7, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.headerWrapper}>
        <LinearGradient colors={[colors.overlay, colors.overlayLight]} style={[styles.headerGlass, { borderBottomColor: colors.border }]}> 
          <View style={styles.header}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
            <TouchableOpacity
              style={[styles.appearanceButton, { backgroundColor: colors.primary + "1f", borderColor: colors.primary + "55" }]}
              onPress={() => navigation.navigate("Appearance")}
              activeOpacity={0.8}
            >
              <Ionicons name="contrast-outline" size={16} color={colors.primary} />
              <Text style={[styles.appearanceButtonText, { color: colors.primary }]}>Appearance</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.lg + insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          fullName={fullName}
          email={user?.email}
          avatarUrl={avatarUrl}
          avatarInitials={avatarInitials}
          role={user?.role}
          accountType={user?.accountType}
          onUploadAvatar={handleUploadAvatar}
          uploading={avatarUploading}
          verificationStatus={verificationStatus === "approved" ? "approved" : null}
          companyName={companyName}
          companiesCount={activeCompanyCount}
          bio={user?.bio}
        />

        <ProfileSections user={user} onEdit={openEditor} />
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
  headerWrapper: {
    zIndex: 10,
  },
  headerGlass: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  appearanceButton: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  appearanceButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  alertBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  alertGlass: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
