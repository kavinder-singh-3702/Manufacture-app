import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/common/Button";
import {
  CreateServiceRequestInput,
  ServicePriority,
  ServiceRequest,
  ServiceType,
  serviceRequestService,
} from "../../services/serviceRequest.service";
import { productService, Product } from "../../services/product.service";
import type { RootStackParamList } from "../../navigation/types";
import { routes } from "../../navigation/routes";
import {
  QUICK_MACHINE_TYPES,
  QUICK_TRANSPORT_MODES,
  QUICK_WORKER_INDUSTRIES,
  SERVICE_META,
} from "./services.constants";
import { SERVICE_ACCENT_MAP, neu, NEU_BG_LIGHT, NEU_BG_DARK, type ServiceAccent } from "./services.palette";
import { QuickAdvancedToggle, SectionHeader, ServiceTypeCard } from "./components";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ServiceRequestRoute = RouteProp<RootStackParamList, "ServiceRequest">;

type FormState = {
  serviceType: ServiceType | null;
  title: string;
  description: string;
  priority: ServicePriority;

  machineType: string;
  issueSummary: string;
  workerIndustry: string;
  headcount: string;
  pickupCity: string;
  dropCity: string;

  advancedOpen: boolean;

  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredChannel: "phone" | "email" | "chat";

  locationLine1: string;
  locationCity: string;
  locationState: string;
  locationCountry: string;
  locationPostal: string;

  scheduleStart: string;
  scheduleEnd: string;
  scheduleFlexible: boolean;
  scheduleNotes: string;

  budgetEstimate: string;
  budgetCurrency: string;
  notes: string;

  machineName: string;
  machineManufacturer: string;
  machineModel: string;
  issueDetails: string;
  severity: "low" | "medium" | "high" | "critical";
  requiresDowntime: boolean;
  warrantyStatus: "in_warranty" | "out_of_warranty" | "unknown";
  machineStart: string;
  machineEnd: string;
  machineFlexible: boolean;
  machineScheduleNotes: string;

  workerRoles: string;
  experienceLevel: "entry" | "mid" | "senior" | "expert";
  shiftType: "day" | "night" | "rotational" | "flexible";
  contractType: "one_time" | "short_term" | "long_term";
  workerStart: string;
  durationWeeks: string;
  workerSkills: string;
  workerCertifications: string;
  workerLanguages: string;
  workerSafety: string;
  perWorkerBudget: string;
  perWorkerCurrency: string;

  transportMode: "road" | "rail" | "air" | "sea";
  pickupState: string;
  dropState: string;
  loadType: string;
  loadWeightTons: string;
  vehicleType: string;
  requiresReturnTrip: boolean;
  specialHandling: string;
  insuranceNeeded: boolean;
  transportStart: string;
  transportEnd: string;
  transportFlexible: boolean;
  availabilityNotes: string;

  advertisementProductId: string;
  advertisementObjective: string;
  adTargetingMode: "any" | "all";
  adTargetUserIds: string;
  adShopperCategories: string;
  adShopperSubCategories: string;
  adBuyIntentCategories: string;
  adBuyIntentSubCategories: string;
  adListedProductCategories: string;
  adListedProductSubCategories: string;
  adRequireSameCategory: boolean;
  adLookbackDays: string;
  adStartAt: string;
  adEndAt: string;
  adPriceOverrideAmount: string;
  adPriceOverrideCurrency: string;
  adHeadline: string;
  adSubtitle: string;
  adCtaLabel: string;
  adBadge: string;
  adFrequencyCap: string;
  adPriority: string;
};

const defaultTitleFor = (serviceType: ServiceType | null) => {
  if (!serviceType) return "";
  return `${SERVICE_META[serviceType].title} request`;
};

const initialForm = (serviceType?: ServiceType): FormState => ({
  serviceType: serviceType || null,
  title: defaultTitleFor(serviceType || null),
  description: "",
  priority: "normal",

  machineType: "cnc",
  issueSummary: "",
  workerIndustry: "general",
  headcount: "1",
  pickupCity: "",
  dropCity: "",

  advancedOpen: false,

  contactName: "",
  contactEmail: "",
  contactPhone: "",
  preferredChannel: "phone",

  locationLine1: "",
  locationCity: "",
  locationState: "",
  locationCountry: "",
  locationPostal: "",

  scheduleStart: "",
  scheduleEnd: "",
  scheduleFlexible: true,
  scheduleNotes: "",

  budgetEstimate: "",
  budgetCurrency: "INR",
  notes: "",

  machineName: "",
  machineManufacturer: "",
  machineModel: "",
  issueDetails: "",
  severity: "medium",
  requiresDowntime: true,
  warrantyStatus: "unknown",
  machineStart: "",
  machineEnd: "",
  machineFlexible: true,
  machineScheduleNotes: "",

  workerRoles: "",
  experienceLevel: "mid",
  shiftType: "day",
  contractType: "short_term",
  workerStart: "",
  durationWeeks: "",
  workerSkills: "",
  workerCertifications: "",
  workerLanguages: "",
  workerSafety: "",
  perWorkerBudget: "",
  perWorkerCurrency: "INR",

  transportMode: "road",
  pickupState: "",
  dropState: "",
  loadType: "",
  loadWeightTons: "",
  vehicleType: "",
  requiresReturnTrip: false,
  specialHandling: "",
  insuranceNeeded: true,
  transportStart: "",
  transportEnd: "",
  transportFlexible: true,
  availabilityNotes: "",

  advertisementProductId: "",
  advertisementObjective: "",
  adTargetingMode: "any",
  adTargetUserIds: "",
  adShopperCategories: "",
  adShopperSubCategories: "",
  adBuyIntentCategories: "",
  adBuyIntentSubCategories: "",
  adListedProductCategories: "",
  adListedProductSubCategories: "",
  adRequireSameCategory: false,
  adLookbackDays: "60",
  adStartAt: "",
  adEndAt: "",
  adPriceOverrideAmount: "",
  adPriceOverrideCurrency: "INR",
  adHeadline: "",
  adSubtitle: "",
  adCtaLabel: "",
  adBadge: "",
  adFrequencyCap: "3",
  adPriority: "50",
});

