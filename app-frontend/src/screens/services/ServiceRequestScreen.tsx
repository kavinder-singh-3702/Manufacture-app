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

export const ServiceRequestScreen = () => {
  const { colors, spacing, radius } = useTheme();
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

  // Load existing service request when serviceId is provided
  useEffect(() => {
    if (!existingServiceId) {
      setIsViewing(false);
      setLoadingExisting(false);
      setForm(initialForm(route.params?.serviceType));
      loadedIdRef.current = null;
      return;
    }

    // Skip if we already loaded this exact request
    if (loadedIdRef.current === existingServiceId) return;

    // Reset state for new load
    setLoadingExisting(true);
    setIsViewing(true);
    setForm(initialForm()); // clear stale form data immediately

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
      base.advertisementDetails = {
        product: form.advertisementProductId.trim(),
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

  const selectedMeta = form.serviceType ? SERVICE_META[form.serviceType] : null;

  const PriorityPills = () => (
    <View style={styles.pillRow}>
      {(["normal", "high", "urgent"] as const).map((priority) => {
        const active = form.priority === priority;
        return (
          <TouchableOpacity
            key={priority}
            onPress={() => setField("priority", priority)}
            activeOpacity={0.8}
            style={[
              styles.pill,
              {
                borderRadius: radius.md,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? `${colors.primary}14` : colors.surface,
              },
            ]}
          >
            <Text style={[styles.pillText, { color: active ? colors.primary : colors.textMuted }]}>{priority.toUpperCase()}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

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
      activeOpacity={0.8}
      style={[
        styles.toggle,
        {
          borderRadius: radius.md,
          borderColor: value ? colors.primary : colors.border,
          backgroundColor: value ? `${colors.primary}14` : colors.surface,
        },
      ]}
    >
      <Ionicons name={value ? "checkmark-circle" : "ellipse-outline"} size={16} color={value ? colors.primary : colors.textMuted} />
      <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlayAccent]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxl + insets.bottom,
            gap: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={[styles.backButton, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons name="arrow-back" size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{isViewing ? "Request Details" : "Service Request"}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {isViewing ? "Viewing submitted request" : selectedMeta ? selectedMeta.subtitle : "Choose service type and submit quickly"}
              </Text>
            </View>
          </View>

          {loadingExisting ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>Loading request...</Text>
            </View>
          ) : null}
          {loadingExisting ? null : (
          <>
          {isViewing ? null : (
          <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}>
            <SectionHeader title="Service Type" subtitle="Pick one to continue" />
            <View style={[styles.stack, { marginTop: spacing.sm }]}>
              {Object.values(SERVICE_META).map((service) => (
                <ServiceTypeCard
                  key={service.type}
                  service={service}
                  selected={form.serviceType === service.type}
                  onPress={() => {
                    setField("serviceType", service.type);
                    if (!form.title.trim()) setField("title", defaultTitleFor(service.type));
                  }}
                />
              ))}
            </View>
            {fieldErrors.serviceType ? <Text style={[styles.fieldError, { color: colors.error }]}>{fieldErrors.serviceType}</Text> : null}
          </View>
          )}

          <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
            <SectionHeader title="Quick Request" subtitle="Required fields first" />
            <View style={[styles.stack, { marginTop: spacing.sm }]}> 
              <Field
                label="Title"
                required
                value={form.title}
                onChangeText={(value) => setField("title", value)}
                placeholder="Brief request title"
                errorText={fieldErrors.title}
              />

              <Field
                label="Description (optional)"
                value={form.description}
                onChangeText={(value) => setField("description", value)}
                placeholder="Context, urgency, or constraints"
                multiline
              />

              <View>
                <Text style={[styles.label, { color: colors.textMuted }]}>Priority</Text>
                <PriorityPills />
              </View>

              {form.serviceType === "machine_repair" ? (
                <>
                  <Field
                    label="Machine type"
                    required
                    value={form.machineType}
                    onChangeText={(value) => setField("machineType", value)}
                    placeholder="cnc, press, packaging"
                    errorText={fieldErrors.machineType}
                  />
                  <Field
                    label="Issue summary"
                    required
                    value={form.issueSummary}
                    onChangeText={(value) => setField("issueSummary", value)}
                    placeholder="What is failing right now?"
                    errorText={fieldErrors.issueSummary}
                  />
                </>
              ) : null}

              {form.serviceType === "worker" ? (
                <>
                  <Field
                    label="Industry"
                    required
                    value={form.workerIndustry}
                    onChangeText={(value) => setField("workerIndustry", value)}
                    placeholder="automotive, textile, packaging"
                    errorText={fieldErrors.workerIndustry}
                  />
                  <Field
                    label="Headcount"
                    required
                    value={form.headcount}
                    onChangeText={(value) => setField("headcount", value.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder="1"
                    errorText={fieldErrors.headcount}
                  />
                </>
              ) : null}

              {form.serviceType === "transport" ? (
                <>
                  <Field
                    label="Pickup city"
                    required
                    value={form.pickupCity}
                    onChangeText={(value) => setField("pickupCity", value)}
                    placeholder="Where from?"
                    errorText={fieldErrors.pickupCity}
                  />
                  <Field
                    label="Drop city"
                    required
                    value={form.dropCity}
                    onChangeText={(value) => setField("dropCity", value)}
                    placeholder="Where to?"
                    errorText={fieldErrors.dropCity}
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
                              {
                                borderRadius: radius.pill,
                                borderColor: active ? colors.primary : colors.border,
                                backgroundColor: active ? `${colors.primary}16` : colors.surfaceElevated,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillText,
                                { color: active ? colors.primary : colors.textMuted, textTransform: "none" },
                              ]}
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
                    <Field
                      label="Or enter product ID"
                      value={form.advertisementProductId}
                      onChangeText={(value) => setField("advertisementProductId", value)}
                      placeholder="Paste product id"
                      errorText={fieldErrors.advertisementProductId}
                    />
                  </View>

                  <Field
                    label="Goal / objective"
                    value={form.advertisementObjective}
                    onChangeText={(value) => setField("advertisementObjective", value)}
                    placeholder="What should this ad achieve?"
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
                              {
                                borderRadius: radius.md,
                                borderColor: active ? colors.primary : colors.border,
                                backgroundColor: active ? `${colors.primary}14` : colors.surface,
                              },
                            ]}
                          >
                            <Text style={[styles.pillText, { color: active ? colors.primary : colors.textMuted }]}>
                              {mode.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <Field
                    label="Shopper categories (comma separated)"
                    value={form.adShopperCategories}
                    onChangeText={(value) => setField("adShopperCategories", value)}
                    placeholder="metal-steel-industry, packaging"
                  />
                </>
              ) : null}

              <QuickAdvancedToggle
                advanced={form.advancedOpen}
                onToggle={() => setField("advancedOpen", !form.advancedOpen)}
              />
            </View>
          </View>

          {form.advancedOpen ? (
            <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <SectionHeader title="Advanced Details" subtitle="Optional fields for better assignment" />

              <View style={[styles.stack, { marginTop: spacing.sm }]}> 
                <Field label="Contact name" value={form.contactName} onChangeText={(value) => setField("contactName", value)} />
                <Field
                  label="Contact email"
                  value={form.contactEmail}
                  onChangeText={(value) => setField("contactEmail", value)}
                  keyboardType="email-address"
                />
                <Field
                  label="Contact phone"
                  value={form.contactPhone}
                  onChangeText={(value) => setField("contactPhone", value)}
                  keyboardType="phone-pad"
                />
                <Field
                  label="Preferred channel"
                  value={form.preferredChannel}
                  onChangeText={(value) => setField("preferredChannel", value as FormState["preferredChannel"])}
                  placeholder="phone | email | chat"
                />

                <Field label="Address line" value={form.locationLine1} onChangeText={(value) => setField("locationLine1", value)} />
                <Field label="City" value={form.locationCity} onChangeText={(value) => setField("locationCity", value)} />
                <Field label="State" value={form.locationState} onChangeText={(value) => setField("locationState", value)} />
                <Field label="Country" value={form.locationCountry} onChangeText={(value) => setField("locationCountry", value)} />
                <Field label="Postal code" value={form.locationPostal} onChangeText={(value) => setField("locationPostal", value)} />

                <Field
                  label="Schedule start"
                  value={form.scheduleStart}
                  onChangeText={(value) => setField("scheduleStart", value)}
                  placeholder="YYYY-MM-DD"
                />
                <Field
                  label="Schedule end"
                  value={form.scheduleEnd}
                  onChangeText={(value) => setField("scheduleEnd", value)}
                  placeholder="YYYY-MM-DD"
                />
                <Toggle
                  label={form.scheduleFlexible ? "Flexible schedule" : "Fixed schedule"}
                  value={form.scheduleFlexible}
                  onPress={() => setField("scheduleFlexible", !form.scheduleFlexible)}
                />
                <Field
                  label="Schedule notes"
                  value={form.scheduleNotes}
                  onChangeText={(value) => setField("scheduleNotes", value)}
                />

                <Field
                  label="Budget estimate"
                  value={form.budgetEstimate}
                  onChangeText={(value) => setField("budgetEstimate", value.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                />
                <Field
                  label="Budget currency"
                  value={form.budgetCurrency}
                  onChangeText={(value) => setField("budgetCurrency", value.toUpperCase())}
                />

                {form.serviceType === "machine_repair" ? (
                  <>
                    <Field label="Machine name" value={form.machineName} onChangeText={(value) => setField("machineName", value)} />
                    <Field
                      label="Manufacturer"
                      value={form.machineManufacturer}
                      onChangeText={(value) => setField("machineManufacturer", value)}
                    />
                    <Field label="Model" value={form.machineModel} onChangeText={(value) => setField("machineModel", value)} />
                    <Field
                      label="Issue details"
                      value={form.issueDetails}
                      onChangeText={(value) => setField("issueDetails", value)}
                      multiline
                    />
                    <Field
                      label="Severity"
                      value={form.severity}
                      onChangeText={(value) => setField("severity", value as FormState["severity"])}
                      placeholder="low | medium | high | critical"
                    />
                    <Field
                      label="Warranty"
                      value={form.warrantyStatus}
                      onChangeText={(value) => setField("warrantyStatus", value as FormState["warrantyStatus"])}
                      placeholder="in_warranty | out_of_warranty | unknown"
                    />
                    <Toggle
                      label={form.requiresDowntime ? "Downtime required" : "No downtime required"}
                      value={form.requiresDowntime}
                      onPress={() => setField("requiresDowntime", !form.requiresDowntime)}
                    />
                  </>
                ) : null}

                {form.serviceType === "worker" ? (
                  <>
                    <Field
                      label="Roles (comma separated)"
                      value={form.workerRoles}
                      onChangeText={(value) => setField("workerRoles", value)}
                    />
                    <Field
                      label="Experience"
                      value={form.experienceLevel}
                      onChangeText={(value) => setField("experienceLevel", value as FormState["experienceLevel"])}
                    />
                    <Field
                      label="Shift"
                      value={form.shiftType}
                      onChangeText={(value) => setField("shiftType", value as FormState["shiftType"])}
                    />
                    <Field
                      label="Contract"
                      value={form.contractType}
                      onChangeText={(value) => setField("contractType", value as FormState["contractType"])}
                    />
                    <Field
                      label="Start date"
                      value={form.workerStart}
                      onChangeText={(value) => setField("workerStart", value)}
                      placeholder="YYYY-MM-DD"
                    />
                    <Field
                      label="Duration weeks"
                      value={form.durationWeeks}
                      onChangeText={(value) => setField("durationWeeks", value.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                    />
                    <Field label="Skills" value={form.workerSkills} onChangeText={(value) => setField("workerSkills", value)} />
                    <Field
                      label="Certifications"
                      value={form.workerCertifications}
                      onChangeText={(value) => setField("workerCertifications", value)}
                    />
                    <Field
                      label="Languages"
                      value={form.workerLanguages}
                      onChangeText={(value) => setField("workerLanguages", value)}
                    />
                    <Field label="Safety clearances" value={form.workerSafety} onChangeText={(value) => setField("workerSafety", value)} />
                  </>
                ) : null}

                {form.serviceType === "transport" ? (
                  <>
                    <Field
                      label="Mode"
                      value={form.transportMode}
                      onChangeText={(value) => setField("transportMode", value as FormState["transportMode"])}
                    />
                    <Field label="Pickup state" value={form.pickupState} onChangeText={(value) => setField("pickupState", value)} />
                    <Field label="Drop state" value={form.dropState} onChangeText={(value) => setField("dropState", value)} />
                    <Field label="Load type" value={form.loadType} onChangeText={(value) => setField("loadType", value)} />
                    <Field
                      label="Load weight tons"
                      value={form.loadWeightTons}
                      onChangeText={(value) => setField("loadWeightTons", value.replace(/[^0-9.]/g, ""))}
                      keyboardType="decimal-pad"
                    />
                    <Field label="Vehicle type" value={form.vehicleType} onChangeText={(value) => setField("vehicleType", value)} />
                    <Field
                      label="Special handling"
                      value={form.specialHandling}
                      onChangeText={(value) => setField("specialHandling", value)}
                      multiline
                    />
                    <Toggle
                      label={form.requiresReturnTrip ? "Return trip required" : "One-way"}
                      value={form.requiresReturnTrip}
                      onPress={() => setField("requiresReturnTrip", !form.requiresReturnTrip)}
                    />
                    <Toggle
                      label={form.insuranceNeeded ? "Insurance needed" : "No insurance"}
                      value={form.insuranceNeeded}
                      onPress={() => setField("insuranceNeeded", !form.insuranceNeeded)}
                    />
                  </>
                ) : null}

                {form.serviceType === "advertisement" ? (
                  <>
                    <Field
                      label="Target user IDs (comma separated)"
                      value={form.adTargetUserIds}
                      onChangeText={(value) => setField("adTargetUserIds", value)}
                      placeholder="Optional explicit users"
                    />
                    <Field
                      label="Shopper subcategories"
                      value={form.adShopperSubCategories}
                      onChangeText={(value) => setField("adShopperSubCategories", value)}
                    />
                    <Field
                      label="Buy-intent categories"
                      value={form.adBuyIntentCategories}
                      onChangeText={(value) => setField("adBuyIntentCategories", value)}
                    />
                    <Field
                      label="Buy-intent subcategories"
                      value={form.adBuyIntentSubCategories}
                      onChangeText={(value) => setField("adBuyIntentSubCategories", value)}
                    />
                    <Field
                      label="Listed-product categories"
                      value={form.adListedProductCategories}
                      onChangeText={(value) => setField("adListedProductCategories", value)}
                    />
                    <Field
                      label="Listed-product subcategories"
                      value={form.adListedProductSubCategories}
                      onChangeText={(value) => setField("adListedProductSubCategories", value)}
                    />
                    <Toggle
                      label={form.adRequireSameCategory ? "Must have listed product in same category" : "Same-category listing optional"}
                      value={form.adRequireSameCategory}
                      onPress={() => setField("adRequireSameCategory", !form.adRequireSameCategory)}
                    />
                    <Field
                      label="Lookback days"
                      value={form.adLookbackDays}
                      onChangeText={(value) => setField("adLookbackDays", value.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                    />
                    <Field
                      label="Ad start date"
                      value={form.adStartAt}
                      onChangeText={(value) => setField("adStartAt", value)}
                      placeholder="YYYY-MM-DD"
                    />
                    <Field
                      label="Ad end date"
                      value={form.adEndAt}
                      onChangeText={(value) => setField("adEndAt", value)}
                      placeholder="YYYY-MM-DD"
                    />
                    <Field label="Headline" value={form.adHeadline} onChangeText={(value) => setField("adHeadline", value)} />
                    <Field label="Subtitle" value={form.adSubtitle} onChangeText={(value) => setField("adSubtitle", value)} />
                    <Field label="CTA label" value={form.adCtaLabel} onChangeText={(value) => setField("adCtaLabel", value)} />
                    <Field label="Badge" value={form.adBadge} onChangeText={(value) => setField("adBadge", value)} />
                    <Field
                      label="Frequency cap / day"
                      value={form.adFrequencyCap}
                      onChangeText={(value) => setField("adFrequencyCap", value.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                    />
                    <Field
                      label="Priority (1-100)"
                      value={form.adPriority}
                      onChangeText={(value) => setField("adPriority", value.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                    />
                  </>
                ) : null}

                <Field label="Notes" value={form.notes} onChangeText={(value) => setField("notes", value)} multiline />
              </View>
            </View>
          ) : null}

          <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}>
            {isViewing ? (
              <Text style={[styles.submitHint, { color: colors.textMuted }]}>This request has already been submitted.</Text>
            ) : (
              <>
                <Text style={[styles.submitHint, { color: colors.textMuted }]}>Review required fields and submit. You can add more details later if needed.</Text>
                <Button label={user?.role === "guest" ? "Login to submit" : "Submit request"} onPress={submit} loading={submitting} />
              </>
            )}
          </View>
          </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  errorText,
  required,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  errorText?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad" | "decimal-pad" | "email-address" | "phone-pad";
}) => {
  const { colors, radius } = useTheme();
  const hasError = Boolean(errorText);

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
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
          styles.input,
          {
            borderRadius: radius.md,
            borderColor: hasError ? colors.error : colors.border,
            backgroundColor: colors.surfaceElevated,
            color: colors.text,
            minHeight: multiline ? 84 : 48,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
      />
      {hasError ? <Text style={[styles.fieldError, { color: colors.error }]}>{errorText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.2 },
  headerSubtitle: { marginTop: 2, fontSize: 12, fontWeight: "600" },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  stack: { gap: 10 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 5 },
  fieldWrap: { gap: 2 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  fieldError: { marginTop: 5, fontSize: 11, fontWeight: "700" },
  fieldHelper: { fontSize: 11, fontWeight: "600" },
  submitHint: { fontSize: 12, fontWeight: "600", lineHeight: 17, marginBottom: 6 },
  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  toggle: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: { fontSize: 12, fontWeight: "700" },
});
