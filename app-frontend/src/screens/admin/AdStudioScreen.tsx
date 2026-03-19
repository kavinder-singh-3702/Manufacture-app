import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import { Product, ProductCategory, productService } from "../../services/product.service";
import { AdminUser, adminService } from "../../services/admin.service";
import { ServiceRequest, serviceRequestService } from "../../services/serviceRequest.service";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StudioRoute = RouteProp<RootStackParamList, "AdStudio">;

export type ProductSourceMode = "user_listings" | "admin_listings";
export type AudiencePreset =
  | "everyone"
  | "specific_users"
  | "shopper_category"
  | "buy_intent"
  | "same_category_listers";

type WizardState = {
  name: string;
  description: string;
  productSource: ProductSourceMode;
  ownerUserId: string;
  ownerUserName: string;
  productId: string;

  audiencePreset: AudiencePreset;
  targetingMode: "any" | "all";
  specificUserIds: string[];
  shopperCategories: string[];
  shopperSubCategories: string[];
  buyIntentCategories: string[];
  buyIntentSubCategories: string[];
  listedProductCategories: string[];
  listedProductSubCategories: string[];
  requireSameCategory: boolean;
  lookbackDays: string;
  advancedTargeting: boolean;

  startAt: string;
  endAt: string;
  frequencyCapPerDay: string;
  priority: string;

  creativeTitle: string;
  creativeSubtitle: string;
  creativeCtaLabel: string;
  creativeBadge: string;
  usePriceOverride: boolean;
  priceOverrideAmount: string;
  priceOverrideCurrency: string;

  launchNow: boolean;
  sourceRequestId: string;
};

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const APPROVED_REQUEST_STATUSES = ["in_review", "scheduled", "in_progress", "completed"] as const;
const CALENDAR_WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const toYmd = (value?: string | Date | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

const inferAudiencePreset = (prefill: UpsertAdCampaignInput): AudiencePreset => {
  const targeting = prefill.targeting || {};
  if ((targeting.userIds || []).length) return "specific_users";
  if (targeting.requireListedProductInSameCategory) return "same_category_listers";
  if ((targeting.buyIntentCategories || []).length || (targeting.buyIntentSubCategories || []).length) {
    return "buy_intent";
  }
  if ((targeting.shopperCategories || []).length || (targeting.shopperSubCategories || []).length) {
    return "shopper_category";
  }
  return "everyone";
};

const categoryTitle = (category: ProductCategory) => category.title || category.id;

const stepLabels = ["Source & Owner", "Select Product", "Audience", "Creative", "Schedule & Launch"];

export const AdStudioScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<StudioRoute>();

  const initialWizardState = useMemo<WizardState>(
    () => ({
      name: "",
      description: "",
      productSource: "user_listings",
      ownerUserId: route.params?.prefillOwnerUserId || "",
      ownerUserName: route.params?.prefillOwnerUserName || "",
      productId: "",

      audiencePreset: route.params?.prefillTargetUserId ? "specific_users" : "everyone",
      targetingMode: "any",
      specificUserIds: route.params?.prefillTargetUserId ? [route.params.prefillTargetUserId] : [],
      shopperCategories: [],
      shopperSubCategories: [],
      buyIntentCategories: [],
      buyIntentSubCategories: [],
      listedProductCategories: [],
      listedProductSubCategories: [],
      requireSameCategory: false,
      lookbackDays: "60",
      advancedTargeting: false,

      startAt: "",
      endAt: "",
      frequencyCapPerDay: "3",
      priority: "50",

      creativeTitle: "",
      creativeSubtitle: "",
      creativeCtaLabel: "View Product",
      creativeBadge: "",
      usePriceOverride: false,
      priceOverrideAmount: "",
      priceOverrideCurrency: "INR",

      launchNow: false,
      sourceRequestId: route.params?.prefillServiceRequestId || "",
    }),
    [
      route.params?.prefillOwnerUserId,
      route.params?.prefillOwnerUserName,
      route.params?.prefillServiceRequestId,
      route.params?.prefillTargetUserId,
    ]
  );

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsRefreshing, setCampaignsRefreshing] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<AdInsights | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [createMode, setCreateMode] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizard, setWizard] = useState<WizardState>(initialWizardState);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [approvedRequestsLoading, setApprovedRequestsLoading] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState<ServiceRequest[]>([]);
  const [requestProductsById, setRequestProductsById] = useState<Record<string, Product>>({});

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

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await adminService.listUsers({
        limit: 40,
        offset: 0,
        search: userSearch.trim() || undefined,
        sort: "updatedAt:desc",
      });
      setUsers(response.users || []);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await productService.getCategoryStats({ scope: "marketplace" });
      setCategories(response.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    if (wizard.productSource === "user_listings" && !wizard.ownerUserId.trim()) {
      setProducts([]);
      return;
    }

    try {
      setProductsLoading(true);
      const response = await productService.getAll({
        scope: "marketplace",
        status: "active",
        visibility: "public",
        createdByRole: wizard.productSource === "admin_listings" ? "admin" : "user",
        createdBy: wizard.productSource === "user_listings" ? wizard.ownerUserId : undefined,
        search: productSearch.trim() || undefined,
        limit: 80,
        offset: 0,
      });
      setProducts(response.products || []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [productSearch, wizard.ownerUserId, wizard.productSource]);

  const loadApprovedRequests = useCallback(async () => {
    if (wizard.productSource !== "user_listings" || !wizard.ownerUserId.trim()) {
      setApprovedRequests([]);
      setRequestProductsById({});
      return;
    }

    try {
      setApprovedRequestsLoading(true);
      const response = await serviceRequestService.list({
        serviceType: "advertisement",
        createdBy: wizard.ownerUserId,
        limit: 20,
        offset: 0,
        sort: "newest",
      });

      const requests = (response.services || []).filter((entry) =>
        APPROVED_REQUEST_STATUSES.includes(entry.status as (typeof APPROVED_REQUEST_STATUSES)[number])
      );
      setApprovedRequests(requests);

      const productIds = Array.from(
        new Set(
          requests
            .map((entry) => entry.advertisementDetails?.product)
            .filter((value): value is string => Boolean(value))
        )
      );

      if (!productIds.length) {
        setRequestProductsById({});
        return;
      }

      const settled = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const product = await productService.getById(productId, { scope: "marketplace" });
            return [productId, product] as const;
          } catch {
            return null;
          }
        })
      );

      const nextMap: Record<string, Product> = {};
      settled.forEach((entry) => {
        if (!entry) return;
        nextMap[entry[0]] = entry[1];
      });
      setRequestProductsById(nextMap);
    } catch {
      setApprovedRequests([]);
      setRequestProductsById({});
    } finally {
      setApprovedRequestsLoading(false);
    }
  }, [wizard.ownerUserId, wizard.productSource]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (!createMode) return;
    loadCategories();
  }, [createMode, loadCategories]);

  useEffect(() => {
    if (!createMode) return;
    const timer = setTimeout(loadUsers, 220);
    return () => clearTimeout(timer);
  }, [createMode, loadUsers]);

  useEffect(() => {
    if (!createMode) return;
    const timer = setTimeout(loadProducts, 220);
    return () => clearTimeout(timer);
  }, [createMode, loadProducts]);

  useEffect(() => {
    if (!createMode) return;
    const timer = setTimeout(loadApprovedRequests, 220);
    return () => clearTimeout(timer);
  }, [createMode, loadApprovedRequests]);

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
        // Preserve UI state.
      }
    },
    [loadCampaigns, openCampaign, selectedCampaign?.id]
  );

  const usersById = useMemo(() => {
    const map = new Map<string, AdminUser>();
    users.forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [users]);

  const categoryOptions = useMemo(
    () => categories.map((entry) => ({ id: entry.id, title: categoryTitle(entry) })),
    [categories]
  );

  const selectedProduct = useMemo(() => {
    const inList = products.find((entry) => entry._id === wizard.productId);
    if (inList) return inList;
    if (selectedProductDetail?._id === wizard.productId) return selectedProductDetail;
    return null;
  }, [products, selectedProductDetail, wizard.productId]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!wizard.productId) {
        setSelectedProductDetail(null);
        return;
      }

      const inList = products.find((entry) => entry._id === wizard.productId);
      if (inList) {
        setSelectedProductDetail(inList);
        return;
      }

      try {
        const product = await productService.getById(wizard.productId, { scope: "marketplace" });
        if (!cancelled) setSelectedProductDetail(product);
      } catch {
        if (!cancelled) setSelectedProductDetail(null);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [products, wizard.productId]);

  const setAudiencePreset = useCallback((preset: AudiencePreset) => {
    setWizard((prev) => {
      const resetCommon = {
        ...prev,
        audiencePreset: preset,
      };

      if (preset === "everyone") {
        return {
          ...resetCommon,
          specificUserIds: [],
          shopperCategories: [],
          shopperSubCategories: [],
          buyIntentCategories: [],
          buyIntentSubCategories: [],
          listedProductCategories: [],
          listedProductSubCategories: [],
          requireSameCategory: false,
        };
      }

      if (preset === "specific_users") {
        return {
          ...resetCommon,
          shopperCategories: [],
          shopperSubCategories: [],
          buyIntentCategories: [],
          buyIntentSubCategories: [],
          listedProductCategories: [],
          listedProductSubCategories: [],
          requireSameCategory: false,
        };
      }

      if (preset === "shopper_category") {
        return {
          ...resetCommon,
          specificUserIds: [],
          buyIntentCategories: [],
          buyIntentSubCategories: [],
          listedProductCategories: [],
          listedProductSubCategories: [],
          requireSameCategory: false,
        };
      }

      if (preset === "buy_intent") {
        return {
          ...resetCommon,
          specificUserIds: [],
          shopperCategories: [],
          shopperSubCategories: [],
          listedProductCategories: [],
          listedProductSubCategories: [],
          requireSameCategory: false,
        };
      }

      return {
        ...resetCommon,
        specificUserIds: [],
        shopperCategories: [],
        shopperSubCategories: [],
        buyIntentCategories: [],
        buyIntentSubCategories: [],
        requireSameCategory: true,
      };
    });
  }, []);

  const ensureOwnerName = useCallback(
    (ownerId: string) => {
      if (!ownerId) return "";
      const existing = usersById.get(ownerId);
      if (existing) return existing.displayName || existing.email;
      return "";
    },
    [usersById]
  );

  const applyProductOwnershipContext = useCallback(
    (product?: Product | null) => {
      if (!product) return;
      const creatorRole = product.createdByRole === "admin" ? "admin" : "user";
      const ownerId = String(product.createdBy || "");

      setWizard((prev) => ({
        ...prev,
        productSource: creatorRole === "admin" ? "admin_listings" : "user_listings",
        ownerUserId: creatorRole === "user" ? ownerId : "",
        ownerUserName: creatorRole === "user" ? ensureOwnerName(ownerId) || prev.ownerUserName : "",
        productId: product._id,
      }));
    },
    [ensureOwnerName]
  );

  const mapPrefillToWizard = useCallback((prefill: UpsertAdCampaignInput) => {
    setWizard((prev) => ({
      ...prev,
      name: prefill.name || prev.name,
      description: prefill.description || prev.description,
      productId: prefill.productId || prev.productId,
      audiencePreset: inferAudiencePreset(prefill),
      targetingMode: prefill.targeting?.mode || prev.targetingMode,
      specificUserIds: prefill.targeting?.userIds || [],
      shopperCategories: prefill.targeting?.shopperCategories || [],
      shopperSubCategories: prefill.targeting?.shopperSubCategories || [],
      buyIntentCategories: prefill.targeting?.buyIntentCategories || [],
      buyIntentSubCategories: prefill.targeting?.buyIntentSubCategories || [],
      listedProductCategories: prefill.targeting?.listedProductCategories || [],
      listedProductSubCategories: prefill.targeting?.listedProductSubCategories || [],
      requireSameCategory: Boolean(prefill.targeting?.requireListedProductInSameCategory),
      lookbackDays: String(prefill.targeting?.lookbackDays || 60),
      startAt: toYmd(prefill.schedule?.startAt),
      endAt: toYmd(prefill.schedule?.endAt),
      frequencyCapPerDay: String(prefill.frequencyCapPerDay || 3),
      priority: String(prefill.priority || 50),
      creativeTitle: prefill.creative?.title || "",
      creativeSubtitle: prefill.creative?.subtitle || "",
      creativeCtaLabel: prefill.creative?.ctaLabel || "View Product",
      creativeBadge: prefill.creative?.badge || "",
      usePriceOverride: Boolean(prefill.creative?.priceOverride?.amount),
      priceOverrideAmount:
        prefill.creative?.priceOverride?.amount != null ? String(prefill.creative.priceOverride.amount) : "",
      priceOverrideCurrency: prefill.creative?.priceOverride?.currency || selectedProduct?.price?.currency || "INR",
      sourceRequestId: prefill.sourceServiceRequest || prev.sourceRequestId,
      launchNow: false,
    }));
  }, [selectedProduct?.price?.currency]);

  const applyRequestPrefill = useCallback(
    async (serviceRequestId: string) => {
      const trimmed = serviceRequestId.trim();
      if (!trimmed) {
        setWizardError("Invalid advertisement request.");
        return;
      }

      try {
        setWizardError(null);
        const response = await adService.createFromRequest(trimmed, { prefillOnly: true });
        mapPrefillToWizard(response.prefill);

        if (response.prefill?.productId) {
          try {
            const product = await productService.getById(response.prefill.productId, { scope: "marketplace" });
            setSelectedProductDetail(product);
            applyProductOwnershipContext(product);
          } catch {
            // Product context best effort.
          }
        }

        setWizard((prev) => ({ ...prev, sourceRequestId: trimmed }));
        setWizardStep(0);
      } catch (err: any) {
        setWizardError(err?.message || "Could not load prefill from service request");
      }
    },
    [applyProductOwnershipContext, mapPrefillToWizard]
  );

  const autoPrefilledRequestRef = useRef<string | null>(null);

  useEffect(() => {
    const routeRequestId = route.params?.prefillServiceRequestId?.trim();
    if (!createMode || !routeRequestId) return;
    if (autoPrefilledRequestRef.current === routeRequestId) return;
    autoPrefilledRequestRef.current = routeRequestId;
    applyRequestPrefill(routeRequestId);
  }, [applyRequestPrefill, createMode, route.params?.prefillServiceRequestId]);

  const selectedOwner = useMemo(
    () => usersById.get(wizard.ownerUserId) || null,
    [usersById, wizard.ownerUserId]
  );

  useEffect(() => {
    if (wizard.ownerUserId && selectedOwner) {
      setWizard((prev) => ({
        ...prev,
        ownerUserName: selectedOwner.displayName || selectedOwner.email,
      }));
    }
  }, [selectedOwner, wizard.ownerUserId]);

  const validateStep = useCallback(
    (step: number): string | null => {
      if (step === 0) {
        if (!wizard.name.trim()) return "Campaign name is required.";
        if (wizard.productSource === "user_listings" && !wizard.ownerUserId.trim()) {
          return "Select an owner user for user listings.";
        }
        return null;
      }

      if (step === 1) {
        if (!wizard.productId.trim()) return "Select a promoted product.";
        return null;
      }

      if (step === 2) {
        if (wizard.audiencePreset === "specific_users" && wizard.specificUserIds.length === 0) {
          return "Select at least one specific user.";
        }
        if (
          wizard.audiencePreset === "shopper_category" &&
          wizard.shopperCategories.length === 0 &&
          wizard.shopperSubCategories.length === 0
        ) {
          return "Choose at least one shopper category or subcategory.";
        }
        if (
          wizard.audiencePreset === "buy_intent" &&
          wizard.buyIntentCategories.length === 0 &&
          wizard.buyIntentSubCategories.length === 0
        ) {
          return "Choose at least one buy-intent category or subcategory.";
        }
        return null;
      }

      if (step === 3) {
        if (wizard.usePriceOverride) {
          const parsed = Number(wizard.priceOverrideAmount);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            return "Discounted ad price must be greater than 0.";
          }

          const listed = Number(selectedProduct?.price?.amount);
          if (Number.isFinite(listed) && listed > 0 && parsed > listed) {
            return "Discounted ad price cannot exceed listed product price.";
          }
        }
        return null;
      }

      if (step === 4) {
        const startAt = parseDate(wizard.startAt);
        const endAt = parseDate(wizard.endAt);
        if (wizard.startAt.trim() && !startAt) return "Start date is invalid. Use YYYY-MM-DD.";
        if (wizard.endAt.trim() && !endAt) return "End date is invalid. Use YYYY-MM-DD.";
        if (startAt && endAt && startAt.getTime() > endAt.getTime()) {
          return "End date must be after start date.";
        }
      }

      return null;
    },
    [selectedProduct?.price?.amount, wizard]
  );

  const currentStepError = useMemo(() => validateStep(wizardStep), [validateStep, wizardStep]);

  const toggleUserId = useCallback((userId: string) => {
    setWizard((prev) => {
      const exists = prev.specificUserIds.includes(userId);
      return {
        ...prev,
        specificUserIds: exists
          ? prev.specificUserIds.filter((id) => id !== userId)
          : [...prev.specificUserIds, userId],
      };
    });
  }, []);

  const toggleCategory = useCallback((key: "shopperCategories" | "buyIntentCategories" | "listedProductCategories", categoryId: string) => {
    setWizard((prev) => {
      const current = prev[key];
      const exists = current.includes(categoryId);
      return {
        ...prev,
        [key]: exists ? current.filter((id) => id !== categoryId) : [...current, categoryId],
      } as WizardState;
    });
  }, []);

  const submitCampaign = useCallback(async () => {
    const finalStepError = validateStep(4);
    if (finalStepError) {
      setWizardError(finalStepError);
      return;
    }

    const shouldRequireSameCategory =
      wizard.audiencePreset === "same_category_listers" || wizard.requireSameCategory;

    const payload: UpsertAdCampaignInput = {
      name: wizard.name.trim(),
      description: wizard.description.trim() || undefined,
      productId: wizard.productId.trim(),
      status: wizard.launchNow ? "active" : "draft",
      placements: ["dashboard_home"],
      targeting: {
        mode: wizard.targetingMode,
        userIds: wizard.specificUserIds,
        shopperCategories: wizard.shopperCategories,
        shopperSubCategories: wizard.shopperSubCategories,
        buyIntentCategories: wizard.buyIntentCategories,
        buyIntentSubCategories: wizard.buyIntentSubCategories,
        listedProductCategories: wizard.listedProductCategories,
        listedProductSubCategories: wizard.listedProductSubCategories,
        requireListedProductInSameCategory: shouldRequireSameCategory,
        lookbackDays: parsePositiveInt(wizard.lookbackDays, 60, 1, 365),
      },
      schedule: {
        startAt: parseDate(wizard.startAt),
        endAt: parseDate(wizard.endAt),
      },
      frequencyCapPerDay: parsePositiveInt(wizard.frequencyCapPerDay, 3, 1, 50),
      priority: parsePositiveInt(wizard.priority, 50, 1, 100),
      creative: {
        priceOverride:
          wizard.usePriceOverride && wizard.priceOverrideAmount.trim()
            ? {
                amount: Number(wizard.priceOverrideAmount),
                currency:
                  wizard.priceOverrideCurrency.trim().toUpperCase() ||
                  selectedProduct?.price?.currency ||
                  "INR",
                unit: selectedProduct?.price?.unit,
              }
            : undefined,
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
      setProductSearch("");
      setUserSearch("");
      setSelectedProductDetail(null);
      await loadCampaigns();
      await openCampaign(created.id);
    } catch (err: any) {
      setWizardError(err?.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }, [initialWizardState, loadCampaigns, openCampaign, validateStep, wizard]);

  const stepSummary = useMemo(() => {
    if (wizard.audiencePreset === "everyone") return "Everyone";
    if (wizard.audiencePreset === "specific_users") {
      return `${wizard.specificUserIds.length} specific user${wizard.specificUserIds.length === 1 ? "" : "s"}`;
    }
    if (wizard.audiencePreset === "shopper_category") {
      return `Shopper signals • ${wizard.shopperCategories.length} categories`;
    }
    if (wizard.audiencePreset === "buy_intent") {
      return `Buy intent • ${wizard.buyIntentCategories.length} categories`;
    }
    return "Users with same-category listings";
  }, [wizard.audiencePreset, wizard.buyIntentCategories.length, wizard.shopperCategories.length, wizard.specificUserIds.length]);

  const listedPriceAmount = Number(selectedProduct?.price?.amount);
  const listedPriceCurrency = selectedProduct?.price?.currency || "INR";
  const overridePriceAmount = Number(wizard.priceOverrideAmount);
  const hasValidOverride = Number.isFinite(overridePriceAmount) && overridePriceAmount > 0;

  const goNext = () => {
    const error = validateStep(wizardStep);
    if (error) {
      setWizardError(error);
      return;
    }
    setWizardError(null);
    setWizardStep((prev) => Math.min(stepLabels.length - 1, prev + 1));
  };

  const closeCreate = () => {
    setCreateMode(false);
    setWizardError(null);
    setWizard(initialWizardState);
    setWizardStep(0);
    setUserSearch("");
    setProductSearch("");
    setSelectedProductDetail(null);
    setApprovedRequests([]);
    setRequestProductsById({});
    autoPrefilledRequestRef.current = null;
  };

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
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Build targeted product ads in guided steps</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (createMode) {
              closeCreate();
              return;
            }
            setCreateMode(true);
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Create Campaign</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Step {wizardStep + 1} of {stepLabels.length}</Text>

            <View style={styles.stepHeader}>
              {stepLabels.map((label, index) => {
                const active = wizardStep === index;
                const done = wizardStep > index;
                return (
                  <View key={label} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        {
                          borderRadius: radius.pill,
                          borderColor: active || done ? colors.primary : colors.border,
                          backgroundColor: done ? `${colors.primary}20` : active ? `${colors.primary}12` : colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Text style={[styles.stepDotText, { color: active || done ? colors.primary : colors.textMuted }]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.stepLabel, { color: active ? colors.text : colors.textMuted }]}>{label}</Text>
                  </View>
                );
              })}
            </View>

            {wizardStep === 0 ? (
              <View style={styles.stack}>
                <Field
                  label="Campaign name"
                  value={wizard.name}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, name: value }))}
                  required
                  placeholder="e.g. Bearings push - East zone"
                />
                <Field
                  label="Description"
                  value={wizard.description}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, description: value }))}
                  multiline
                />

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Product source</Text>
                <View style={styles.row}>
                  <SelectCard
                    icon="people-outline"
                    title="User listings"
                    subtitle="Promote products listed by marketplace users"
                    active={wizard.productSource === "user_listings"}
                    onPress={() =>
                      setWizard((prev) => ({
                        ...prev,
                        productSource: "user_listings",
                        productId: "",
                        sourceRequestId: "",
                      }))
                    }
                  />
                  <SelectCard
                    icon="shield-checkmark-outline"
                    title="Admin listings"
                    subtitle="Promote admin-created public listings"
                    active={wizard.productSource === "admin_listings"}
                    onPress={() =>
                      setWizard((prev) => ({
                        ...prev,
                        productSource: "admin_listings",
                        ownerUserId: "",
                        ownerUserName: "",
                        productId: "",
                        sourceRequestId: "",
                      }))
                    }
                  />
                </View>

                {wizard.productSource === "user_listings" ? (
                  <View style={styles.stack}>
                    <Field
                      label="Find user owner"
                      value={userSearch}
                      onChangeText={setUserSearch}
                      placeholder="Search by name, email, phone"
                    />
                    {usersLoading ? (
                      <View style={styles.inlineLoading}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    ) : users.length === 0 ? (
                      <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>No users found.</Text>
                    ) : (
                      <View style={{ gap: 8 }}>
                        {users.slice(0, 8).map((entry) => {
                          const active = wizard.ownerUserId === entry.id;
                          return (
                            <TouchableOpacity
                              key={entry.id}
                              onPress={() =>
                                setWizard((prev) => ({
                                  ...prev,
                                  ownerUserId: entry.id,
                                  ownerUserName: entry.displayName || entry.email,
                                  productId: "",
                                  sourceRequestId: "",
                                }))
                              }
                              style={[
                                styles.optionCard,
                                {
                                  borderColor: active ? colors.primary : colors.border,
                                  borderRadius: radius.md,
                                  backgroundColor: active ? `${colors.primary}12` : colors.surfaceElevated,
                                },
                              ]}
                            >
                              <Text style={[styles.optionTitle, { color: colors.text }]}>{entry.displayName || "Unnamed user"}</Text>
                              <Text style={[styles.optionMeta, { color: colors.textMuted }]}>{entry.email}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {wizard.ownerUserId ? (
                      <InfoLine
                        label="Selected owner"
                        value={wizard.ownerUserName || selectedOwner?.displayName || selectedOwner?.email || wizard.ownerUserId}
                      />
                    ) : null}
                  </View>
                ) : (
                  <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Owner selection is skipped for admin listings.</Text>
                )}

                {wizard.productSource === "user_listings" && wizard.ownerUserId ? (
                  approvedRequestsLoading ? (
                    <View style={styles.inlineLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : approvedRequests.length ? (
                    <View
                      style={[
                        styles.previewCard,
                        { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated },
                      ]}
                    >
                      <Text style={[styles.previewTitle, { color: colors.text }]}>Import from approved request</Text>
                      <Text style={[styles.previewMeta, { color: colors.textMuted }]}>
                        Select a request to prefill product, audience, schedule, and creative.
                      </Text>
                      <View style={{ gap: 8 }}>
                        {approvedRequests.slice(0, 6).map((request) => {
                          const requestProductId = request.advertisementDetails?.product || "";
                          const requestProduct = requestProductsById[requestProductId];
                          return (
                            <TouchableOpacity
                              key={request._id}
                              onPress={() => applyRequestPrefill(request._id)}
                              style={[
                                styles.optionCard,
                                {
                                  borderColor: colors.border,
                                  borderRadius: radius.md,
                                  backgroundColor:
                                    wizard.sourceRequestId === request._id
                                      ? `${colors.primary}12`
                                      : colors.surface,
                                },
                              ]}
                            >
                              <View style={styles.rowBetween}>
                                <Text style={[styles.optionTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                                  {request.title || "Advertisement request"}
                                </Text>
                                <View
                                  style={[
                                    styles.statusChip,
                                    { borderRadius: radius.pill, backgroundColor: colors.badgeInfo },
                                  ]}
                                >
                                  <Text style={[styles.statusChipText, { color: colors.info }]}>
                                    {request.status.replace("_", " ")}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.optionMeta, { color: colors.textMuted }]}>
                                {requestProduct?.name || requestProductId || "Product unavailable"}
                              </Text>
                              <Text style={[styles.optionMeta, { color: colors.textMuted }]}>
                                {requestProduct?.category
                                  ? `${requestProduct.category}${
                                      requestProduct.subCategory ? ` • ${requestProduct.subCategory}` : ""
                                    }`
                                  : "Owner-approved request"}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : null
                ) : null}
              </View>
            ) : null}

            {wizardStep === 1 ? (
              <View style={styles.stack}>
                <Field
                  label="Search products"
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

                {wizard.productSource === "user_listings" && !wizard.ownerUserId ? (
                  <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Select an owner user in Step 1 to load products.</Text>
                ) : productsLoading ? (
                  <View style={styles.inlineLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : products.length === 0 ? (
                  <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>No products found for this source.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {products.slice(0, 16).map((product) => {
                      const active = wizard.productId === product._id;
                      const ownerName = usersById.get(String(product.createdBy || ""))?.displayName;
                      return (
                        <TouchableOpacity
                          key={product._id}
                          onPress={() => setWizard((prev) => ({ ...prev, productId: product._id }))}
                          style={[
                            styles.optionCard,
                            {
                              borderColor: active ? colors.primary : colors.border,
                              borderRadius: radius.md,
                              backgroundColor: active ? `${colors.primary}12` : colors.surfaceElevated,
                            },
                          ]}
                        >
                          <View style={styles.rowBetween}>
                            <Text style={[styles.optionTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>{product.name}</Text>
                            {active ? <Ionicons name="checkmark-circle" size={16} color={colors.primary} /> : null}
                          </View>
                          <Text style={[styles.optionMeta, { color: colors.textMuted }]}>
                            {product.category}{product.subCategory ? ` • ${product.subCategory}` : ""}
                          </Text>
                          <Text style={[styles.optionMeta, { color: colors.textMuted }]}>Owner: {ownerName || product.createdByRole || "-"}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {selectedProduct ? (
                  <View style={[styles.previewCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}> 
                    <Text style={[styles.previewTitle, { color: colors.text }]}>Selected product</Text>
                    <Text style={[styles.previewMeta, { color: colors.textMuted }]}>{selectedProduct.name}</Text>
                    <Text style={[styles.previewMeta, { color: colors.textMuted }]}>
                      {selectedProduct.category}{selectedProduct.subCategory ? ` • ${selectedProduct.subCategory}` : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {wizardStep === 2 ? (
              <View style={styles.stack}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Audience preset</Text>
                <View style={styles.presetWrap}>
                  {([
                    { key: "everyone", label: "Everyone", icon: "globe-outline" },
                    { key: "specific_users", label: "Specific users", icon: "person-outline" },
                    { key: "shopper_category", label: "Shopper category", icon: "layers-outline" },
                    { key: "buy_intent", label: "Buy intent", icon: "pulse-outline" },
                    { key: "same_category_listers", label: "Same-category listers", icon: "git-compare-outline" },
                  ] as Array<{ key: AudiencePreset; label: string; icon: keyof typeof Ionicons.glyphMap }>).map((preset) => {
                    const active = wizard.audiencePreset === preset.key;
                    return (
                      <TouchableOpacity
                        key={preset.key}
                        onPress={() => setAudiencePreset(preset.key)}
                        style={[
                          styles.presetCard,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            borderRadius: radius.md,
                            backgroundColor: active ? `${colors.primary}12` : colors.surfaceElevated,
                          },
                        ]}
                      >
                        <Ionicons name={preset.icon} size={14} color={active ? colors.primary : colors.textMuted} />
                        <Text style={[styles.presetText, { color: active ? colors.primary : colors.text }]}>{preset.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {wizard.audiencePreset === "specific_users" ? (
                  <View style={styles.stack}>
                    <Field
                      label="Find users"
                      value={userSearch}
                      onChangeText={setUserSearch}
                      placeholder="Search users for direct targeting"
                    />
                    {usersLoading ? (
                      <View style={styles.inlineLoading}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    ) : (
                      <View style={{ gap: 8 }}>
                        {users.slice(0, 10).map((entry) => {
                          const active = wizard.specificUserIds.includes(entry.id);
                          return (
                            <TouchableOpacity
                              key={entry.id}
                              onPress={() => toggleUserId(entry.id)}
                              style={[
                                styles.optionCard,
                                {
                                  borderColor: active ? colors.primary : colors.border,
                                  borderRadius: radius.md,
                                  backgroundColor: active ? `${colors.primary}12` : colors.surfaceElevated,
                                },
                              ]}
                            >
                              <View style={styles.rowBetween}>
                                <Text style={[styles.optionTitle, { color: colors.text }]}>{entry.displayName || "Unnamed user"}</Text>
                                {active ? <Ionicons name="checkmark-circle" size={16} color={colors.primary} /> : null}
                              </View>
                              <Text style={[styles.optionMeta, { color: colors.textMuted }]}>{entry.email}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ) : null}

                {wizard.audiencePreset === "shopper_category" ? (
                  <View style={styles.stack}>
                    <CategoryChips
                      label="Shopper categories"
                      options={categoryOptions}
                      selected={wizard.shopperCategories}
                      loading={categoriesLoading}
                      onToggle={(value) => toggleCategory("shopperCategories", value)}
                    />
                    <TagEditor
                      label="Shopper subcategories"
                      values={wizard.shopperSubCategories}
                      placeholder="Add subcategory and tap +"
                      onChange={(values) => setWizard((prev) => ({ ...prev, shopperSubCategories: values }))}
                    />
                  </View>
                ) : null}

                {wizard.audiencePreset === "buy_intent" ? (
                  <View style={styles.stack}>
                    <CategoryChips
                      label="Buy-intent categories"
                      options={categoryOptions}
                      selected={wizard.buyIntentCategories}
                      loading={categoriesLoading}
                      onToggle={(value) => toggleCategory("buyIntentCategories", value)}
                    />
                    <TagEditor
                      label="Buy-intent subcategories"
                      values={wizard.buyIntentSubCategories}
                      placeholder="Add subcategory and tap +"
                      onChange={(values) => setWizard((prev) => ({ ...prev, buyIntentSubCategories: values }))}
                    />
                  </View>
                ) : null}

                {wizard.audiencePreset === "same_category_listers" ? (
                  <View style={[styles.previewCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}> 
                    <Text style={[styles.previewTitle, { color: colors.text }]}>Same-category listing rule</Text>
                    <Text style={[styles.previewMeta, { color: colors.textMuted }]}>Users who have active public listings in the same category as this promoted product.</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={() => setWizard((prev) => ({ ...prev, advancedTargeting: !prev.advancedTargeting }))}
                  style={[styles.ghostBtn, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}
                >
                  <Text style={[styles.ghostBtnText, { color: colors.text }]}>
                    {wizard.advancedTargeting ? "Hide advanced rules" : "Show advanced rules"}
                  </Text>
                </TouchableOpacity>

                {wizard.advancedTargeting ? (
                  <View style={[styles.previewCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}> 
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
                                backgroundColor: active ? `${colors.primary}12` : colors.surface,
                              },
                            ]}
                          >
                            <Text style={[styles.modeText, { color: active ? colors.primary : colors.textMuted }]}>{mode.toUpperCase()}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Field
                      label="Lookback days"
                      value={wizard.lookbackDays}
                      onChangeText={(value) => setWizard((prev) => ({ ...prev, lookbackDays: value.replace(/[^0-9]/g, "") }))}
                      keyboardType="number-pad"
                    />
                    <CategoryChips
                      label="Listed-product categories"
                      options={categoryOptions}
                      selected={wizard.listedProductCategories}
                      loading={categoriesLoading}
                      onToggle={(value) => toggleCategory("listedProductCategories", value)}
                    />
                    <TagEditor
                      label="Listed-product subcategories"
                      values={wizard.listedProductSubCategories}
                      placeholder="Add subcategory and tap +"
                      onChange={(values) => setWizard((prev) => ({ ...prev, listedProductSubCategories: values }))}
                    />
                    <Toggle
                      label={wizard.requireSameCategory ? "Require same-category listing" : "Same-category rule optional"}
                      value={wizard.requireSameCategory}
                      onPress={() => setWizard((prev) => ({ ...prev, requireSameCategory: !prev.requireSameCategory }))}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}

            {wizardStep === 3 ? (
              <View style={styles.stack}>
                <Field
                  label="Creative title"
                  value={wizard.creativeTitle}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, creativeTitle: value }))}
                  placeholder="Optional override title"
                />
                <Field
                  label="Creative subtitle"
                  value={wizard.creativeSubtitle}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, creativeSubtitle: value }))}
                  placeholder="Optional supporting text"
                />
                <Field
                  label="CTA label"
                  value={wizard.creativeCtaLabel}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, creativeCtaLabel: value }))}
                  placeholder="View Product"
                />
                <Field
                  label="Badge"
                  value={wizard.creativeBadge}
                  onChangeText={(value) => setWizard((prev) => ({ ...prev, creativeBadge: value }))}
                  placeholder="Sponsored / New / Hot"
                />

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Price in ad</Text>
                <View style={styles.row}>
                  <SelectCard
                    icon="pricetag-outline"
                    title="Use listed price"
                    subtitle="Show seller-listed product price"
                    active={!wizard.usePriceOverride}
                    onPress={() =>
                      setWizard((prev) => ({
                        ...prev,
                        usePriceOverride: false,
                        priceOverrideAmount: "",
                        priceOverrideCurrency: selectedProduct?.price?.currency || prev.priceOverrideCurrency || "INR",
                      }))
                    }
                  />
                  <SelectCard
                    icon="flash-outline"
                    title="Set ad price"
                    subtitle="Promote with a lower discounted price"
                    active={wizard.usePriceOverride}
                    onPress={() =>
                      setWizard((prev) => ({
                        ...prev,
                        usePriceOverride: true,
                        priceOverrideCurrency: selectedProduct?.price?.currency || prev.priceOverrideCurrency || "INR",
                      }))
                    }
                  />
                </View>

                {wizard.usePriceOverride ? (
                  <View style={styles.stack}>
                    <Field
                      label="Discounted ad price"
                      value={wizard.priceOverrideAmount}
                      onChangeText={(value) =>
                        setWizard((prev) => ({ ...prev, priceOverrideAmount: value.replace(/[^0-9.]/g, "") }))
                      }
                      keyboardType="number-pad"
                      placeholder="Enter lower price"
                    />
                    <Field
                      label="Price currency"
                      value={wizard.priceOverrideCurrency}
                      onChangeText={(value) =>
                        setWizard((prev) => ({ ...prev, priceOverrideCurrency: value.toUpperCase() }))
                      }
                      placeholder={selectedProduct?.price?.currency || "INR"}
                    />
                    {Number.isFinite(listedPriceAmount) && listedPriceAmount > 0 && hasValidOverride ? (
                      <InfoLine
                        label="You save"
                        value={`${listedPriceCurrency} ${Math.max(0, listedPriceAmount - overridePriceAmount).toFixed(2)}`}
                      />
                    ) : null}
                  </View>
                ) : null}

                <View style={[styles.previewCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}> 
                  <Text style={[styles.previewTitle, { color: colors.text }]}>Live preview</Text>
                  {wizard.creativeBadge.trim() ? (
                    <View style={[styles.statusChip, { borderRadius: radius.pill, backgroundColor: colors.badgeWarning, alignSelf: "flex-start" }]}> 
                      <Text style={[styles.statusChipText, { color: colors.warningStrong }]}>{wizard.creativeBadge.trim()}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.optionTitle, { color: colors.text }]}> 
                    {wizard.creativeTitle.trim() || selectedProduct?.name || "Featured product"}
                  </Text>
                  <Text style={[styles.optionMeta, { color: colors.textMuted }]}> 
                    {wizard.creativeSubtitle.trim() || selectedProduct?.company?.displayName || "Recommended for your dashboard"}
                  </Text>
                  {selectedProduct?.price?.amount != null ? (
                    <View style={styles.row}>
                      {wizard.usePriceOverride && hasValidOverride ? (
                        <Text style={[styles.optionMeta, { color: colors.textMuted, textDecorationLine: "line-through" }]}>
                          {`${selectedProduct?.price?.currency || "INR"} ${Number(selectedProduct.price.amount).toFixed(2)}`}
                        </Text>
                      ) : null}
                      <Text style={[styles.optionTitle, { color: colors.primary }]}>
                        {`${wizard.usePriceOverride && hasValidOverride
                          ? wizard.priceOverrideCurrency || selectedProduct?.price?.currency || "INR"
                          : selectedProduct?.price?.currency || "INR"} ${(
                          wizard.usePriceOverride && hasValidOverride
                            ? overridePriceAmount
                            : Number(selectedProduct.price.amount)
                        ).toFixed(2)}`}
                      </Text>
                    </View>
                  ) : null}
                  <View style={[styles.smallAction, { borderColor: colors.primary, borderRadius: radius.pill, backgroundColor: `${colors.primary}12`, alignSelf: "flex-start" }]}> 
                    <Text style={[styles.smallActionText, { color: colors.primary }]}>{wizard.creativeCtaLabel.trim() || "View Product"}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {wizardStep === 4 ? (
              <View style={styles.stack}>
                <CalendarDateField
                  label="Start date"
                  value={wizard.startAt}
                  onChange={(value) => setWizard((prev) => ({ ...prev, startAt: value }))}
                />
                <CalendarDateField
                  label="End date"
                  value={wizard.endAt}
                  onChange={(value) => setWizard((prev) => ({ ...prev, endAt: value }))}
                />
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

                <Toggle
                  label={wizard.launchNow ? "Launch immediately after create" : "Save as draft (default)"}
                  value={wizard.launchNow}
                  onPress={() => setWizard((prev) => ({ ...prev, launchNow: !prev.launchNow }))}
                />

                <View style={[styles.previewCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}> 
                  <Text style={[styles.previewTitle, { color: colors.text }]}>Review</Text>
                  <InfoLine label="Campaign" value={wizard.name || "-"} />
                  <InfoLine
                    label="Source"
                    value={wizard.productSource === "user_listings" ? "User listings" : "Admin listings"}
                  />
                  {wizard.productSource === "user_listings" ? (
                    <InfoLine
                      label="Owner"
                      value={wizard.ownerUserName || selectedOwner?.displayName || selectedOwner?.email || wizard.ownerUserId || "-"}
                    />
                  ) : null}
                  <InfoLine label="Product" value={selectedProduct?.name || wizard.productId || "-"} />
                  <InfoLine label="Audience" value={stepSummary} />
                  <InfoLine label="Logic" value={wizard.targetingMode.toUpperCase()} />
                  <InfoLine
                    label="Launch mode"
                    value={wizard.launchNow ? "Create and activate" : "Create draft"}
                  />
                </View>
              </View>
            ) : null}

            {wizardError ? <Text style={[styles.errorText, { color: colors.error }]}>{wizardError}</Text> : null}
            {!wizardError && currentStepError ? <Text style={[styles.errorText, { color: colors.error }]}>{currentStepError}</Text> : null}

            <View style={styles.footerActions}>
              <TouchableOpacity
                onPress={() => {
                  setWizardError(null);
                  setWizardStep((prev) => Math.max(0, prev - 1));
                }}
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

              {wizardStep < stepLabels.length - 1 ? (
                <TouchableOpacity
                  onPress={goNext}
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
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{selectedCampaign.product?.name || "Missing product"}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {selectedCampaign.targeting?.mode?.toUpperCase() || "ANY"} targeting • cap {selectedCampaign.frequencyCapPerDay}/day
            </Text>
            {selectedInsights ? (
              <View style={[styles.previewCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}> 
                <Text style={[styles.previewTitle, { color: colors.text }]}>Insights</Text>
                <Text style={[styles.previewMeta, { color: colors.textMuted }]}>Impressions: {selectedInsights.summary.impression.count} • Clicks: {selectedInsights.summary.click.count}</Text>
                <Text style={[styles.previewMeta, { color: colors.textMuted }]}>Dismiss: {selectedInsights.summary.dismiss.count} • CTR: {selectedInsights.ctr}%</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoLine = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.rowBetween}>
      <Text style={[styles.optionMeta, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.optionMeta, { color: colors.text, flex: 1, textAlign: "right" }]} numberOfLines={1}>{value}</Text>
    </View>
  );
};

const SelectCard = ({
  icon,
  title,
  subtitle,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
}) => {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.selectCard,
        {
          borderColor: active ? colors.primary : colors.border,
          borderRadius: radius.md,
          backgroundColor: active ? `${colors.primary}12` : colors.surfaceElevated,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={active ? colors.primary : colors.textMuted} />
      <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.optionMeta, { color: colors.textMuted }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const CategoryChips = ({
  label,
  options,
  selected,
  loading,
  onToggle,
}: {
  label: string;
  options: Array<{ id: string; title: string }>;
  selected: string[];
  loading?: boolean;
  onToggle: (id: string) => void;
}) => {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      {loading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.chipWrap}>
          {options.map((option) => {
            const active = selected.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => onToggle(option.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: radius.pill,
                    backgroundColor: active ? `${colors.primary}12` : colors.surface,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? colors.primary : colors.textMuted }]}>{option.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const TagEditor = ({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder?: string;
  onChange: (values: string[]) => void;
}) => {
  const { colors, radius } = useTheme();
  const [draft, setDraft] = useState("");

  const addDraft = useCallback(() => {
    const incoming = splitCsv(draft);
    if (!incoming.length) return;
    const merged = Array.from(new Set([...values, ...incoming.map((entry) => entry.toLowerCase())]));
    onChange(merged);
    setDraft("");
  }, [draft, onChange, values]);

  const removeTag = useCallback(
    (tag: string) => {
      onChange(values.filter((entry) => entry !== tag));
    },
    [onChange, values]
  );

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.tagInputWrap, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}> 
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          style={[styles.tagInput, { color: colors.text }]}
          onSubmitEditing={addDraft}
          onBlur={addDraft}
        />
        <TouchableOpacity onPress={addDraft} style={[styles.tagAddBtn, { borderRadius: radius.pill, backgroundColor: colors.primary }]}> 
          <Ionicons name="add" size={14} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
      {values.length ? (
        <View style={styles.chipWrap}>
          {values.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => removeTag(tag)}
              style={[styles.chip, { borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>{tag}</Text>
              <Ionicons name="close" size={12} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const CalendarDateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { colors, radius } = useTheme();
  const parsedValue = value ? new Date(value) : null;
  const safeValueDate = parsedValue && !Number.isNaN(parsedValue.getTime()) ? parsedValue : null;

  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = safeValueDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (open) return;
    const base = safeValueDate || new Date();
    setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [open, safeValueDate?.getFullYear(), safeValueDate?.getMonth()]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthDays = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((firstWeekday + monthDays) / 7) * 7;

  const selectedYmd = value;

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.dateFieldButton,
          {
            borderColor: colors.border,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
      >
        <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
        <Text style={[styles.dateFieldValue, { color: value ? colors.text : colors.textMuted }]}>
          {value || "Select date"}
        </Text>
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <View style={[styles.calendarBackdrop, { backgroundColor: "rgba(0,0,0,0.38)" }]}>
          <View
            style={[
              styles.calendarCard,
              {
                borderRadius: radius.lg,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <TouchableOpacity
                onPress={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                style={[
                  styles.calendarIconBtn,
                  { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Ionicons name="chevron-back" size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarMonthLabel, { color: colors.text }]}>
                {visibleMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity
                onPress={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                style={[
                  styles.calendarIconBtn,
                  { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekRow}>
              {CALENDAR_WEEKDAYS.map((weekday) => (
                <View key={weekday} style={styles.calendarWeekCell}>
                  <Text style={[styles.calendarWeekText, { color: colors.textMuted }]}>{weekday}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {Array.from({ length: cells }).map((_, index) => {
                const day = index - firstWeekday + 1;
                const isCurrentMonthDay = day > 0 && day <= monthDays;
                if (!isCurrentMonthDay) {
                  return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                }

                const date = new Date(year, month, day);
                const ymd = toYmd(date);
                const isSelected = selectedYmd === ymd;

                return (
                  <TouchableOpacity
                    key={ymd}
                    onPress={() => {
                      onChange(ymd);
                      setOpen(false);
                    }}
                    style={[
                      styles.calendarDayCell,
                      styles.calendarDayBtn,
                      {
                        borderRadius: radius.pill,
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? `${colors.primary}16` : colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Text style={[styles.calendarDayText, { color: isSelected ? colors.primary : colors.text }]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                onPress={() => {
                  onChange("");
                  setOpen(false);
                }}
                style={[styles.ghostBtn, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              >
                <Text style={[styles.ghostBtnText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={[styles.primaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
              >
                <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  stepHeader: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  stepItem: { flex: 1, alignItems: "center", gap: 6 },
  stepDot: {
    width: 28,
    height: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotText: { fontSize: 11, fontWeight: "900" },
  stepLabel: { fontSize: 9.5, fontWeight: "700", textAlign: "center" },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "700" },
  fieldInput: {
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  dateFieldButton: {
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateFieldValue: {
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
  previewCard: { borderWidth: 1, padding: 10, gap: 6 },
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
  selectCard: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  presetWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetCard: {
    minHeight: 34,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  presetText: {
    fontSize: 11,
    fontWeight: "800",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tagInputWrap: {
    minHeight: 44,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 10,
  },
  tagAddBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  calendarCard: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  calendarIconBtn: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMonthLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  calendarWeekRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarWeekCell: {
    flex: 1,
    alignItems: "center",
  },
  calendarWeekText: {
    fontSize: 11,
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  calendarDayCell: {
    width: "13.5%",
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayBtn: {
    borderWidth: 1,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: "700",
  },
  calendarActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
});

export default AdStudioScreen;
