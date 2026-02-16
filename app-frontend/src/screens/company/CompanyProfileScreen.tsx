import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { ResponsiveScreen } from "../../components/layout/ResponsiveScreen";
import { AdaptiveSingleLineText } from "../../components/text/AdaptiveSingleLineText";
import { AdaptiveTwoLineText } from "../../components/text/AdaptiveTwoLineText";
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
import { useCompanyProfileLayout } from "./components/companyProfile.layout";

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
  const { isCompact } = useResponsiveLayout();
  const layout = useCompanyProfileLayout();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CompanyProfileRoute>();
  const { user, refreshUser } = useAuth();

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
    <View style={[styles.bannerStack, { paddingHorizontal: layout.edgePadding }]}> 
      {(error || logoError) ? (
        <View
          style={[
            styles.alertBanner,
            isCompact && styles.alertBannerCompact,
            { borderColor: colors.error + "55", backgroundColor: colors.error + "14" },
          ]}
        >
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.alertText, { color: colors.error }]}>
            {error || logoError}
          </AdaptiveTwoLineText>
          <TouchableOpacity onPress={() => {
            setError(null);
            setLogoError(null);
          }}>
            <Ionicons name="close" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : null}

      {banner ? (
        <View
          style={[
            styles.alertBanner,
            isCompact && styles.alertBannerCompact,
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
          <AdaptiveTwoLineText
            minimumFontScale={0.72}
            style={[
              styles.alertText,
              { color: banner.type === "success" ? colors.success : colors.error },
            ]}
          >
            {banner.message}
          </AdaptiveTwoLineText>
          <TouchableOpacity onPress={() => setBanner(null)}>
            <Ionicons
              name="close"
              size={16}
              color={banner.type === "success" ? colors.success : colors.error}
            />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <ResponsiveScreen
      scroll={false}
      paddingHorizontal={0}
      safeAreaEdges={["top", "left", "right", "bottom"]}
      style={styles.container}
    >
      <LinearGradient
        colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
            minHeight: layout.headerHeight,
            paddingHorizontal: layout.edgePadding,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceElevated,
              width: layout.iconButtonSize,
              height: layout.iconButtonSize,
              borderRadius: layout.compact ? 10 : 12,
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={layout.compact ? 18 : 20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.headerTitle, { color: colors.text, fontSize: layout.titleSize }]}>
            Company Profile
          </AdaptiveSingleLineText>
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.headerSubtitle, { color: colors.textMuted, fontSize: layout.subtitleSize }]}>
            Overview, products and compliance
          </AdaptiveSingleLineText>
        </View>
      </View>

      {renderTopBanner()}

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.loaderText, { color: colors.textMuted }]}> 
            Loading company...
          </AdaptiveSingleLineText>
        </View>
      ) : !targetCompanyId ? (
        <View style={styles.loaderWrap}>
          <Ionicons name="business-outline" size={44} color={colors.textMuted} />
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.emptyTitle, { color: colors.text }]}>No active company</AdaptiveSingleLineText>
          <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Select or create a company to continue.
          </AdaptiveTwoLineText>
          {!isReadOnly ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: layout.compact ? 10 : 12,
                  minHeight: layout.ctaHeight,
                },
              ]}
              onPress={() => navigation.navigate("CompanyCreate")}
            >
              <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.primaryButtonText, { color: colors.textOnPrimary }]}>Create Company</AdaptiveSingleLineText>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : company ? (
        <View style={styles.contentWrap}>
          <View style={[styles.tabsWrap, { paddingHorizontal: layout.edgePadding }]}> 
            <CompanyProfileTabs
              activeTab={activeTab}
              onChange={setActiveTab}
              productCount={productsTotal}
            />
          </View>

          {activeTab === "products" ? (
            <View style={[styles.productsWrap, { paddingHorizontal: layout.edgePadding }]}> 
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
                {
                  paddingHorizontal: layout.edgePadding,
                  paddingBottom: 24,
                  gap: layout.sectionGap,
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <CompanyHero
                company={company}
                complianceStatus={complianceStatus}
                onUploadLogo={canEdit ? handleUploadLogo : undefined}
                uploading={logoUploading}
              />

              {isReadOnly ? (
                <View
                  style={[
                    styles.readOnlyBanner,
                    {
                      borderColor: colors.info + "55",
                      backgroundColor: colors.info + "14",
                      borderRadius: layout.compact ? 10 : 12,
                      minHeight: layout.ctaHeight,
                    },
                  ]}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.info} />
                  <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.readOnlyText, { color: colors.info }]}>
                    Admin mode: this company profile is read-only.
                  </AdaptiveTwoLineText>
                </View>
              ) : null}

              {activeTab === "overview" ? (
                <>
                  {needsVerification && canEdit ? (
                    <View
                      style={[
                        styles.verifyCard,
                        {
                          borderColor: colors.warning + "55",
                          backgroundColor: colors.warning + "12",
                          borderRadius: layout.compact ? 12 : 14,
                          padding: layout.cardPadding,
                        },
                      ]}
                    >
                      <View style={[styles.verifyHeader, isCompact && styles.verifyHeaderCompact]}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={colors.warning} />
                        <View style={styles.verifyTextWrap}>
                          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.verifyTitle, { color: colors.text }]}> 
                            Verification pending
                          </AdaptiveSingleLineText>
                          <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.verifySubtitle, { color: colors.textMuted }]}>
                            Submit company documents to boost trust signals.
                          </AdaptiveTwoLineText>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.verifyButton,
                          {
                            backgroundColor: colors.warning,
                            borderRadius: layout.compact ? 10 : 12,
                            minHeight: layout.ctaHeight,
                          },
                        ]}
                        onPress={openVerification}
                        activeOpacity={0.9}
                      >
                        <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.verifyButtonText, { color: colors.textOnPrimary }]}>
                          Open Verification
                        </AdaptiveSingleLineText>
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
    </ResponsiveScreen>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  layout: ReturnType<typeof useCompanyProfileLayout>
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      borderBottomWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    backButton: {
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    headerTitle: {
      fontWeight: "800",
      letterSpacing: -0.3,
      minWidth: 0,
      flexShrink: 1,
    },
    headerSubtitle: {
      fontWeight: "600",
      minWidth: 0,
      flexShrink: 1,
    },
    bannerStack: {
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
      minWidth: 0,
    },
    alertBannerCompact: {
      alignItems: "flex-start",
    },
    alertText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "700",
      minWidth: 0,
      flexShrink: 1,
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
      minWidth: 0,
      flexShrink: 1,
    },
    emptyTitle: {
      fontSize: layout.compact ? 16 : 18,
      fontWeight: "800",
      marginTop: 4,
      minWidth: 0,
      flexShrink: 1,
    },
    emptySubtitle: {
      fontSize: layout.compact ? 12 : 13,
      fontWeight: "600",
      textAlign: "center",
      minWidth: 0,
      flexShrink: 1,
    },
    primaryButton: {
      marginTop: 10,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      fontSize: layout.compact ? 13 : 14,
      fontWeight: "800",
      minWidth: 0,
      flexShrink: 1,
    },
    contentWrap: {
      flex: 1,
    },
    tabsWrap: {
      paddingTop: 10,
      paddingBottom: 8,
    },
    productsWrap: {
      flex: 1,
      paddingBottom: 8,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 4,
      gap: 12,
    },
    readOnlyBanner: {
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    readOnlyText: {
      flex: 1,
      fontSize: layout.compact ? 11 : 12,
      fontWeight: "700",
      minWidth: 0,
      flexShrink: 1,
    },
    verifyCard: {
      borderWidth: 1,
      gap: 10,
    },
    verifyHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    verifyHeaderCompact: {
      alignItems: "flex-start",
    },
    verifyTextWrap: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    verifyTitle: {
      fontSize: layout.compact ? 13 : 14,
      fontWeight: "800",
      minWidth: 0,
      flexShrink: 1,
    },
    verifySubtitle: {
      fontSize: layout.compact ? 11 : 12,
      fontWeight: "600",
      minWidth: 0,
      flexShrink: 1,
    },
    verifyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    verifyButtonText: {
      fontSize: layout.compact ? 12 : 13,
      fontWeight: "800",
      minWidth: 0,
      flexShrink: 1,
    },
  });
