import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import {
  adService,
  AdCampaign,
  AdCampaignStatus,
  AdInsights,
  UpsertAdCampaignInput,
} from "../../services/ad.service";
import { Product, productService } from "../../services/product.service";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StudioRoute = RouteProp<RootStackParamList, "AdStudio">;

type WizardState = {
  name: string;
  description: string;
  productId: string;
  targetingMode: "any" | "all";
  targetUserIds: string;
  shopperCategories: string;
  shopperSubCategories: string;
  buyIntentCategories: string;
  buyIntentSubCategories: string;
  listedProductCategories: string;
  listedProductSubCategories: string;
  requireSameCategory: boolean;
  lookbackDays: string;
  startAt: string;
  endAt: string;
  frequencyCapPerDay: string;
  priority: string;
  creativeTitle: string;
  creativeSubtitle: string;
  creativeCtaLabel: string;
  creativeBadge: string;
  launchNow: boolean;
  sourceRequestId: string;
};

const initialWizardState: WizardState = {
  name: "",
  description: "",
  productId: "",
  targetingMode: "any",
  targetUserIds: "",
  shopperCategories: "",
  shopperSubCategories: "",
  buyIntentCategories: "",
  buyIntentSubCategories: "",
  listedProductCategories: "",
  listedProductSubCategories: "",
  requireSameCategory: false,
  lookbackDays: "60",
  startAt: "",
  endAt: "",
  frequencyCapPerDay: "3",
  priority: "50",
  creativeTitle: "",
  creativeSubtitle: "",
  creativeCtaLabel: "View Product",
  creativeBadge: "",
  launchNow: false,
  sourceRequestId: "",
};

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseDate = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parsePositiveInt = (value: string, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
};

const statusTone = (status: AdCampaignStatus) => {
  if (status === "active") return { fg: "#0E8F62", bg: "#0E8F6215" };
  if (status === "paused") return { fg: "#B26A00", bg: "#B26A0015" };
  if (status === "draft") return { fg: "#3B4B63", bg: "#3B4B6315" };
  if (status === "completed") return { fg: "#1D4ED8", bg: "#1D4ED815" };
  return { fg: "#6B7280", bg: "#6B728015" };
};

