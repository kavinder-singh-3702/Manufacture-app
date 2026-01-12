import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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

const cleanObject = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === "") return acc;
    (acc as Record<string, unknown>)[key] = value;
    return acc;
  }, {} as Record<string, unknown>) as Partial<T>;

export const CompanyProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CompanyProfileRoute>();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<CompanyEditorSection>(null);
  const [form, setForm] = useState<CompanyProfileFormState>(createFormState(null));
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const targetCompanyId = route.params?.companyId ?? user?.activeCompany ?? null;

  // Check if user is admin viewing another company (read-only mode)
  const isAdmin = user?.role === "admin";
  const isOwnCompany = user?.activeCompany === targetCompanyId ||
    (user?.companies && user.companies.some((c: any) => String(c.id || c) === String(targetCompanyId)));
  const isReadOnly = isAdmin && !isOwnCompany;

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
  const companyId = company?.id ? String(company.id) : null;

  const openVerification = () => {
    if (!companyId) {
      setError("Unable to open verification: missing company id.");
      return;
    }
    const parentNav = navigation.getParent?.();
    if (parentNav) {
      (parentNav.navigate as any)("CompanyVerification", { companyId });
      return;
    }
    navigation.push("CompanyVerification", { companyId });
  };

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
      const response = await companyService.uploadFile(company.id, {
        fileName: file.name ?? "company-logo.jpg",
        mimeType: file.mimeType ?? "image/jpeg",
        uri: file.uri,
        purpose: "logo",
      });
      setCompany(response.company);
      setBanner({ type: "success", message: "Company logo updated." });
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
      setBanner({ type: "success", message: "Company updated successfully." });
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Premium Blended Gradient Background */}
      <View style={StyleSheet.absoluteFill}>
        {/* Base gradient - deep purple to dark */}
        <LinearGradient
          colors={["#0F0A1A", "#0A0A0F", "#08080C", "#0A0812"]}
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top gradient wash - purple/indigo blend */}
        <LinearGradient
          colors={["rgba(139, 92, 246, 0.15)", "rgba(99, 102, 241, 0.08)", "transparent"]}
          locations={[0, 0.4, 0.8]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Bottom gradient wash - subtle pink accent */}
        <LinearGradient
          colors={["transparent", "rgba(168, 85, 247, 0.06)", "rgba(139, 92, 246, 0.1)"]}
          locations={[0.3, 0.7, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle vignette effect */}
        <LinearGradient
          colors={["transparent", "transparent", "rgba(0, 0, 0, 0.3)"]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header with glass effect */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["rgba(15, 15, 20, 0.95)", "rgba(15, 15, 20, 0.85)"]}
          style={styles.headerGlass}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#FAFAFA" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company Profile</Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
      </View>

      {/* Error Banner */}
      {(error || logoError) && (
        <View style={styles.alertBanner}>
          <LinearGradient
            colors={["rgba(248, 113, 113, 0.15)", "rgba(248, 113, 113, 0.08)"]}
            style={styles.alertGlass}
          >
            <Ionicons name="alert-circle" size={18} color="#F87171" />
            <Text style={styles.alertText}>{error || logoError}</Text>
            <TouchableOpacity onPress={() => { setError(null); setLogoError(null); }}>
              <Ionicons name="close" size={18} color="#F87171" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Success Banner */}
      {banner && (
        <View style={styles.alertBanner}>
          <LinearGradient
            colors={
              banner.type === "success"
                ? ["rgba(52, 211, 153, 0.15)", "rgba(52, 211, 153, 0.08)"]
                : ["rgba(248, 113, 113, 0.15)", "rgba(248, 113, 113, 0.08)"]
            }
            style={styles.alertGlass}
          >
            <Ionicons
              name={banner.type === "success" ? "checkmark-circle" : "alert-circle"}
              size={18}
              color={banner.type === "success" ? "#34D399" : "#F87171"}
            />
            <Text style={[styles.alertText, { color: banner.type === "success" ? "#34D399" : "#F87171" }]}>
              {banner.message}
            </Text>
            <TouchableOpacity onPress={() => setBanner(null)}>
              <Ionicons name="close" size={18} color={banner.type === "success" ? "#34D399" : "#F87171"} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#8B5CF6" size="large" />
          <Text style={styles.loaderText}>Loading company...</Text>
        </View>
      ) : !targetCompanyId ? (
        <View style={styles.loaderWrap}>
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.2)", "rgba(99, 102, 241, 0.15)"]}
            style={styles.emptyIcon}
          >
            <Ionicons name="business-outline" size={40} color="#A78BFA" />
          </LinearGradient>
          <Text style={styles.emptyText}>No active company</Text>
          <Text style={styles.emptySubtext}>Link or create a company to view its profile.</Text>
        </View>
      ) : company ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <CompanyHero
            company={company}
            complianceStatus={complianceStatus}
            onUploadLogo={isReadOnly ? undefined : handleUploadLogo}
            uploading={logoUploading}
          />

          {/* Read-only Banner for Admin */}
          {isReadOnly && (
            <LinearGradient
              colors={["rgba(59, 130, 246, 0.12)", "rgba(59, 130, 246, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.readOnlyBanner}
            >
              <View style={styles.readOnlyIconWrap}>
                <Ionicons name="eye-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.readOnlyTextWrap}>
                <Text style={styles.readOnlyTitle}>Viewing as Admin</Text>
                <Text style={styles.readOnlySubtext}>This is a read-only view of the company profile.</Text>
              </View>
            </LinearGradient>
          )}

          {/* Verification CTA Card - only show for own company */}
          {needsVerification && !isReadOnly && (
            <LinearGradient
              colors={["rgba(245, 158, 11, 0.12)", "rgba(245, 158, 11, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.verificationCard}
            >
              <View style={styles.verificationCardHeader}>
                <LinearGradient
                  colors={["rgba(245, 158, 11, 0.25)", "rgba(245, 158, 11, 0.15)"]}
                  style={styles.verificationIcon}
                >
                  <Ionicons name="shield-checkmark" size={22} color="#F59E0B" />
                </LinearGradient>
                <View style={styles.verificationTextWrap}>
                  <Text style={styles.verificationTitle}>Get verified to unlock priority</Text>
                  <Text style={styles.verificationSubtext}>
                    Verified companies earn sourcing priority and improved visibility.
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={openVerification} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.verificationButton}
                >
                  <Text style={styles.verificationButtonText}>Get Verified</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          )}

          <CompanySections
            company={company}
            onEdit={isReadOnly ? undefined : (section) => setActiveEditor(section)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  // Header
  headerWrapper: {
    zIndex: 10,
  },
  headerGlass: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: -0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerSpacer: {
    width: 40,
  },
  // Alerts
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
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#F87171",
  },
  // Loader
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loaderText: {
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 16,
    fontSize: 15,
    fontWeight: "500",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  emptySubtext: {
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Verification Card
  verificationCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  verificationCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  verificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  verificationTextWrap: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FAFAFA",
    marginBottom: 4,
  },
  verificationSubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.55)",
    lineHeight: 19,
  },
  verificationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  verificationButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  // Read-only banner styles
  readOnlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
  },
  readOnlyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  readOnlyTextWrap: {
    flex: 1,
  },
  readOnlyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#60A5FA",
    marginBottom: 2,
  },
  readOnlySubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.55)",
  },
});
