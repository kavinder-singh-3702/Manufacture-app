import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { RootStackParamList } from "../../navigation/types";
import { companyService } from "../../services/company.service";
import { ApiError } from "../../services/http";
import { Company } from "../../types/company";
import { CompanyHero } from "./components/CompanyHero";
import { CompanySections } from "./components/CompanySections";
import { CompanyEditorModal } from "./components/CompanyEditorModal";
import { CompanyEditorSection, CompanyProfileFormState } from "./components/types";

type CompanyProfileRoute = RouteProp<RootStackParamList, "CompanyProfile">;

const createFormState = (company?: Company | null): CompanyProfileFormState => ({
  displayName: company?.displayName ?? "",
  legalName: company?.legalName ?? "",
  description: company?.description ?? "",
  type: (company?.type as Company["type"] | undefined) ?? "normal",
  categories: company?.categories?.join(", ") ?? "",
  logoUrl: company?.logoUrl ?? "",
  website: company?.contact?.website ?? "",
  email: company?.contact?.email ?? "",
  phone: company?.contact?.phone ?? "",
  linkedin: company?.socialLinks?.linkedin ?? "",
  twitter: company?.socialLinks?.twitter ?? "",
  instagram: company?.socialLinks?.instagram ?? "",
  youtube: company?.socialLinks?.youtube ?? "",
  line1: company?.headquarters?.line1 ?? "",
  line2: company?.headquarters?.line2 ?? "",
  city: company?.headquarters?.city ?? "",
  state: company?.headquarters?.state ?? "",
  postalCode: company?.headquarters?.postalCode ?? "",
  country: company?.headquarters?.country ?? "",
});

const formatAddress = (company?: Company | null) => {
  const address = company?.headquarters;
  if (!address) return null;
  const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

const formatCategories = (company?: Company | null) => {
  if (!company?.categories?.length) return "Add categories to help buyers discover you.";
  return company.categories.map((item) => item.trim()).filter(Boolean).join(", ");
};

const cleanObject = <T extends Record<string, unknown>>(obj: T) =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === "") return acc;
    (acc as Partial<T>)[key] = value;
    return acc;
  }, {} as Partial<T>);

export const CompanyProfileScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CompanyProfileRoute>();
  const { user, refreshUser } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<CompanyEditorSection>(null);
  const [form, setForm] = useState<CompanyProfileFormState>(createFormState(null));
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const targetCompanyId = route.params?.companyId ?? user?.activeCompany ?? null;

  const loadCompany = async () => {
    if (!targetCompanyId) {
      setCompany(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await companyService.get(targetCompanyId);
      setCompany(response.company);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to load company.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, [targetCompanyId]);

  useEffect(() => {
    setForm(createFormState(company));
  }, [company]);

  const complianceStatus = company?.complianceStatus ?? "pending";
  const needsVerification = complianceStatus !== "approved";

  const handleUploadLogo = async () => {
    if (!company?.id) return;
    try {
      setLogoError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) {
        setLogoError("Unable to read that file. Please try another image.");
        return;
      }

      if (file.size && file.size > 5 * 1024 * 1024) {
        setLogoError("Please choose an image smaller than 5 MB.");
        return;
      }

      if (file.mimeType && !file.mimeType.startsWith("image/")) {
        setLogoError("Please choose an image file (JPG or PNG).");
        return;
      }

      setLogoUploading(true);
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      const response = await companyService.uploadFile(company.id, {
        fileName: file.name ?? "company-logo.jpg",
        mimeType: file.mimeType ?? "image/jpeg",
        content: base64,
        purpose: "logo",
      });
      setCompany(response.company);
      await refreshUser().catch(() => null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload logo";
      setLogoError(message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!company?.id) return;
    try {
      setSaving(true);
      setError(null);
      const categories = form.categories
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const payload = {
        displayName: form.displayName.trim() || undefined,
        legalName: form.legalName.trim() || undefined,
        description: form.description.trim() || undefined,
        type: form.type,
        categories,
        logoUrl: form.logoUrl.trim() || undefined,
        contact: cleanObject({
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
        }),
        socialLinks: cleanObject({
          linkedin: form.linkedin.trim() || undefined,
          twitter: form.twitter.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
          youtube: form.youtube.trim() || undefined,
        }),
        headquarters: cleanObject({
          line1: form.line1.trim() || undefined,
          line2: form.line2.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          country: form.country.trim() || undefined,
        }),
      };
      const response = await companyService.update(company.id, payload);
      setCompany(response.company);
      await refreshUser().catch(() => null);
      setActiveEditor(null);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to update company.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      {error ? (
        <View style={[styles.banner, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
          <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: spacing.sm }}>Loading company…</Text>
        </View>
      ) : !targetCompanyId ? (
        <View style={styles.loaderWrap}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No active company selected</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>Link or create a company to view its profile.</Text>
        </View>
      ) : company ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: spacing.xl }}>
          <CompanyHero
            company={company}
            complianceStatus={complianceStatus}
            onUploadLogo={handleUploadLogo}
            uploading={logoUploading}
          />
          {logoError ? <Text style={[styles.errorText, { marginBottom: spacing.sm }]}>{logoError}</Text> : null}

          {needsVerification ? (
            <View
              style={[
                styles.infoCard,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.text }]}>Get verified to unlock priority</Text>
              <Text style={{ color: colors.textMuted, marginTop: spacing.xs }}>
                Verified companies earn sourcing priority, faster approvals, and improved visibility across buyer workflows.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("VerificationSubmit", { companyId: company.id })}
                style={[
                  styles.verifyButton,
                  {
                    backgroundColor: colors.text,
                    borderRadius: radius.pill,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Text style={{ color: colors.textInverse, fontWeight: "700" }}>Get verified</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <CompanySections
            company={company}
            onEdit={(section) => setActiveEditor(section)}
            formatAddress={formatAddress}
            formatCategories={formatCategories}
          />
        </ScrollView>
      ) : null}

      <CompanyEditorModal
        visible={Boolean(activeEditor)}
        form={form}
        section={activeEditor}
        onChange={(changes) => setForm((prev) => ({ ...prev, ...changes }))}
        onClose={() => setActiveEditor(null)}
        onSubmit={handleSave}
        saving={saving}
      />
    </SafeAreaView>
  );
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "600",
  },
  banner: {
    marginHorizontal: 24,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  bannerText: {
    fontWeight: "700",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
  },
  infoCard: {
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  verifyButton: {
    alignSelf: "flex-start",
  },
  errorText: {
    color: "#DC2626",
  },
});
