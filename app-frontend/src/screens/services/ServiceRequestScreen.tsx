import { useEffect, useMemo, useState } from "react";
import {
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
  ServiceType,
  serviceRequestService,
} from "../../services/serviceRequest.service";
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
});

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

  const [form, setForm] = useState<FormState>(() => initialForm(route.params?.serviceType));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!route.params?.serviceType) return;

    setForm((prev) => ({
      ...prev,
      serviceType: route.params?.serviceType || prev.serviceType,
      title: prev.title.trim() ? prev.title : defaultTitleFor(route.params?.serviceType || null),
    }));
  }, [route.params?.serviceType]);

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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxl + insets.bottom,
            gap: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
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
              <Text style={[styles.headerTitle, { color: colors.text }]}>Service Request</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {selectedMeta ? selectedMeta.subtitle : "Choose service type and submit quickly"}
              </Text>
            </View>
          </View>

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

                <Field label="Notes" value={form.notes} onChangeText={(value) => setField("notes", value)} multiline />
              </View>
            </View>
          ) : null}

          <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
            <Text style={[styles.submitHint, { color: colors.textMuted }]}>Review required fields and submit. You can add more details later if needed.</Text>
            <Button label={user?.role === "guest" ? "Login to submit" : "Submit request"} onPress={submit} loading={submitting} />
          </View>
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