export const AdStudioScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<StudioRoute>();

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsRefreshing, setCampaignsRefreshing] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<AdInsights | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [createMode, setCreateMode] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizard, setWizard] = useState<WizardState>({
    ...initialWizardState,
    targetUserIds: route.params?.prefillTargetUserId || "",
    sourceRequestId: route.params?.prefillServiceRequestId || "",
  });
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const loadCampaigns = useCallback(async (refreshing = false) => {
    if (refreshing) setCampaignsRefreshing(true);
    else setCampaignsLoading(true);

    try {
      setCampaignError(null);
      const response = await adService.listCampaigns({ limit: 50, offset: 0 });
      setCampaigns(response.campaigns || []);
    } catch (err: any) {
      setCampaignError(err?.message || "Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
      setCampaignsRefreshing(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const response = await productService.getAll({
        scope: "marketplace",
        createdByRole: "user",
        status: "active",
        visibility: "public",
        limit: 60,
        offset: 0,
        search: productSearch.trim() || undefined,
      });
      setProducts(response.products || []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [productSearch]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (!createMode) return;
    loadProducts();
  }, [createMode, loadProducts]);

  const openCampaign = useCallback(async (campaignId: string) => {
    try {
      setDetailsLoading(true);
      const [campaign, insights] = await Promise.all([
        adService.getCampaign(campaignId),
        adService.getInsights(campaignId),
      ]);
      setSelectedCampaign(campaign);
      setSelectedInsights(insights);
    } catch {
      setSelectedCampaign(null);
      setSelectedInsights(null);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const onActivatePause = useCallback(
    async (campaign: AdCampaign) => {
      try {
        if (campaign.status === "active") {
          await adService.pauseCampaign(campaign.id);
        } else {
          await adService.activateCampaign(campaign.id);
        }
        await loadCampaigns();
        if (selectedCampaign?.id === campaign.id) {
          openCampaign(campaign.id);
        }
      } catch {
        // Keep UI stable; list refresh will continue to show previous state.
      }
    },
    [loadCampaigns, openCampaign, selectedCampaign?.id]
  );

  const mapPrefillToWizard = (prefill: UpsertAdCampaignInput) => {
    setWizard((prev) => ({
      ...prev,
      name: prefill.name || prev.name,
      description: prefill.description || prev.description,
      productId: prefill.productId || prev.productId,
      targetingMode: prefill.targeting?.mode || prev.targetingMode,
      targetUserIds: (prefill.targeting?.userIds || []).join(", "),
      shopperCategories: (prefill.targeting?.shopperCategories || []).join(", "),
      shopperSubCategories: (prefill.targeting?.shopperSubCategories || []).join(", "),
      buyIntentCategories: (prefill.targeting?.buyIntentCategories || []).join(", "),
      buyIntentSubCategories: (prefill.targeting?.buyIntentSubCategories || []).join(", "),
      listedProductCategories: (prefill.targeting?.listedProductCategories || []).join(", "),
      listedProductSubCategories: (prefill.targeting?.listedProductSubCategories || []).join(", "),
      requireSameCategory: Boolean(prefill.targeting?.requireListedProductInSameCategory),
      lookbackDays: String(prefill.targeting?.lookbackDays || 60),
      startAt: prefill.schedule?.startAt ? new Date(prefill.schedule.startAt).toISOString().slice(0, 10) : "",
      endAt: prefill.schedule?.endAt ? new Date(prefill.schedule.endAt).toISOString().slice(0, 10) : "",
      frequencyCapPerDay: String(prefill.frequencyCapPerDay || 3),
      priority: String(prefill.priority || 50),
      creativeTitle: prefill.creative?.title || "",
      creativeSubtitle: prefill.creative?.subtitle || "",
      creativeCtaLabel: prefill.creative?.ctaLabel || "View Product",
      creativeBadge: prefill.creative?.badge || "",
      sourceRequestId: prefill.sourceServiceRequest || prev.sourceRequestId,
    }));
  };

  const loadPrefillFromRequest = useCallback(async () => {
    if (!wizard.sourceRequestId.trim()) {
      setWizardError("Enter a service request id first.");
      return;
    }
    try {
      setWizardError(null);
      const response = await adService.createFromRequest(wizard.sourceRequestId.trim(), { prefillOnly: true });
      mapPrefillToWizard(response.prefill);
      setWizardStep(0);
    } catch (err: any) {
      setWizardError(err?.message || "Could not load prefill from service request");
    }
  }, [wizard.sourceRequestId]);

  const canMoveNext = useMemo(() => {
    if (wizardStep === 0) {
      return Boolean(wizard.name.trim() && wizard.productId.trim());
    }
    return true;
  }, [wizard.name, wizard.productId, wizardStep]);

  const submitCampaign = useCallback(async () => {
    if (!wizard.name.trim()) {
      setWizardError("Campaign name is required.");
      return;
    }
    if (!wizard.productId.trim()) {
      setWizardError("Choose a promoted product.");
      return;
    }

    const payload: UpsertAdCampaignInput = {
      name: wizard.name.trim(),
      description: wizard.description.trim() || undefined,
      productId: wizard.productId.trim(),
      status: wizard.launchNow ? "active" : "draft",
      placements: ["dashboard_home"],
      targeting: {
        mode: wizard.targetingMode,
        userIds: splitCsv(wizard.targetUserIds),
        shopperCategories: splitCsv(wizard.shopperCategories),
        shopperSubCategories: splitCsv(wizard.shopperSubCategories),
        buyIntentCategories: splitCsv(wizard.buyIntentCategories),
        buyIntentSubCategories: splitCsv(wizard.buyIntentSubCategories),
        listedProductCategories: splitCsv(wizard.listedProductCategories),
        listedProductSubCategories: splitCsv(wizard.listedProductSubCategories),
        requireListedProductInSameCategory: wizard.requireSameCategory,
        lookbackDays: parsePositiveInt(wizard.lookbackDays, 60, 1, 365),
      },
      schedule: {
        startAt: parseDate(wizard.startAt),
        endAt: parseDate(wizard.endAt),
      },
      frequencyCapPerDay: parsePositiveInt(wizard.frequencyCapPerDay, 3, 1, 50),
      priority: parsePositiveInt(wizard.priority, 50, 1, 100),
      creative: {
        title: wizard.creativeTitle.trim() || undefined,
        subtitle: wizard.creativeSubtitle.trim() || undefined,
        ctaLabel: wizard.creativeCtaLabel.trim() || undefined,
        badge: wizard.creativeBadge.trim() || undefined,
      },
      sourceServiceRequest: wizard.sourceRequestId.trim() || undefined,
    };

    try {
      setSubmitting(true);
      setWizardError(null);
      const created = await adService.createCampaign(payload);
      setCreateMode(false);
      setWizard(initialWizardState);
      setWizardStep(0);
      await loadCampaigns();
      await openCampaign(created.id);
    } catch (err: any) {
      setWizardError(err?.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }, [loadCampaigns, openCampaign, wizard]);

  const productLookup = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((item) => map.set(item._id, item));
    return map;
  }, [products]);

  const selectedWizardProduct = productLookup.get(wizard.productId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Ad Studio</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Create and run targeted product advertisements</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setCreateMode((prev) => !prev);
            setWizardError(null);
          }}
          style={[styles.primaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
        >
          <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>{createMode ? "Close" : "New Ad"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={campaignsRefreshing} onRefresh={() => loadCampaigns(true)} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {createMode ? (
          <View style={[styles.card, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}>
            <View style={styles.stepHeader}>
              {["Select Product", "Define Targeting", "Schedule & Launch"].map((label, index) => {
                const active = wizardStep === index;
                return (
                  <View key={label} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        {
                          borderRadius: radius.pill,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? `${colors.primary}16` : colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Text style={[styles.stepDotText, { color: active ? colors.primary : colors.textMuted }]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.stepLabel, { color: active ? colors.text : colors.textMuted }]}>{label}</Text>
                  </View>
                );
              })}
            </View>

            {wizardStep === 0 ? (
              <View style={styles.stack}>
                <Field label="Campaign name" value={wizard.name} onChangeText={(value) => setWizard((prev) => ({ ...prev, name: value }))} required />
                <Field
                  label="Description"
                  value={wizard.description}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, description: value }))}
                  multiline
                />
                <Field
                  label="Search user-listed products"
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder="Name, SKU, category"
                />
                <TouchableOpacity
                  onPress={loadProducts}
                  style={[styles.ghostBtn, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}
                >
                  <Text style={[styles.ghostBtnText, { color: colors.text }]}>Refresh products</Text>
                </TouchableOpacity>
                {productsLoading ? (
                  <View style={styles.inlineLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {products.slice(0, 12).map((product) => {
                      const active = wizard.productId === product._id;
                      return (
                        <TouchableOpacity
                          key={product._id}
                          onPress={() => setWizard((prev) => ({ ...prev, productId: product._id }))}
                          style={[
                            styles.optionCard,
                            {
                              borderColor: active ? colors.primary : colors.border,
                              borderRadius: radius.md,
                              backgroundColor: active ? `${colors.primary}12` : colors.surface,
                            },
                          ]}
                        >
                          <Text style={[styles.optionTitle, { color: colors.text }]}>{product.name}</Text>
                          <Text style={[styles.optionMeta, { color: colors.textMuted }]}>
                            {product.category}
                            {product.subCategory ? ` • ${product.subCategory}` : ""}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                <Field
                  label="Selected product id"
                  value={wizard.productId}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, productId: value }))}
                  required
                />
              </View>
            ) : null}

            {wizardStep === 1 ? (
              <View style={styles.stack}>
                <View style={styles.row}>
                  {(["any", "all"] as const).map((mode) => {
                    const active = wizard.targetingMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => setWizard((prev) => ({ ...prev, targetingMode: mode }))}
                        style={[
                          styles.modeChip,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            borderRadius: radius.md,
                            backgroundColor: active ? `${colors.primary}12` : colors.surfaceElevated,
                          },
                        ]}
                      >
                        <Text style={[styles.modeText, { color: active ? colors.primary : colors.textMuted }]}>
                          {mode.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Field
                  label="Specific user IDs (comma separated)"
                  value={wizard.targetUserIds}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, targetUserIds: value }))}
                />
                <Field
                  label="Shopper categories"
                  value={wizard.shopperCategories}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, shopperCategories: value }))}
                />
                <Field
                  label="Shopper subcategories"
                  value={wizard.shopperSubCategories}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, shopperSubCategories: value }))}
                />
                <Field
                  label="Buy-intent categories"
                  value={wizard.buyIntentCategories}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, buyIntentCategories: value }))}
                />
                <Field
                  label="Buy-intent subcategories"
                  value={wizard.buyIntentSubCategories}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, buyIntentSubCategories: value }))}
                />
                <Field
                  label="Listed-product categories"
                  value={wizard.listedProductCategories}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, listedProductCategories: value }))}
                />
                <Field
                  label="Listed-product subcategories"
                  value={wizard.listedProductSubCategories}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, listedProductSubCategories: value }))}
                />
                <Field
                  label="Lookback days"
                  value={wizard.lookbackDays}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, lookbackDays: value.replace(/[^0-9]/g, "") }))}
                  keyboardType="number-pad"
                />
                <Toggle
                  label={
                    wizard.requireSameCategory
                      ? "Requires same-category listed product"
                      : "Same-category listed product not required"
                  }
                  value={wizard.requireSameCategory}
                  onPress={() => setWizard((prev) => ({ ...prev, requireSameCategory: !prev.requireSameCategory }))}
                />
              </View>
            ) : null}

            {wizardStep === 2 ? (
              <View style={styles.stack}>
                <Field label="Start date" value={wizard.startAt} onChangeText={(value) => setWizard((prev) => ({ ...prev, startAt: value }))} placeholder="YYYY-MM-DD" />
                <Field label="End date" value={wizard.endAt} onChangeText={(value) => setWizard((prev) => ({ ...prev, endAt: value }))} placeholder="YYYY-MM-DD" />
                <Field
                  label="Frequency cap / day"
                  value={wizard.frequencyCapPerDay}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, frequencyCapPerDay: value.replace(/[^0-9]/g, "") }))}
                  keyboardType="number-pad"
                />
                <Field
                  label="Priority (1-100)"
                  value={wizard.priority}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, priority: value.replace(/[^0-9]/g, "") }))}
                  keyboardType="number-pad"
                />
                <Field
                  label="Creative title"
                  value={wizard.creativeTitle}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, creativeTitle: value }))}
                />
                <Field
                  label="Creative subtitle"
                  value={wizard.creativeSubtitle}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, creativeSubtitle: value }))}
                />
                <Field
                  label="CTA label"
                  value={wizard.creativeCtaLabel}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, creativeCtaLabel: value }))}
                />
                <Field
                  label="Badge"
                  value={wizard.creativeBadge}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, creativeBadge: value }))}
                />
                <Field
                  label="From service request id (optional)"
                  value={wizard.sourceRequestId}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, sourceRequestId: value }))}
                />
                <TouchableOpacity
                  onPress={loadPrefillFromRequest}
                  style={[styles.ghostBtn, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}
                >
                  <Text style={[styles.ghostBtnText, { color: colors.text }]}>Load prefill from request</Text>
                </TouchableOpacity>
                <Toggle
                  label={wizard.launchNow ? "Launch immediately after create" : "Save as draft"}
                  value={wizard.launchNow}
                  onPress={() => setWizard((prev) => ({ ...prev, launchNow: !prev.launchNow }))}
                />
                {selectedWizardProduct ? (
                  <View style={[styles.previewCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.previewTitle, { color: colors.text }]}>Promoted product</Text>
                    <Text style={[styles.previewMeta, { color: colors.textMuted }]}>{selectedWizardProduct.name}</Text>
                    <Text style={[styles.previewMeta, { color: colors.textMuted }]}>
                      {selectedWizardProduct.category}
                      {selectedWizardProduct.subCategory ? ` • ${selectedWizardProduct.subCategory}` : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {wizardError ? <Text style={[styles.errorText, { color: colors.error }]}>{wizardError}</Text> : null}

            <View style={styles.footerActions}>
              <TouchableOpacity
                onPress={() => setWizardStep((prev) => Math.max(0, prev - 1))}
                disabled={wizardStep === 0 || submitting}
                style={[
                  styles.ghostBtn,
                  {
                    opacity: wizardStep === 0 ? 0.5 : 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceElevated,
                  },
                ]}
              >
                <Text style={[styles.ghostBtnText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
              {wizardStep < 2 ? (
                <TouchableOpacity
                  onPress={() => {
                    if (!canMoveNext) {
                      setWizardError("Campaign name and product are required.");
                      return;
                    }
                    setWizardError(null);
                    setWizardStep((prev) => Math.min(2, prev + 1));
                  }}
                  style={[styles.primaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={submitCampaign}
                  disabled={submitting}
                  style={[styles.primaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>
                    {submitting ? "Saving..." : wizard.launchNow ? "Create & Launch" : "Create Draft"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}

        <View style={[styles.card, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Campaigns</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{campaigns.length} total</Text>
          </View>

          {campaignsLoading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : campaignError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{campaignError}</Text>
          ) : campaigns.length === 0 ? (
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>No campaigns yet.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {campaigns.map((campaign) => {
                const tone = statusTone(campaign.status);
                return (
                  <TouchableOpacity
                    key={campaign.id}
                    onPress={() => openCampaign(campaign.id)}
                    style={[styles.optionCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[styles.optionTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                        {campaign.name}
                      </Text>
                      <View style={[styles.statusChip, { borderRadius: radius.pill, backgroundColor: tone.bg }]}>
                        <Text style={[styles.statusChipText, { color: tone.fg }]}>{campaign.status}</Text>
                      </View>
                    </View>
                    <Text style={[styles.optionMeta, { color: colors.textMuted }]} numberOfLines={1}>
                      {campaign.product?.name || "Product unavailable"}
                    </Text>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.optionMeta, { color: colors.textMuted }]}>Priority {campaign.priority}</Text>
                      <TouchableOpacity
                        onPress={() => onActivatePause(campaign)}
                        style={[styles.smallAction, { borderRadius: radius.pill, borderColor: colors.border, backgroundColor: colors.surface }]}
                      >
                        <Text style={[styles.smallActionText, { color: colors.text }]}>
                          {campaign.status === "active" ? "Pause" : "Activate"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {detailsLoading ? (
          <View style={[styles.card, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}>
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        ) : selectedCampaign ? (
          <View style={[styles.card, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{selectedCampaign.name}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {selectedCampaign.product?.name || "Missing product"}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {selectedCampaign.targeting?.mode?.toUpperCase() || "ANY"} targeting • cap {selectedCampaign.frequencyCapPerDay}/day
            </Text>
            {selectedInsights ? (
              <View style={[styles.previewCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>Insights</Text>
                <Text style={[styles.previewMeta, { color: colors.textMuted }]}>
                  Impressions: {selectedInsights.summary.impression.count} • Clicks: {selectedInsights.summary.click.count}
                </Text>
                <Text style={[styles.previewMeta, { color: colors.textMuted }]}>
                  Dismiss: {selectedInsights.summary.dismiss.count} • CTR: {selectedInsights.ctr}%
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
}) => {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
        {label}
        {required ? <Text style={{ color: colors.error }}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.fieldInput,
          {
            borderRadius: radius.md,
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
            color: colors.text,
            minHeight: multiline ? 78 : 44,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
      />
    </View>
  );
};

const Toggle = ({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) => {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.toggle,
        {
          borderRadius: radius.md,
          borderColor: value ? colors.primary : colors.border,
          backgroundColor: value ? `${colors.primary}12` : colors.surfaceElevated,
        },
      ]}
    >
      <Ionicons name={value ? "checkmark-circle" : "ellipse-outline"} size={16} color={value ? colors.primary : colors.textMuted} />
      <Text style={[styles.toggleText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "900" },
  subtitle: { marginTop: 2, fontSize: 12, fontWeight: "600" },
  card: { borderWidth: 1, padding: 12, gap: 10 },
  stepHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  stepItem: { flex: 1, alignItems: "center", gap: 6 },
  stepDot: {
    width: 28,
    height: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotText: { fontSize: 11, fontWeight: "900" },
  stepLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "700" },
  fieldInput: {
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "900" },
  sectionSubtitle: { fontSize: 12, fontWeight: "600" },
  stack: { gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  modeChip: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.3 },
  optionCard: { borderWidth: 1, padding: 10, gap: 4 },
  optionTitle: { fontSize: 13, fontWeight: "800" },
  optionMeta: { fontSize: 11, fontWeight: "600" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4 },
  statusChipText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  inlineLoading: { paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  primaryBtn: {
    minHeight: 40,
    minWidth: 100,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { fontSize: 12, fontWeight: "900" },
  ghostBtn: {
    minHeight: 40,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: { fontSize: 12, fontWeight: "800" },
  footerActions: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 2 },
  errorText: { fontSize: 12, fontWeight: "700" },
  toggle: {
    minHeight: 42,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleText: { fontSize: 12, fontWeight: "700", flex: 1 },
  previewCard: { borderWidth: 1, padding: 10, gap: 2 },
  previewTitle: { fontSize: 12, fontWeight: "800" },
  previewMeta: { fontSize: 11, fontWeight: "600" },
  smallAction: {
    minHeight: 28,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  smallActionText: { fontSize: 11, fontWeight: "800" },
});

export default AdStudioScreen;
