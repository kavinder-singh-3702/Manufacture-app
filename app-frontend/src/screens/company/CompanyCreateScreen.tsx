import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { companyService } from "../../services/company.service";
import { BUSINESS_ACCOUNT_TYPES, BusinessAccountType } from "../../constants/business";
import { ApiError } from "../../services/http";
import { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/common/Button";
import { userService } from "../../services/user.service";
import { redirectAfterCompanyResolved } from "../../navigation/companyContextNavigation";

export const CompanyCreateScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CompanyCreate">>();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    type: "normal" as BusinessAccountType,
    logoUrl: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    city: "",
    country: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleUploadLogo = async () => {
    try {
      setLogoError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) {
        setLogoError("Could not read that file, please try another image.");
        return;
      }
      if (file.size && file.size > 5 * 1024 * 1024) {
        setLogoError("Please choose an image smaller than 5 MB.");
        return;
      }
      if (file.mimeType && !file.mimeType.startsWith("image/")) {
        setLogoError("Please choose a JPG or PNG image.");
        return;
      }

      setLogoUploading(true);
      const response = await userService.uploadUserFile({
        fileName: file.name ?? "company-logo.jpg",
        mimeType: file.mimeType ?? "image/jpeg",
        uri: file.uri,
        purpose: "company-logo",
      });
      const uploadedUrl = response.file?.url ?? "";
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, logoUrl: uploadedUrl }));
      }
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Unable to upload logo.";
      setLogoError(message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.displayName.trim()) {
      setError("Enter a company name to continue.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const { company: createdCompany } = await companyService.create({
        displayName: form.displayName.trim(),
        type: form.type,
        logoUrl: form.logoUrl?.trim() || undefined,
        description: form.description.trim() || undefined,
        contact: {
          email: form.contactEmail.trim() || undefined,
          phone: form.contactPhone.trim() || undefined,
          website: form.website.trim() || undefined,
        },
        headquarters: {
          city: form.city.trim() || undefined,
          country: form.country.trim() || undefined,
        },
      });
      if (createdCompany?.id) {
        await companyService.switchActive(createdCompany.id).catch(() => null);
      }
      await refreshUser().catch(() => null);
      redirectAfterCompanyResolved(navigation, route.params?.redirectTo, "replace");
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to create company.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, marginLeft: spacing.sm }]}>Create a company</Text>
        </View>
        <Text style={{ color: colors.textMuted, marginBottom: spacing.md }}>
          Add a new entity to switch between in your workspace.
        </Text>

        <Text style={[styles.label, { color: colors.muted }]}>Display name</Text>
        <TextInput
          value={form.displayName}
          onChangeText={(value) => setForm((prev) => ({ ...prev, displayName: value }))}
          placeholder="e.g., Acme Textiles"
          placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: radius.md,
              padding: spacing.md,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>Logo URL</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            padding: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
          }}
        >
          {form.logoUrl ? (
            <Image source={{ uri: form.logoUrl }} style={{ width: 56, height: 56, borderRadius: radius.md }} resizeMode="cover" />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surfaceElevated,
              }}
            >
              <Text style={{ color: colors.textMuted, fontWeight: "700" }}>Logo</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={handleUploadLogo}
              style={{
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
              }}
              disabled={logoUploading}
            >
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {logoUploading ? "Uploading…" : form.logoUrl ? "Replace logo" : "Upload logo"}
              </Text>
            </TouchableOpacity>
            {logoError ? <Text style={{ color: colors.error, marginTop: 4 }}>{logoError}</Text> : null}
          </View>
        </View>

        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>Description</Text>
        <TextInput
          value={form.description}
          onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
          placeholder="Short blurb about the company"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: radius.md,
              padding: spacing.md,
            },
          ]}
          multiline
        />

        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>Type</Text>
        <View style={[styles.segmentRow, { marginTop: spacing.xs }]}>
          {BUSINESS_ACCOUNT_TYPES.map((type) => {
            const active = form.type === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setForm((prev) => ({ ...prev, type }))}
                style={[
                  styles.segmentButton,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primaryLight : colors.surface,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text style={{ color: active ? colors.primaryDark : colors.text, fontWeight: "700" }}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>Contact</Text>
        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.sm }]}>Contact email</Text>
        <TextInput
          value={form.contactEmail}
          onChangeText={(value) => setForm((prev) => ({ ...prev, contactEmail: value }))}
          placeholder="ops@company.com"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: spacing.md },
          ]}
        />
        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>Contact phone</Text>
        <TextInput
          value={form.contactPhone}
          onChangeText={(value) => setForm((prev) => ({ ...prev, contactPhone: value }))}
          placeholder="+91 99889 11111"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: spacing.md },
          ]}
        />
        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>Website</Text>
        <TextInput
          value={form.website}
          onChangeText={(value) => setForm((prev) => ({ ...prev, website: value }))}
          placeholder="https://example.com"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: spacing.md },
          ]}
        />

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>Location</Text>
        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.sm }]}>City</Text>
        <TextInput
          value={form.city}
          onChangeText={(value) => setForm((prev) => ({ ...prev, city: value }))}
          placeholder="Mumbai"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: spacing.md },
          ]}
        />
        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>Country</Text>
        <TextInput
          value={form.country}
          onChangeText={(value) => setForm((prev) => ({ ...prev, country: value }))}
          placeholder="India"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: spacing.md },
          ]}
        />

        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

        <View style={{ marginTop: spacing.lg }}>
          <Button label={saving ? "Creating…" : "Create company"} onPress={handleSubmit} loading={saving} />
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.md, alignItems: "center" }}
        >
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segmentButton: {
    borderWidth: 1,
  },
  errorText: {
    marginTop: 8,
    fontWeight: "700",
  },
});
