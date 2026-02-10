import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import { companyService } from "../../services/company.service";
import { ApiError } from "../../services/http";
import { Company } from "../../types/company";
import { CompanyHero } from "./components/CompanyHero";
import { CompanySections } from "./components/CompanySections";
import { CompanyEditorModal } from "./components/CompanyEditorModal";
import { CompanyEditorSection, CompanyProfileFormState } from "./components/types";
import { CompanyProfileTab, CompanyProfileTabs } from "./components/CompanyProfileTabs";
import { CompanyComplianceSection } from "./components/CompanyComplianceSection";
import { CompanyProductsSection } from "./components/CompanyProductsSection";

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CompanyProfileRoute>();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<CompanyProfileTab>("overview");
  const [productsTotal, setProductsTotal] = useState(0);

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
  const isReadOnly = user?.role === "admin";
  const canEdit = !isReadOnly;

  const loadCompany = useCallback(async () => {
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
  }, [targetCompanyId]);

  useFocusEffect(
    useCallback(() => {
      loadCompany();
    }, [loadCompany])
  );

  useEffect(() => {
    setForm(createFormState(company));
  }, [company]);

  const complianceStatus = company?.complianceStatus ?? "pending";
  const needsVerification = complianceStatus !== "approved";
  const companyId = company?.id ? String(company.id) : null;

  const openVerification = useCallback(() => {
    if (!companyId) {
      setError("Unable to open verification: missing company id.");
      return;
    }

    navigation.push("CompanyVerification", { companyId });
  }, [companyId, navigation]);

  const handleUploadLogo = async () => {
    if (!company?.id || !canEdit) return;

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
    if (!company?.id || !canEdit) return;

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

  const renderTopBanner = () => (
    <View style={styles.bannerStack}>
      {(error || logoError) && (
        <View style={[styles.alertBanner, { borderColor: colors.error + "55", backgroundColor: colors.error + "14" }]}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={[styles.alertText, { color: colors.error }]} numberOfLines={2}>
            {error || logoError}
          </Text>
          <TouchableOpacity onPress={() => { setError(null); setLogoError(null); }}>
            <Ionicons name="close" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {banner && (
        <View
          style={[
            styles.alertBanner,
            {
              borderColor: banner.type === "success" ? colors.success + "55" : colors.error + "55",
              backgroundColor: banner.type === "success" ? colors.success + "14" : colors.error + "14",
            },
          ]}
        >
          <Ionicons
            name={banner.type === "success" ? "checkmark-circle" : "alert-circle"}
            size={16}
            color={banner.type === "success" ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.alertText,
              {
                color: banner.type === "success" ? colors.success : colors.error,
              },
            ]}
            numberOfLines={2}
          >
            {banner.message}
          </Text>
          <TouchableOpacity onPress={() => setBanner(null)}>
            <Ionicons name="close" size={16} color={banner.type === "success" ? colors.success : colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <LinearGradient
        colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}> 
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Company Profile</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Overview, products and compliance</Text>
        </View>
      </View>

      {renderTopBanner()}

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>Loading company...</Text>
        </View>
      ) : !targetCompanyId ? (
        <View style={styles.loaderWrap}>
          <Ionicons name="business-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No active company</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Select or create a company to continue.</Text>
          {!isReadOnly ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate("CompanyCreate")}
            >
              <Text style={[styles.primaryButtonText, { color: colors.textOnPrimary }]}>Create Company</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : company ? (
        <View style={styles.contentWrap}>
          <View style={styles.tabsWrap}>
            <CompanyProfileTabs
              activeTab={activeTab}
              onChange={setActiveTab}
              productCount={productsTotal}
            />
          </View>

          {activeTab === "products" ? (
            <View style={styles.productsWrap}>
              <CompanyProductsSection
                companyId={company.id}
                isReadOnly={isReadOnly}
                onAddProduct={canEdit ? () => navigation.navigate("AddProduct") : undefined}
                onTotalChange={setProductsTotal}
                onRefreshCompany={loadCompany}
              />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <CompanyHero
                company={company}
                complianceStatus={complianceStatus}
                onUploadLogo={canEdit ? handleUploadLogo : undefined}
                uploading={logoUploading}
              />

              {isReadOnly ? (
                <View style={[styles.readOnlyBanner, { borderColor: colors.info + "55", backgroundColor: colors.info + "14" }]}>
                  <Ionicons name="eye-outline" size={18} color={colors.info} />
                  <Text style={[styles.readOnlyText, { color: colors.info }]}>Admin mode: this company profile is read-only.</Text>
                </View>
              ) : null}

              {activeTab === "overview" ? (
                <>
                  {needsVerification && canEdit ? (
                    <View style={[styles.verifyCard, { borderColor: colors.warning + "55", backgroundColor: colors.warning + "12" }]}>
                      <View style={styles.verifyHeader}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={colors.warning} />
                        <View style={styles.verifyTextWrap}>
                          <Text style={[styles.verifyTitle, { color: colors.text }]}>Verification pending</Text>
                          <Text style={[styles.verifySubtitle, { color: colors.textMuted }]}>Submit company documents to boost trust signals.</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.verifyButton, { backgroundColor: colors.warning }]}
                        onPress={openVerification}
                        activeOpacity={0.9}
                      >
                        <Text style={[styles.verifyButtonText, { color: colors.textOnPrimary }]}>Open Verification</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <CompanySections
                    company={company}
                    onEdit={canEdit ? (section) => setActiveEditor(section) : undefined}
                    formatAddress={formatAddress}
                    formatCategories={formatCategories}
                  />
                </>
              ) : (
                <CompanyComplianceSection
                  complianceStatus={complianceStatus}
                  isReadOnly={isReadOnly}
                  onOpenVerification={openVerification}
                />
              )}
            </ScrollView>
          )}
        </View>
      ) : null}

      {canEdit ? (
        <CompanyEditorModal
          visible={Boolean(activeEditor)}
          form={form}
          section={activeEditor}
          onChange={(changes) => setForm((previous) => ({ ...previous, ...changes }))}
          onClose={() => setActiveEditor(null)}
          onSubmit={handleSave}
          saving={saving}
        />
      ) : null}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      minHeight: 62,
      borderBottomWidth: 1,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: "600",
    },
    bannerStack: {
      paddingHorizontal: 16,
      paddingTop: 10,
      gap: 8,
    },
    alertBanner: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    alertText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
    },
    loaderWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 10,
    },
    loaderText: {
      fontSize: 14,
      fontWeight: "600",
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      marginTop: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
    },
    primaryButton: {
      marginTop: 10,
      minHeight: 42,
      borderRadius: 12,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: "800",
    },
    contentWrap: {
      flex: 1,
    },
    tabsWrap: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 8,
    },
    productsWrap: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
      gap: 12,
    },
    readOnlyBanner: {
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    readOnlyText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "700",
    },
    verifyCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      gap: 10,
    },
    verifyHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    verifyTextWrap: {
      flex: 1,
      gap: 2,
    },
    verifyTitle: {
      fontSize: 14,
      fontWeight: "800",
    },
    verifySubtitle: {
      fontSize: 12,
      fontWeight: "500",
    },
    verifyButton: {
      minHeight: 40,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    verifyButtonText: {
      fontSize: 13,
      fontWeight: "800",
    },
  });