const serviceRequestToForm = (sr: ServiceRequest): FormState => {
  const mr = sr.machineRepairDetails;
  const wr = sr.workerDetails;
  const tr = sr.transportDetails;
  const ad = sr.advertisementDetails;
  const sched = sr.schedule;
  const loc = sr.location;
  const ct = sr.contact;
  const bud = sr.budget;

  return {
    serviceType: sr.serviceType,
    title: sr.title || "",
    description: sr.description || "",
    priority: sr.priority || "normal",

    machineType: mr?.machineType || "cnc",
    issueSummary: mr?.issueSummary || "",
    workerIndustry: wr?.industry || "general",
    headcount: wr?.headcount != null ? String(wr.headcount) : "1",
    pickupCity: tr?.pickupLocation?.city || "",
    dropCity: tr?.dropLocation?.city || "",

    advancedOpen: false,

    contactName: ct?.name || "",
    contactEmail: ct?.email || "",
    contactPhone: ct?.phone || "",
    preferredChannel: ct?.preferredChannel || "phone",

    locationLine1: loc?.line1 || "",
    locationCity: loc?.city || "",
    locationState: loc?.state || "",
    locationCountry: loc?.country || "",
    locationPostal: loc?.postalCode || "",

    scheduleStart: sched?.startDate ? String(sched.startDate) : "",
    scheduleEnd: sched?.endDate ? String(sched.endDate) : "",
    scheduleFlexible: sched?.isFlexible ?? true,
    scheduleNotes: sched?.notes || "",

    budgetEstimate: bud?.estimatedCost != null ? String(bud.estimatedCost) : "",
    budgetCurrency: bud?.currency || "INR",
    notes: sr.notes || "",

    machineName: mr?.machineName || "",
    machineManufacturer: mr?.manufacturer || "",
    machineModel: mr?.model || "",
    issueDetails: mr?.issueDetails || "",
    severity: mr?.severity || "medium",
    requiresDowntime: mr?.requiresDowntime ?? true,
    warrantyStatus: mr?.warrantyStatus || "unknown",
    machineStart: mr?.preferredSchedule?.startDate ? String(mr.preferredSchedule.startDate) : "",
    machineEnd: mr?.preferredSchedule?.endDate ? String(mr.preferredSchedule.endDate) : "",
    machineFlexible: mr?.preferredSchedule?.isFlexible ?? true,
    machineScheduleNotes: mr?.preferredSchedule?.notes || "",

    workerRoles: wr?.roles?.join(", ") || "",
    experienceLevel: wr?.experienceLevel || "mid",
    shiftType: wr?.shiftType || "day",
    contractType: wr?.contractType || "short_term",
    workerStart: wr?.startDate ? String(wr.startDate) : "",
    durationWeeks: wr?.durationWeeks != null ? String(wr.durationWeeks) : "",
    workerSkills: wr?.skills?.join(", ") || "",
    workerCertifications: wr?.certifications?.join(", ") || "",
    workerLanguages: wr?.languagePreferences?.join(", ") || "",
    workerSafety: wr?.safetyClearances?.join(", ") || "",
    perWorkerBudget: wr?.budgetPerWorker?.amount != null ? String(wr.budgetPerWorker.amount) : "",
    perWorkerCurrency: wr?.budgetPerWorker?.currency || "INR",

    transportMode: tr?.mode || "road",
    pickupState: tr?.pickupLocation?.state || "",
    dropState: tr?.dropLocation?.state || "",
    loadType: tr?.loadType || "",
    loadWeightTons: tr?.loadWeightTons != null ? String(tr.loadWeightTons) : "",
    vehicleType: tr?.vehicleType || "",
    requiresReturnTrip: tr?.requiresReturnTrip ?? false,
    specialHandling: tr?.specialHandling || "",
    insuranceNeeded: tr?.insuranceNeeded ?? false,
    transportStart: tr?.availability?.startDate ? String(tr.availability.startDate) : "",
    transportEnd: tr?.availability?.endDate ? String(tr.availability.endDate) : "",
    transportFlexible: tr?.availability?.isFlexible ?? true,
    availabilityNotes: tr?.availability?.notes || "",

    advertisementProductId: ad?.product || "",
    advertisementObjective: ad?.objective || "",
    adTargetingMode: ad?.targetingMode || "any",
    adTargetUserIds: ad?.targetUserIds?.join(", ") || "",
    adShopperCategories: ad?.shopperCategories?.join(", ") || "",
    adShopperSubCategories: ad?.shopperSubCategories?.join(", ") || "",
    adBuyIntentCategories: ad?.buyIntentCategories?.join(", ") || "",
    adBuyIntentSubCategories: ad?.buyIntentSubCategories?.join(", ") || "",
    adListedProductCategories: ad?.listedProductCategories?.join(", ") || "",
    adListedProductSubCategories: ad?.listedProductSubCategories?.join(", ") || "",
    adRequireSameCategory: ad?.requireListedProductInSameCategory ?? false,
    adLookbackDays: ad?.lookbackDays != null ? String(ad.lookbackDays) : "60",
    adStartAt: ad?.startAt ? String(ad.startAt) : "",
    adEndAt: ad?.endAt ? String(ad.endAt) : "",
    adPriceOverrideAmount: ad?.priceOverride?.amount != null ? String(ad.priceOverride.amount) : "",
    adPriceOverrideCurrency: ad?.priceOverride?.currency || "INR",
    adHeadline: ad?.headline || "",
    adSubtitle: ad?.subtitle || "",
    adCtaLabel: ad?.ctaLabel || "",
    adBadge: ad?.badge || "",
    adFrequencyCap: ad?.frequencyCapPerDay != null ? String(ad.frequencyCapPerDay) : "3",
    adPriority: ad?.priority != null ? String(ad.priority) : "50",
  };
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDate = (value: string) => {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const buildAvailability = (start: string, end: string, flexible: boolean, notes: string) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const trimmedNotes = notes.trim();

  if (!startDate && !endDate && !trimmedNotes && flexible === true) return undefined;

  return {
    startDate,
    endDate,
    isFlexible: flexible,
    notes: trimmedNotes || undefined,
  };
};

const buildLocation = (form: FormState) => {
  const payload = {
    line1: form.locationLine1.trim() || undefined,
    city: form.locationCity.trim() || undefined,
    state: form.locationState.trim() || undefined,
    country: form.locationCountry.trim() || undefined,
    postalCode: form.locationPostal.trim() || undefined,
  };

  const hasData = Object.values(payload).some(Boolean);
  return hasData ? payload : undefined;
};

const choose = <T extends string>(
  options: readonly T[],
  value: string,
  fallback: T
): T => {
  if (options.includes(value as T)) return value as T;
  return fallback;
};

/* ─── Neumorphic helpers ─────────────────────────────────────────────── */

const NeuSection = ({
  children,
  isDark,
  borderRadius,
}: {
  children: React.ReactNode;
  isDark: boolean;
  borderRadius: number;
}) => (
  <View style={[neu.lightShadow(isDark), { borderRadius }]}>
    <View style={[neu.darkShadow(isDark), { borderRadius }]}>
      <View style={{ borderRadius, backgroundColor: neu.cardBg(isDark), padding: 16, gap: 10 }}>
        {children}
      </View>
    </View>
  </View>
);

/* ─── Screen ─────────────────────────────────────────────────────────── */

export const ServiceRequestScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const pageBg = isDark ? NEU_BG_DARK : NEU_BG_LIGHT;

  const { user, requestLogin } = useAuth();
  const { success, error } = useToast();
  const navigation = useNavigation<Nav>();
  const route = useRoute<ServiceRequestRoute>();
  const insets = useSafeAreaInsets();

  const existingServiceId = route.params?.serviceId;
  const [form, setForm] = useState<FormState>(() => initialForm(route.params?.serviceType));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isViewing, setIsViewing] = useState(Boolean(existingServiceId));
  const [loadingExisting, setLoadingExisting] = useState(Boolean(existingServiceId));
  const loadedIdRef = useRef<string | null>(null);

  const accent: ServiceAccent | null = form.serviceType ? SERVICE_ACCENT_MAP[form.serviceType] : null;
  const accentColor = accent?.color ?? colors.primary;
  const selectedMeta = form.serviceType ? SERVICE_META[form.serviceType] : null;

  // Load existing service request when serviceId is provided
  useEffect(() => {
    if (!existingServiceId) {
      setIsViewing(false);
      setLoadingExisting(false);
      setForm(initialForm(route.params?.serviceType));
      loadedIdRef.current = null;
      return;
    }

    if (loadedIdRef.current === existingServiceId) return;

    setLoadingExisting(true);
    setIsViewing(true);
    setForm(initialForm());

    let cancelled = false;
    const load = async () => {
      try {
        const sr = await serviceRequestService.getById(existingServiceId);
        if (cancelled) return;
        loadedIdRef.current = existingServiceId;
        setForm(serviceRequestToForm(sr));
      } catch (err: any) {
        if (!cancelled) {
          error("Could not load request", err?.message || "Please try again.");
          setIsViewing(false);
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [existingServiceId]);

  useEffect(() => {
    if (!route.params?.serviceType || route.params?.serviceId) return;

    setForm((prev) => ({
      ...prev,
      serviceType: route.params?.serviceType || prev.serviceType,
      title: prev.title.trim() ? prev.title : defaultTitleFor(route.params?.serviceType || null),
      advertisementProductId: route.params?.prefillProductId || prev.advertisementProductId,
      advertisementObjective: route.params?.prefillObjective || prev.advertisementObjective,
    }));
  }, [route.params?.prefillObjective, route.params?.prefillProductId, route.params?.serviceType]);

  const loadOwnProducts = useCallback(async () => {
    if (!user || user.role === "guest" || !user.activeCompany) {
      setMyProducts([]);
      return;
    }
    try {
      setProductsLoading(true);
      const response = await productService.getAll({
        scope: "company",
        visibility: "public",
        status: "active",
        limit: 40,
        offset: 0,
      });
      setMyProducts(response.products || []);
    } catch {
      setMyProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (form.serviceType !== "advertisement") return;
    loadOwnProducts();
  }, [form.serviceType, loadOwnProducts]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const clone = { ...prev };
      delete clone[field as string];
      return clone;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.serviceType) nextErrors.serviceType = "Select a service type";
    if (!form.title.trim()) nextErrors.title = "Title is required";

    if (form.serviceType === "machine_repair") {
      if (!form.machineType.trim()) nextErrors.machineType = "Machine type is required";
      if (!form.issueSummary.trim()) nextErrors.issueSummary = "Issue summary is required";
    }

    if (form.serviceType === "worker") {
      if (!form.workerIndustry.trim()) nextErrors.workerIndustry = "Industry is required";
      const count = Number(form.headcount);
      if (!Number.isFinite(count) || count < 1) nextErrors.headcount = "Headcount must be at least 1";
    }

    if (form.serviceType === "transport") {
      if (!form.pickupCity.trim()) nextErrors.pickupCity = "Pickup city is required";
      if (!form.dropCity.trim()) nextErrors.dropCity = "Drop city is required";
    }

    if (form.serviceType === "advertisement") {
      if (!form.advertisementProductId.trim()) {
        nextErrors.advertisementProductId = "Pick a product to promote";
      }
      if (form.adPriceOverrideAmount.trim()) {
        const parsed = Number(form.adPriceOverrideAmount);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          nextErrors.adPriceOverrideAmount = "Discounted ad price must be greater than 0";
        }
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const payload = useMemo((): CreateServiceRequestInput | null => {
    if (!form.serviceType) return null;

    const base: CreateServiceRequestInput = {
      serviceType: form.serviceType,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      contact:
        form.contactName.trim() || form.contactEmail.trim() || form.contactPhone.trim()
          ? {
              name: form.contactName.trim() || undefined,
              email: form.contactEmail.trim() || undefined,
              phone: form.contactPhone.trim() || undefined,
              preferredChannel: form.preferredChannel,
            }
          : undefined,
      location: buildLocation(form),
      schedule: buildAvailability(form.scheduleStart, form.scheduleEnd, form.scheduleFlexible, form.scheduleNotes),
      budget:
        form.budgetEstimate.trim() || form.budgetCurrency.trim()
          ? {
              estimatedCost: toNumber(form.budgetEstimate),
              currency: form.budgetCurrency.trim().toUpperCase() || undefined,
            }
          : undefined,
      notes: form.notes.trim() || undefined,
    };

    if (form.serviceType === "machine_repair") {
      base.machineRepairDetails = {
        machineType: choose(QUICK_MACHINE_TYPES, form.machineType, "custom"),
        machineName: form.machineName.trim() || undefined,
        manufacturer: form.machineManufacturer.trim() || undefined,
        model: form.machineModel.trim() || undefined,
        issueSummary: form.issueSummary.trim(),
        issueDetails: form.issueDetails.trim() || undefined,
        severity: form.severity,
        requiresDowntime: form.requiresDowntime,
        warrantyStatus: form.warrantyStatus,
        preferredSchedule: buildAvailability(form.machineStart, form.machineEnd, form.machineFlexible, form.machineScheduleNotes),
      };
    }

    if (form.serviceType === "worker") {
      base.workerDetails = {
        industry: choose(QUICK_WORKER_INDUSTRIES, form.workerIndustry, "general"),
        headcount: Math.max(1, Number(form.headcount) || 1),
        roles: splitList(form.workerRoles),
        experienceLevel: form.experienceLevel,
        shiftType: form.shiftType,
        contractType: form.contractType,
        startDate: parseDate(form.workerStart),
        durationWeeks: toNumber(form.durationWeeks),
        skills: splitList(form.workerSkills),
        certifications: splitList(form.workerCertifications),
        languagePreferences: splitList(form.workerLanguages),
        safetyClearances: splitList(form.workerSafety),
        budgetPerWorker:
          form.perWorkerBudget.trim() || form.perWorkerCurrency.trim()
            ? {
                amount: toNumber(form.perWorkerBudget),
                currency: form.perWorkerCurrency.trim().toUpperCase() || undefined,
              }
            : undefined,
      };
    }

    if (form.serviceType === "transport") {
      base.transportDetails = {
        mode: choose(QUICK_TRANSPORT_MODES, form.transportMode, "road"),
        pickupLocation: {
          city: form.pickupCity.trim() || undefined,
          state: form.pickupState.trim() || undefined,
        },
        dropLocation: {
          city: form.dropCity.trim() || undefined,
          state: form.dropState.trim() || undefined,
        },
        loadType: form.loadType.trim() || undefined,
        loadWeightTons: toNumber(form.loadWeightTons),
        vehicleType: form.vehicleType.trim() || undefined,
        requiresReturnTrip: form.requiresReturnTrip,
        availability: buildAvailability(form.transportStart, form.transportEnd, form.transportFlexible, form.availabilityNotes),
        specialHandling: form.specialHandling.trim() || undefined,
        insuranceNeeded: form.insuranceNeeded,
      };
    }

    if (form.serviceType === "advertisement") {
      const adPriceOverrideAmount = Number(form.adPriceOverrideAmount);
      const hasAdPriceOverride =
        form.adPriceOverrideAmount.trim().length > 0 &&
        Number.isFinite(adPriceOverrideAmount) &&
        adPriceOverrideAmount > 0;

      base.advertisementDetails = {
        product: form.advertisementProductId.trim(),
        priceOverride: hasAdPriceOverride
          ? {
              amount: Number(adPriceOverrideAmount.toFixed(2)),
              currency: form.adPriceOverrideCurrency.trim().toUpperCase() || undefined,
            }
          : undefined,
        objective: form.advertisementObjective.trim() || undefined,
        targetingMode: form.adTargetingMode,
        targetUserIds: splitList(form.adTargetUserIds),
        shopperCategories: splitList(form.adShopperCategories),
        shopperSubCategories: splitList(form.adShopperSubCategories),
        buyIntentCategories: splitList(form.adBuyIntentCategories),
        buyIntentSubCategories: splitList(form.adBuyIntentSubCategories),
        listedProductCategories: splitList(form.adListedProductCategories),
        listedProductSubCategories: splitList(form.adListedProductSubCategories),
        requireListedProductInSameCategory: form.adRequireSameCategory,
        lookbackDays: Number(form.adLookbackDays) || 60,
        startAt: parseDate(form.adStartAt),
        endAt: parseDate(form.adEndAt),
        headline: form.adHeadline.trim() || undefined,
        subtitle: form.adSubtitle.trim() || undefined,
        ctaLabel: form.adCtaLabel.trim() || undefined,
        badge: form.adBadge.trim() || undefined,
        frequencyCapPerDay: Math.max(1, Math.min(50, Number(form.adFrequencyCap) || 3)),
        priority: Math.max(1, Math.min(100, Number(form.adPriority) || 50)),
      };
    }

    return base;
  }, [form]);

  const submit = async () => {
    if (!user || user.role === "guest") {
      requestLogin();
      return;
    }

    if (!validate()) return;
    if (!payload) return;

    try {
      setSubmitting(true);
      await serviceRequestService.create(payload);
      success("Request submitted", "Your service request has been logged.");
      navigation.navigate("Main", { screen: routes.SERVICES });
    } catch (err: any) {
      error("Could not submit", err?.message || "Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Inline sub-components ─────────────────────────────────────────── */

  const PriorityPills = () => {
    const priorities: { key: ServicePriority; label: string; pillColor: string }[] = [
      { key: "normal", label: "NORMAL", pillColor: "#059669" },
      { key: "high", label: "HIGH", pillColor: "#D97706" },
      { key: "urgent", label: "URGENT", pillColor: "#DC2626" },
    ];

    return (
      <View style={styles.pillRow}>
        {priorities.map(({ key, label, pillColor }) => {
          const active = form.priority === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setField("priority", key)}
              activeOpacity={0.85}
              style={[
                styles.pill,
                neu.pressed(isDark),
                {
                  borderRadius: radius.lg,
                  backgroundColor: neu.insetBg(isDark),
                  borderColor: "transparent",
                },
              ]}
            >
              <View style={[styles.pillDot, { backgroundColor: active ? pillColor : colors.textDisabled }]} />
              <Text style={[styles.pillText, { color: active ? colors.text : colors.textMuted }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const Toggle = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.toggle,
        neu.pressed(isDark),
        {
          borderRadius: radius.lg,
          backgroundColor: neu.insetBg(isDark),
          borderColor: "transparent",
        },
      ]}
    >
      <Ionicons
        name={value ? "checkmark-circle" : "ellipse-outline"}
        size={18}
        color={value ? colors.success : colors.textDisabled}
      />
      <Text style={[styles.toggleLabel, { color: value ? colors.text : colors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );

  /* ── Service type selector (compact pills when a type is already chosen) ── */

  const ServiceTypeSelector = () => {
    if (isViewing) return null;

    return (
      <NeuSection isDark={isDark} borderRadius={radius.xl}>
        <SectionHeader title="Service Type" subtitle="Pick one to continue" />

        {/* Compact selector row when a type is pre-selected */}
        {form.serviceType ? (
          <View style={styles.typeSelectorRow}>
            {Object.values(SERVICE_META).map((service) => {
              const a = SERVICE_ACCENT_MAP[service.type];
              const active = form.serviceType === service.type;
              return (
                <TouchableOpacity
                  key={service.type}
                  onPress={() => {
                    setField("serviceType", service.type);
                    if (!form.title.trim()) setField("title", defaultTitleFor(service.type));
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.typeChip,
                    active ? neu.buttonRaised(isDark) : neu.pressed(isDark),
                    {
                      borderRadius: radius.lg,
                      backgroundColor: active
                        ? (isDark ? `${a.color}22` : a.soft)
                        : neu.insetBg(isDark),
                      borderColor: active ? `${a.color}40` : "transparent",
                    },
                  ]}
                >
                  <Text style={styles.typeChipEmoji}>{a.emoji}</Text>
                  <Text
                    style={[
                      styles.typeChipLabel,
                      { color: active ? a.color : colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {service.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.stack}>
            {Object.values(SERVICE_META).map((service) => (
              <ServiceTypeCard
                key={service.type}
                service={service}
                accent={SERVICE_ACCENT_MAP[service.type]}
                selected={form.serviceType === service.type}
                onPress={() => {
                  setField("serviceType", service.type);
                  if (!form.title.trim()) setField("title", defaultTitleFor(service.type));
                }}
              />
            ))}
          </View>
        )}

        {fieldErrors.serviceType ? (
          <Text style={[styles.fieldError, { color: colors.error }]}>{fieldErrors.serviceType}</Text>
        ) : null}
      </NeuSection>
    );
  };

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxl + insets.bottom,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Header with accent-colored back button */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
              style={[
                styles.backButton,
                neu.buttonRaised(isDark),
                {
                  borderRadius: radius.lg,
                  backgroundColor: neu.cardBg(isDark),
                },
              ]}
            >
              <Ionicons name="arrow-back" size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {isViewing ? "Request Details" : "Service Request"}
                </Text>
                {accent ? (
                  <View style={[styles.headerBadge, { backgroundColor: isDark ? `${accentColor}22` : accent.soft, borderRadius: radius.sm }]}>
                    <Text style={styles.headerBadgeEmoji}>{accent.emoji}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {isViewing ? "Viewing submitted request" : selectedMeta ? selectedMeta.subtitle : "Choose service type and submit quickly"}
              </Text>
            </View>
          </View>

          {/* Accent bar under header */}
          {accent ? (
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          ) : null}

          {loadingExisting ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 }}>
              <ActivityIndicator color={accentColor} />
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>Loading request...</Text>
            </View>
          ) : null}
          {loadingExisting ? null : (
          <>
          <ServiceTypeSelector />

          {/* Quick Request form */}
          <NeuSection isDark={isDark} borderRadius={radius.xl}>
            <SectionHeader title="Quick Request" subtitle="Required fields first" />
            <View style={styles.stack}>
              <NeuField
                label="Title"
                required
                value={form.title}
                onChangeText={(value) => setField("title", value)}
                placeholder="Brief request title"
                errorText={fieldErrors.title}
                isDark={isDark}
                accentColor={accentColor}
              />

              <NeuField
                label="Description (optional)"
                value={form.description}
                onChangeText={(value) => setField("description", value)}
                placeholder="Context, urgency, or constraints"
                multiline
                isDark={isDark}
                accentColor={accentColor}
              />

              <View>
                <Text style={[styles.label, { color: colors.textMuted }]}>Priority</Text>
                <PriorityPills />
              </View>

              {form.serviceType === "machine_repair" ? (
                <>
                  <NeuField
                    label="Machine type"
                    required
                    value={form.machineType}
                    onChangeText={(value) => setField("machineType", value)}
                    placeholder="cnc, press, packaging"
                    errorText={fieldErrors.machineType}
                    isDark={isDark}
                    accentColor={accentColor}
                  />
                  <NeuField
                    label="Issue summary"
                    required
                    value={form.issueSummary}
                    onChangeText={(value) => setField("issueSummary", value)}
                    placeholder="What is failing right now?"
                    errorText={fieldErrors.issueSummary}
                    isDark={isDark}
                    accentColor={accentColor}
                  />
                </>
              ) : null}

              {form.serviceType === "worker" ? (
                <>
                  <NeuField
                    label="Industry"
                    required
                    value={form.workerIndustry}
                    onChangeText={(value) => setField("workerIndustry", value)}
                    placeholder="automotive, textile, packaging"
                    errorText={fieldErrors.workerIndustry}
                    isDark={isDark}
                    accentColor={accentColor}
                  />
                  <NeuField
                    label="Headcount"
                    required
                    value={form.headcount}
                    onChangeText={(value) => setField("headcount", value.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder="1"
                    errorText={fieldErrors.headcount}
                    isDark={isDark}
                    accentColor={accentColor}
                  />
                </>
              ) : null}

              {form.serviceType === "transport" ? (
                <>
                  <NeuField
                    label="Pickup city"
                    required
                    value={form.pickupCity}
                    onChangeText={(value) => setField("pickupCity", value)}
                    placeholder="Where from?"
                    errorText={fieldErrors.pickupCity}
                    isDark={isDark}
                    accentColor={accentColor}
                  />
                  <NeuField
                    label="Drop city"
                    required
                    value={form.dropCity}
                    onChangeText={(value) => setField("dropCity", value)}
                    placeholder="Where to?"
                    errorText={fieldErrors.dropCity}
                    isDark={isDark}
                    accentColor={accentColor}
                  />
                </>
              ) : null}

              {form.serviceType === "advertisement" ? (
                <>
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      Product to promote <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {myProducts.slice(0, 8).map((product) => {
                        const active = form.advertisementProductId === product._id;
                        return (
                          <TouchableOpacity
                            key={product._id}
                            onPress={() => setField("advertisementProductId", product._id)}
                            activeOpacity={0.85}
                            style={[
                              styles.pill,
                              neu.pressed(isDark),
                              {
                                borderRadius: radius.pill,
                                backgroundColor: neu.insetBg(isDark),
                                borderColor: "transparent",
                              },
                            ]}
                          >
                            {active ? <View style={[styles.pillDot, { backgroundColor: colors.success }]} /> : null}
                            <Text
                              style={[styles.pillText, { color: active ? colors.text : colors.textMuted, textTransform: "none" }]}
                              numberOfLines={1}
                            >
                              {product.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {productsLoading ? (
                      <Text style={[styles.fieldHelper, { color: colors.textMuted }]}>Loading products...</Text>
                    ) : null}
                    <NeuField
                      label="Or enter product ID"
                      value={form.advertisementProductId}
                      onChangeText={(value) => setField("advertisementProductId", value)}
                      placeholder="Paste product id"
                      errorText={fieldErrors.advertisementProductId}
                      isDark={isDark}
                      accentColor={accentColor}
                    />
                  </View>

                  <NeuField
                    label="Goal / objective"
                    value={form.advertisementObjective}
                    onChangeText={(value) => setField("advertisementObjective", value)}
                    placeholder="What should this ad achieve?"
                    isDark={isDark}
                    accentColor={accentColor}
                  />

                  <View>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Targeting logic</Text>
                    <View style={styles.pillRow}>
                      {(["any", "all"] as const).map((mode) => {
                        const active = form.adTargetingMode === mode;
                        return (
                          <TouchableOpacity
                            key={mode}
                            onPress={() => setField("adTargetingMode", mode)}
                            activeOpacity={0.85}
                            style={[
                              styles.pill,
                              neu.pressed(isDark),
                              {
                                borderRadius: radius.lg,
                                backgroundColor: neu.insetBg(isDark),
                                borderColor: "transparent",
                              },
                            ]}
                          >
                            <View style={[styles.pillDot, { backgroundColor: active ? colors.success : colors.textDisabled }]} />
                            <Text style={[styles.pillText, { color: active ? colors.text : colors.textMuted }]}>
                              {mode.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <NeuField
                    label="Shopper categories (comma separated)"
                    value={form.adShopperCategories}
                    onChangeText={(value) => setField("adShopperCategories", value)}
                    placeholder="metal-steel-industry, packaging"
                    isDark={isDark}
                    accentColor={accentColor}
                  />
                </>
              ) : null}

              <QuickAdvancedToggle
                advanced={form.advancedOpen}
                onToggle={() => setField("advancedOpen", !form.advancedOpen)}
              />
            </View>
          </NeuSection>

          {form.advancedOpen ? (
            <NeuSection isDark={isDark} borderRadius={radius.xl}>
              <SectionHeader title="Advanced Details" subtitle="Optional fields for better assignment" />

              <View style={styles.stack}>
                <NeuField label="Contact name" value={form.contactName} onChangeText={(value) => setField("contactName", value)} isDark={isDark} accentColor={accentColor} />
                <NeuField label="Contact email" value={form.contactEmail} onChangeText={(value) => setField("contactEmail", value)} keyboardType="email-address" isDark={isDark} accentColor={accentColor} />
                <NeuField label="Contact phone" value={form.contactPhone} onChangeText={(value) => setField("contactPhone", value)} keyboardType="phone-pad" isDark={isDark} accentColor={accentColor} />
                <NeuField label="Preferred channel" value={form.preferredChannel} onChangeText={(value) => setField("preferredChannel", value as FormState["preferredChannel"])} placeholder="phone | email | chat" isDark={isDark} accentColor={accentColor} />

                <NeuField label="Address line" value={form.locationLine1} onChangeText={(value) => setField("locationLine1", value)} isDark={isDark} accentColor={accentColor} />
                <NeuField label="City" value={form.locationCity} onChangeText={(value) => setField("locationCity", value)} isDark={isDark} accentColor={accentColor} />
                <NeuField label="State" value={form.locationState} onChangeText={(value) => setField("locationState", value)} isDark={isDark} accentColor={accentColor} />
                <NeuField label="Country" value={form.locationCountry} onChangeText={(value) => setField("locationCountry", value)} isDark={isDark} accentColor={accentColor} />
                <NeuField label="Postal code" value={form.locationPostal} onChangeText={(value) => setField("locationPostal", value)} isDark={isDark} accentColor={accentColor} />

                <NeuField label="Schedule start" value={form.scheduleStart} onChangeText={(value) => setField("scheduleStart", value)} placeholder="YYYY-MM-DD" isDark={isDark} accentColor={accentColor} />
                <NeuField label="Schedule end" value={form.scheduleEnd} onChangeText={(value) => setField("scheduleEnd", value)} placeholder="YYYY-MM-DD" isDark={isDark} accentColor={accentColor} />
                <Toggle label={form.scheduleFlexible ? "Flexible schedule" : "Fixed schedule"} value={form.scheduleFlexible} onPress={() => setField("scheduleFlexible", !form.scheduleFlexible)} />
                <NeuField label="Schedule notes" value={form.scheduleNotes} onChangeText={(value) => setField("scheduleNotes", value)} isDark={isDark} accentColor={accentColor} />

                <NeuField label="Budget estimate" value={form.budgetEstimate} onChangeText={(value) => setField("budgetEstimate", value.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" isDark={isDark} accentColor={accentColor} />
                <NeuField label="Budget currency" value={form.budgetCurrency} onChangeText={(value) => setField("budgetCurrency", value.toUpperCase())} isDark={isDark} accentColor={accentColor} />

                {form.serviceType === "machine_repair" ? (
                  <>
                    <NeuField label="Machine name" value={form.machineName} onChangeText={(value) => setField("machineName", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Manufacturer" value={form.machineManufacturer} onChangeText={(value) => setField("machineManufacturer", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Model" value={form.machineModel} onChangeText={(value) => setField("machineModel", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Issue details" value={form.issueDetails} onChangeText={(value) => setField("issueDetails", value)} multiline isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Severity" value={form.severity} onChangeText={(value) => setField("severity", value as FormState["severity"])} placeholder="low | medium | high | critical" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Warranty" value={form.warrantyStatus} onChangeText={(value) => setField("warrantyStatus", value as FormState["warrantyStatus"])} placeholder="in_warranty | out_of_warranty | unknown" isDark={isDark} accentColor={accentColor} />
                    <Toggle label={form.requiresDowntime ? "Downtime required" : "No downtime required"} value={form.requiresDowntime} onPress={() => setField("requiresDowntime", !form.requiresDowntime)} />
                  </>
                ) : null}

                {form.serviceType === "worker" ? (
                  <>
                    <NeuField label="Roles (comma separated)" value={form.workerRoles} onChangeText={(value) => setField("workerRoles", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Experience" value={form.experienceLevel} onChangeText={(value) => setField("experienceLevel", value as FormState["experienceLevel"])} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Shift" value={form.shiftType} onChangeText={(value) => setField("shiftType", value as FormState["shiftType"])} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Contract" value={form.contractType} onChangeText={(value) => setField("contractType", value as FormState["contractType"])} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Start date" value={form.workerStart} onChangeText={(value) => setField("workerStart", value)} placeholder="YYYY-MM-DD" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Duration weeks" value={form.durationWeeks} onChangeText={(value) => setField("durationWeeks", value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Skills" value={form.workerSkills} onChangeText={(value) => setField("workerSkills", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Certifications" value={form.workerCertifications} onChangeText={(value) => setField("workerCertifications", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Languages" value={form.workerLanguages} onChangeText={(value) => setField("workerLanguages", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Safety clearances" value={form.workerSafety} onChangeText={(value) => setField("workerSafety", value)} isDark={isDark} accentColor={accentColor} />
                  </>
                ) : null}

                {form.serviceType === "transport" ? (
                  <>
                    <NeuField label="Mode" value={form.transportMode} onChangeText={(value) => setField("transportMode", value as FormState["transportMode"])} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Pickup state" value={form.pickupState} onChangeText={(value) => setField("pickupState", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Drop state" value={form.dropState} onChangeText={(value) => setField("dropState", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Load type" value={form.loadType} onChangeText={(value) => setField("loadType", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Load weight tons" value={form.loadWeightTons} onChangeText={(value) => setField("loadWeightTons", value.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Vehicle type" value={form.vehicleType} onChangeText={(value) => setField("vehicleType", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Special handling" value={form.specialHandling} onChangeText={(value) => setField("specialHandling", value)} multiline isDark={isDark} accentColor={accentColor} />
                    <Toggle label={form.requiresReturnTrip ? "Return trip required" : "One-way"} value={form.requiresReturnTrip} onPress={() => setField("requiresReturnTrip", !form.requiresReturnTrip)} />
                    <Toggle label={form.insuranceNeeded ? "Insurance needed" : "No insurance"} value={form.insuranceNeeded} onPress={() => setField("insuranceNeeded", !form.insuranceNeeded)} />
                  </>
                ) : null}

                {form.serviceType === "advertisement" ? (
                  <>
                    <NeuField label="Target user IDs (comma separated)" value={form.adTargetUserIds} onChangeText={(value) => setField("adTargetUserIds", value)} placeholder="Optional explicit users" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Shopper subcategories" value={form.adShopperSubCategories} onChangeText={(value) => setField("adShopperSubCategories", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Buy-intent categories" value={form.adBuyIntentCategories} onChangeText={(value) => setField("adBuyIntentCategories", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Buy-intent subcategories" value={form.adBuyIntentSubCategories} onChangeText={(value) => setField("adBuyIntentSubCategories", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Listed-product categories" value={form.adListedProductCategories} onChangeText={(value) => setField("adListedProductCategories", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Listed-product subcategories" value={form.adListedProductSubCategories} onChangeText={(value) => setField("adListedProductSubCategories", value)} isDark={isDark} accentColor={accentColor} />
                    <Toggle label={form.adRequireSameCategory ? "Must have listed product in same category" : "Same-category listing optional"} value={form.adRequireSameCategory} onPress={() => setField("adRequireSameCategory", !form.adRequireSameCategory)} />
                    <NeuField label="Lookback days" value={form.adLookbackDays} onChangeText={(value) => setField("adLookbackDays", value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Ad start date" value={form.adStartAt} onChangeText={(value) => setField("adStartAt", value)} placeholder="YYYY-MM-DD" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Ad end date" value={form.adEndAt} onChangeText={(value) => setField("adEndAt", value)} placeholder="YYYY-MM-DD" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Discounted ad price (optional)" value={form.adPriceOverrideAmount} onChangeText={(value) => setField("adPriceOverrideAmount", value.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" placeholder="Enter lower promoted price" errorText={fieldErrors.adPriceOverrideAmount} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Ad price currency" value={form.adPriceOverrideCurrency} onChangeText={(value) => setField("adPriceOverrideCurrency", value.toUpperCase())} placeholder="INR" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Headline" value={form.adHeadline} onChangeText={(value) => setField("adHeadline", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Subtitle" value={form.adSubtitle} onChangeText={(value) => setField("adSubtitle", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="CTA label" value={form.adCtaLabel} onChangeText={(value) => setField("adCtaLabel", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Badge" value={form.adBadge} onChangeText={(value) => setField("adBadge", value)} isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Frequency cap / day" value={form.adFrequencyCap} onChangeText={(value) => setField("adFrequencyCap", value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" isDark={isDark} accentColor={accentColor} />
                    <NeuField label="Priority (1-100)" value={form.adPriority} onChangeText={(value) => setField("adPriority", value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" isDark={isDark} accentColor={accentColor} />
                  </>
                ) : null}

                <NeuField label="Notes" value={form.notes} onChangeText={(value) => setField("notes", value)} multiline isDark={isDark} accentColor={accentColor} />
              </View>
            </NeuSection>
          ) : null}

          {/* Submit section */}
          <NeuSection isDark={isDark} borderRadius={radius.xl}>
            {isViewing ? (
              <Text style={[styles.submitHint, { color: colors.textMuted }]}>This request has already been submitted.</Text>
            ) : (
              <>
                <Text style={[styles.submitHint, { color: colors.textMuted }]}>Review required fields and submit. You can add more details later if needed.</Text>
                <TouchableOpacity
                  onPress={submit}
                  disabled={submitting}
                  activeOpacity={0.85}
                  style={[
                    styles.submitOuter,
                    neu.buttonRaised(isDark),
                    { borderRadius: radius.xl, opacity: submitting ? 0.7 : 1 },
                  ]}
                >
                  <LinearGradient
                    colors={[accentColor, `${accentColor}CC`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.submitGradient, { borderRadius: radius.xl }]}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>
                          {user?.role === "guest" ? "Login to submit" : "Submit request"}
                        </Text>
                        <View style={styles.submitArrow}>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </NeuSection>
          </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ─── Neumorphic Field ───────────────────────────────────────────────── */

const NeuField = ({
  label,
  value,
  onChangeText,
  placeholder,
  errorText,
  required,
  multiline,
  keyboardType,
  isDark,
  accentColor,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  errorText?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad" | "decimal-pad" | "email-address" | "phone-pad";
  isDark: boolean;
  accentColor: string;
}) => {
  const { colors, radius } = useTheme();
  const hasError = Boolean(errorText);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        {label}
        {required ? <Text style={{ color: colors.error }}> *</Text> : null}
      </Text>
      <View
        style={[
          neu.pressed(isDark),
          {
            borderRadius: radius.lg,
            borderWidth: focused ? 1.5 : 0,
            borderColor: focused ? `${accentColor}60` : "transparent",
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              borderRadius: radius.lg,
              backgroundColor: neu.insetBg(isDark),
              color: colors.text,
              minHeight: multiline ? 84 : 48,
              textAlignVertical: multiline ? "top" : "center",
            },
            hasError && { borderWidth: 1, borderColor: colors.error },
          ]}
        />
      </View>
      {hasError ? <Text style={[styles.fieldError, { color: colors.error }]}>{errorText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.2 },
  headerSubtitle: { marginTop: 2, fontSize: 12, fontWeight: "600" },
  headerBadge: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeEmoji: { fontSize: 15 },
  accentBar: {
    height: 3,
    borderRadius: 1.5,
    width: 50,
    marginLeft: 52,
    marginTop: -8,
  },

  // Type selector
  typeSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  typeChipEmoji: { fontSize: 16 },
  typeChipLabel: { fontSize: 12, fontWeight: "800" },

  stack: { gap: 12 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 5 },
  fieldWrap: { gap: 2 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  fieldError: { marginTop: 5, fontSize: 11, fontWeight: "700" },
  fieldHelper: { fontSize: 11, fontWeight: "600" },
  submitHint: { fontSize: 12, fontWeight: "600", lineHeight: 17, marginBottom: 4 },

  submitOuter: { overflow: "hidden" },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  submitText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 },
  submitArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  toggleLabel: { fontSize: 13, fontWeight: "700" },
});
