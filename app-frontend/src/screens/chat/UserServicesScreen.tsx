import { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { AnimatedCard, StaggeredCardList, PulseAnimation, SlideInView } from "../../components/ui";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useRoute } from "@react-navigation/native";
import {
  serviceRequestService,
  ServiceType,
  ServicePriority,
  CreateServiceRequestInput,
} from "../../services/serviceRequest.service";
import { ApiError } from "../../services/http";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";

/**
 * Legacy service request screen kept for backward reference.
 * Active service request flow now lives in /screens/services/ServiceRequestScreen.
 */

type ServiceFormState = {
  serviceType: ServiceType | null;
  title: string;
  description: string;
  priority: ServicePriority;
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
  // Machine repair
  machineType: string;
  machineName: string;
  machineManufacturer: string;
  machineModel: string;
  issueSummary: string;
  issueDetails: string;
  severity: "low" | "medium" | "high" | "critical";
  warrantyStatus: "in_warranty" | "out_of_warranty" | "unknown";
  requiresDowntime: boolean;
  machineStart: string;
  machineEnd: string;
  machineScheduleNotes: string;
  machineFlexible: boolean;
  // Worker
  workerIndustry: string;
  rolesInput: string;
  headcount: string;
  experienceLevel: "entry" | "mid" | "senior" | "expert";
  shiftType: "day" | "night" | "rotational" | "flexible";
  contractType: "one_time" | "short_term" | "long_term";
  workerStart: string;
  durationWeeks: string;
  skillsInput: string;
  certificationsInput: string;
  languagesInput: string;
  safetyInput: string;
  perWorkerBudget: string;
  perWorkerCurrency: string;
  // Transport
  transportMode: "road" | "rail" | "air" | "sea";
  pickupCity: string;
  pickupState: string;
  dropCity: string;
  dropState: string;
  loadType: string;
  loadWeightTons: string;
  vehicleType: string;
  requiresReturnTrip: boolean;
  specialHandling: string;
  transportStart: string;
  transportEnd: string;
  transportFlexible: boolean;
  availabilityNotes: string;
  insuranceNeeded: boolean;
};

const SERVICE_OPTIONS: Array<{
  id: ServiceType;
  title: string;
  subtitle: string;
  icon: string;
  gradient: [string, string];
}> = [
  {
    id: "machine_repair",
    title: "Machine Repair",
    subtitle: "Precision, heavy, packaging & custom lines",
    icon: "🛠️",
    gradient: ["#19B8E6", "#4CCEEF"],
  },
  {
    id: "worker",
    title: "Expert Workforce",
    subtitle: "Screened operators, technicians, supervisors",
    icon: "👷‍♂️",
    gradient: ["#F56E79", "#FFB07A"],
  },
  {
    id: "transport",
    title: "Transport & Fleet",
    subtitle: "Road, rail, air & sea with secured handling",
    icon: "🚚",
    gradient: ["#4CCEEF", "#19B8E6"],
  },
];

const PRIORITY_OPTIONS: Array<{ id: ServicePriority; label: string }> = [
  { id: "normal", label: "Standard" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

const MACHINE_TYPES = [
  { id: "cnc", label: "CNC / Precision" },
  { id: "lathe", label: "Lathe" },
  { id: "press", label: "Presses" },
  { id: "conveyor", label: "Conveyors" },
  { id: "hydraulic", label: "Hydraulic / Pneumatic" },
  { id: "boiler_generator", label: "Boiler / Generator" },
  { id: "packaging", label: "Packaging Line" },
  { id: "custom", label: "Custom" },
];

const WORKER_INDUSTRIES = [
  { id: "automotive", label: "Automotive" },
  { id: "textile", label: "Textile" },
  { id: "packaging", label: "Packaging" },
  { id: "logistics", label: "Logistics" },
  { id: "electronics", label: "Electronics" },
  { id: "chemical", label: "Chemical" },
  { id: "fmcg", label: "FMCG" },
  { id: "heavy_machinery", label: "Heavy Machinery" },
  { id: "construction", label: "Construction" },
  { id: "pharma", label: "Pharma" },
  { id: "general", label: "General" },
];

const TRANSPORT_MODES: Array<{ id: ServiceFormState["transportMode"]; label: string }> = [
  { id: "road", label: "Road" },
  { id: "rail", label: "Rail" },
  { id: "air", label: "Air" },
  { id: "sea", label: "Sea" },
];

const INITIAL_FORM: ServiceFormState = {
  serviceType: null,
  title: "",
  description: "",
  priority: "normal",
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
  budgetCurrency: "USD",
  notes: "",
  machineType: "cnc",
  machineName: "",
  machineManufacturer: "",
  machineModel: "",
  issueSummary: "",
  issueDetails: "",
  severity: "medium",
  warrantyStatus: "unknown",
  requiresDowntime: true,
  machineStart: "",
  machineEnd: "",
  machineScheduleNotes: "",
  machineFlexible: true,
  workerIndustry: "general",
  rolesInput: "",
  headcount: "",
  experienceLevel: "mid",
  shiftType: "day",
  contractType: "short_term",
  workerStart: "",
  durationWeeks: "",
  skillsInput: "",
  certificationsInput: "",
  languagesInput: "",
  safetyInput: "",
  perWorkerBudget: "",
  perWorkerCurrency: "USD",
  transportMode: "road",
  pickupCity: "",
  pickupState: "",
  dropCity: "",
  dropState: "",
  loadType: "",
  loadWeightTons: "",
  vehicleType: "Flatbed",
  requiresReturnTrip: false,
  specialHandling: "",
  transportStart: "",
  transportEnd: "",
  transportFlexible: true,
  availabilityNotes: "",
  insuranceNeeded: true,
};

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const buildAvailability = (start?: string, end?: string, flexible?: boolean, notes?: string) => {
  if (!start && !end && !notes && flexible === undefined) return undefined;
  return {
    startDate: start ? new Date(start) : undefined,
    endDate: end ? new Date(end) : undefined,
    isFlexible: flexible,
    notes: notes?.trim() || undefined,
  };
};

const buildLocation = (input: {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}) => {
  const payload = {
    line1: input.line1?.trim(),
    city: input.city?.trim(),
    state: input.state?.trim(),
    country: input.country?.trim(),
    postalCode: input.postalCode?.trim(),
  };
  const hasValue = Object.values(payload).some((val) => Boolean(val));
  return hasValue ? payload : undefined;
};

type ServiceRoute = RouteProp<RootStackParamList, "ServiceRequest"> | RouteProp<RootStackParamList, "Main">;

export const UserServicesScreen = () => {
  const { colors, spacing } = useTheme();
  const { success: toastSuccess, error: toastError } = useToast();
  const { user, requestLogin } = useAuth();
  const route = useRoute<ServiceRoute>();

  const [form, setForm] = useState<ServiceFormState>(INITIAL_FORM);
  const [hasStarted, setHasStarted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);

  const selectedService = useMemo(
    () => SERVICE_OPTIONS.find((opt) => opt.id === form.serviceType) || null,
    [form.serviceType]
  );

  const updateField = useCallback(<K extends keyof ServiceFormState>(key: K, value: ServiceFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => ({ ...prev, [key as string]: "" }));
    }
  }, [errors]);

  const selectServiceType = (type: ServiceType) => {
    updateField("serviceType", type);
    setHasStarted(true);
    if (type === "machine_repair") {
      updateField("title", "Precision machine repair");
      updateField("priority", "urgent");
    } else if (type === "worker") {
      updateField("title", "Certified workforce need");
      updateField("priority", "high");
    } else {
      updateField("title", "Transport & fleet booking");
      updateField("priority", "high");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.serviceType) newErrors.serviceType = "Choose a service to continue";
    if (!form.title.trim()) newErrors.title = "Add a clear title";
    if (form.serviceType === "machine_repair") {
      if (!form.machineType) newErrors.machineType = "Select machine type";
      if (!form.issueSummary.trim()) newErrors.issueSummary = "What needs attention?";
    }
    if (form.serviceType === "worker") {
      if (!form.workerIndustry) newErrors.workerIndustry = "Pick an industry";
      if (!form.headcount || Number(form.headcount) < 1) newErrors.headcount = "Headcount must be 1+";
    }
    if (form.serviceType === "transport") {
      if (!form.pickupCity.trim()) newErrors.pickupCity = "Where to pick up?";
      if (!form.dropCity.trim()) newErrors.dropCity = "Where to drop?";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const requestedType = (route.params as any)?.serviceType as ServiceType | undefined;
    if (requestedType && requestedType !== form.serviceType) {
      selectServiceType(requestedType);
    }
  }, [route.params, form.serviceType]);

  const mapToPayload = (): CreateServiceRequestInput => {
    if (!form.serviceType) {
      throw new Error("Service type is required");
    }

    const base: CreateServiceRequestInput = {
      serviceType: form.serviceType,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      contact: {
        name: form.contactName.trim() || undefined,
        email: form.contactEmail.trim() || undefined,
        phone: form.contactPhone.trim() || undefined,
        preferredChannel: form.preferredChannel,
      },
      location: buildLocation({
        line1: form.locationLine1,
        city: form.locationCity,
        state: form.locationState,
        country: form.locationCountry,
        postalCode: form.locationPostal,
      }),
      schedule: buildAvailability(form.scheduleStart, form.scheduleEnd, form.scheduleFlexible, form.scheduleNotes),
      budget: form.budgetEstimate
        ? {
            estimatedCost: toNumber(form.budgetEstimate),
            currency: form.budgetCurrency || "USD",
          }
        : undefined,
      notes: form.notes.trim() || undefined,
    };

    if (form.serviceType === "machine_repair") {
      base.machineRepairDetails = {
        machineType: form.machineType,
        machineName: form.machineName.trim() || undefined,
        manufacturer: form.machineManufacturer.trim() || undefined,
        model: form.machineModel.trim() || undefined,
        issueSummary: form.issueSummary.trim(),
        issueDetails: form.issueDetails.trim() || undefined,
        severity: form.severity,
        requiresDowntime: form.requiresDowntime,
        warrantyStatus: form.warrantyStatus,
        preferredSchedule: buildAvailability(
          form.machineStart,
          form.machineEnd,
          form.machineFlexible,
          form.machineScheduleNotes
        ),
      };
    }

    if (form.serviceType === "worker") {
      base.workerDetails = {
        industry: form.workerIndustry,
        roles: parseList(form.rolesInput),
        headcount: Number(form.headcount) || 1,
        experienceLevel: form.experienceLevel,
        shiftType: form.shiftType,
        contractType: form.contractType,
        startDate: form.workerStart ? new Date(form.workerStart) : undefined,
        durationWeeks: toNumber(form.durationWeeks),
        skills: parseList(form.skillsInput),
        certifications: parseList(form.certificationsInput),
        safetyClearances: parseList(form.safetyInput),
        languagePreferences: parseList(form.languagesInput),
        budgetPerWorker: form.perWorkerBudget
          ? {
              amount: toNumber(form.perWorkerBudget),
              currency: form.perWorkerCurrency || "USD",
            }
          : undefined,
      };
    }

    if (form.serviceType === "transport") {
      base.transportDetails = {
        mode: form.transportMode,
        pickupLocation: buildLocation({
          city: form.pickupCity,
          state: form.pickupState,
          country: form.locationCountry,
        }),
        dropLocation: buildLocation({
          city: form.dropCity,
          state: form.dropState,
          country: form.locationCountry,
        }),
        loadType: form.loadType.trim() || undefined,
        loadWeightTons: toNumber(form.loadWeightTons),
        vehicleType: form.vehicleType.trim() || undefined,
        requiresReturnTrip: form.requiresReturnTrip,
        availability: buildAvailability(
          form.transportStart,
          form.transportEnd,
          form.transportFlexible,
          form.availabilityNotes
        ),
        specialHandling: form.specialHandling.trim() || undefined,
        insuranceNeeded: form.insuranceNeeded,
      };
    }

    return base;
  };

  const handleSubmit = async () => {
    if (!user) {
      requestLogin();
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = mapToPayload();
      const service = await serviceRequestService.create(payload);
      toastSuccess("Request submitted", "Our admin desk will confirm shortly.");
      setLastRequestId(service._id);
      setForm((prev) => ({
        ...INITIAL_FORM,
        serviceType: prev.serviceType,
        title: prev.title,
        priority: prev.priority,
        locationCountry: prev.locationCountry,
      }));
      setHasStarted(false);
    } catch (err: any) {
      const apiError = err as ApiError;
      const message = apiError?.message || "Could not submit request";
      toastError("Submission failed", message);
      if (apiError?.status === 422 && (apiError?.data as any)?.errors) {
        const validationErrors = ((apiError.data as any).errors as Array<{ msg: string; path: string }>).reduce(
          (acc, curr) => {
            acc[curr.path] = curr.msg;
            return acc;
          },
          {} as Record<string, string>
        );
        setErrors(validationErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderPriorityPills = () => (
    <View style={styles.pillRow}>
      {PRIORITY_OPTIONS.map((opt) => {
        const active = form.priority === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.pill,
              {
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primary + "20" : colors.backgroundSecondary,
              },
            ]}
            onPress={() => updateField("priority", opt.id)}
          >
            <Text style={[styles.pillLabel, { color: active ? colors.primary : colors.text }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderOptions = (options: Array<{ id: string; label: string }>, selected: string, field: keyof ServiceFormState) => (
    <View style={styles.pillRowWrap}>
      {options.map((opt) => {
        const active = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.chip,
              {
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primary + "22" : colors.backgroundSecondary,
              },
            ]}
            onPress={() => updateField(field as any, opt.id as any)}
          >
            <Text style={[styles.chipText, { color: active ? colors.primary : colors.text }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderMachineSection = () => (
    <SlideInView style={{ marginTop: spacing.lg }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Machine details</Text>
      {renderOptions(MACHINE_TYPES, form.machineType, "machineType")}
      <InputField
        label="Machine name"
        value={form.machineName}
        onChangeText={(text) => updateField("machineName", text)}
        placeholder="Laser cutter, multi-head packer..."
      />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <InputField
            label="Manufacturer"
            value={form.machineManufacturer}
            onChangeText={(text) => updateField("machineManufacturer", text)}
            placeholder="OEM"
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputField
            label="Model"
            value={form.machineModel}
            onChangeText={(text) => updateField("machineModel", text)}
            placeholder="Model / version"
          />
        </View>
      </View>
      <InputField
        label="Issue summary"
        required
        value={form.issueSummary}
        onChangeText={(text) => updateField("issueSummary", text)}
        placeholder="E.g. axis drift, conveyor misalignment"
        errorText={errors.issueSummary}
      />
      <InputField
        label="Issue details"
        value={form.issueDetails}
        onChangeText={(text) => updateField("issueDetails", text)}
        placeholder="Share symptoms, alarms, downtime windows"
        multiline
        style={{ minHeight: 90, textAlignVertical: "top" }}
      />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subLabel, { color: colors.textMuted }]}>Severity</Text>
          {renderOptions(
            [
              { id: "low", label: "Low" },
              { id: "medium", label: "Medium" },
              { id: "high", label: "High" },
              { id: "critical", label: "Critical" },
            ],
            form.severity,
            "severity"
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subLabel, { color: colors.textMuted }]}>Warranty</Text>
          {renderOptions(
            [
              { id: "unknown", label: "Unknown" },
              { id: "in_warranty", label: "In warranty" },
              { id: "out_of_warranty", label: "Out of warranty" },
            ],
            form.warrantyStatus,
            "warrantyStatus"
          )}
        </View>
      </View>
      <View style={styles.inlineToggleRow}>
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              borderColor: form.requiresDowntime ? colors.primary : colors.border,
              backgroundColor: form.requiresDowntime ? colors.primary + "1A" : colors.backgroundSecondary,
            },
          ]}
          onPress={() => updateField("requiresDowntime", !form.requiresDowntime)}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>
            {form.requiresDowntime ? "Downtime expected" : "No downtime required"}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.subLabel, { color: colors.textMuted, marginTop: spacing.md }]}>Preferred schedule</Text>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <InputField
            label="Start date"
            value={form.machineStart}
            onChangeText={(text) => updateField("machineStart", text)}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputField
            label="End date"
            value={form.machineEnd}
            onChangeText={(text) => updateField("machineEnd", text)}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>
      <View style={styles.inlineToggleRow}>
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              borderColor: form.machineFlexible ? colors.primary : colors.border,
              backgroundColor: form.machineFlexible ? colors.primary + "1A" : colors.backgroundSecondary,
            },
          ]}
          onPress={() => updateField("machineFlexible", !form.machineFlexible)}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>{form.machineFlexible ? "Flexible timing" : "Fixed timing"}</Text>
        </TouchableOpacity>
      </View>
      <InputField
        label="Schedule notes"
        value={form.machineScheduleNotes}
        onChangeText={(text) => updateField("machineScheduleNotes", text)}
        placeholder="Downtime windows, shift change windows"
      />
    </SlideInView>
  );

  const renderWorkerSection = () => (
    <SlideInView style={{ marginTop: spacing.lg }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Workforce details</Text>
      {renderOptions(WORKER_INDUSTRIES, form.workerIndustry, "workerIndustry")}
      <InputField
        label="Roles needed"
        value={form.rolesInput}
        onChangeText={(text) => updateField("rolesInput", text)}
        placeholder="Supervisor, operator, QA..."
      />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <InputField
            label="Headcount"
            required
            keyboardType="number-pad"
            value={form.headcount}
            onChangeText={(text) => updateField("headcount", text)}
            errorText={errors.headcount}
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputField
            label="Experience level"
            value={form.experienceLevel}
            onChangeText={(text) => updateField("experienceLevel", text as any)}
            placeholder="entry | mid | senior | expert"
          />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <InputField
            label="Shift type"
            value={form.shiftType}
            onChangeText={(text) => updateField("shiftType", text as any)}
            placeholder="day | night | rotational"
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputField
            label="Contract type"
            value={form.contractType}
            onChangeText={(text) => updateField("contractType", text as any)}
            placeholder="one_time | short_term | long_term"
          />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <InputField
            label="Start date"
            value={form.workerStart}
            onChangeText={(text) => updateField("workerStart", text)}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputField
            label="Duration (weeks)"
            keyboardType="number-pad"
            value={form.durationWeeks}
            onChangeText={(text) => updateField("durationWeeks", text)}
            placeholder="e.g. 6"
          />
        </View>
      </View>
      <InputField
        label="Skills"
        value={form.skillsInput}
        onChangeText={(text) => updateField("skillsInput", text)}
        helperText="Comma separated"
      />
      <InputField
        label="Certifications"
        value={form.certificationsInput}
        onChangeText={(text) => updateField("certificationsInput", text)}
        helperText="Comma separated"
      />
      <InputField
        label="Safety clearances"
        value={form.safetyInput}
        onChangeText={(text) => updateField("safetyInput", text)}
        helperText="Comma separated"
      />
      <InputField
        label="Languages"
        value={form.languagesInput}
        onChangeText={(text) => updateField("languagesInput", text)}
        helperText="Comma separated"
      />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <InputField
            label="Budget / worker"
            keyboardType="decimal-pad"
            value={form.perWorkerBudget}
            onChangeText={(text) => updateField("perWorkerBudget", text)}
            placeholder="e.g. 1200"
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputField
            label="Currency"
            value={form.perWorkerCurrency}
            onChangeText={(text) => updateField("perWorkerCurrency", text)}
            placeholder="USD / INR"
          />
        </View>
      </View>
    </SlideInView>
  );

  const renderTransportSection = () => (
    <SlideInView style={{ marginTop: spacing.lg }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Transport details</Text>
      {renderOptions(TRANSPORT_MODES, form.transportMode, "transportMode")}
      <InputField
        label="Pickup city"
        required
        value={form.pickupCity}
        onChangeText={(text) => updateField("pickupCity", text)}
        errorText={errors.pickupCity}
        placeholder="From"
      />
      <InputField
        label="Pickup state"
        value={form.pickupState}
        onChangeText={(text) => updateField("pickupState", text)}
        placeholder="State / region"
      />
      <InputField
        label="Drop city"
        required
        value={form.dropCity}
        onChangeText={(text) => updateField("dropCity", text)}
        errorText={errors.dropCity}
        placeholder="To"
      />
      <InputField
        label="Drop state"
        value={form.dropState}
        onChangeText={(text) => updateField("dropState", text)}
        placeholder="State / region"
      />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <InputField
            label="Load type"
            value={form.loadType}
            onChangeText={(text) => updateField("loadType", text)}
            placeholder="Pallets, crates, bulk..."
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputField
            label="Weight (tons)"
            keyboardType="decimal-pad"
            value={form.loadWeightTons}
            onChangeText={(text) => updateField("loadWeightTons", text)}
            placeholder="e.g. 12"
          />
        </View>
      </View>
      <InputField
        label="Vehicle preference"
        value={form.vehicleType}
        onChangeText={(text) => updateField("vehicleType", text)}
        placeholder="Flatbed, container, reefer..."
      />
      <View style={styles.inlineToggleRow}>
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              borderColor: form.requiresReturnTrip ? colors.primary : colors.border,
              backgroundColor: form.requiresReturnTrip ? colors.primary + "1A" : colors.backgroundSecondary,
            },
          ]}
          onPress={() => updateField("requiresReturnTrip", !form.requiresReturnTrip)}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>{form.requiresReturnTrip ? "Return trip required" : "One-way trip"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              borderColor: form.insuranceNeeded ? colors.accent : colors.border,
              backgroundColor: form.insuranceNeeded ? colors.accent + "20" : colors.backgroundSecondary,
            },
          ]}
          onPress={() => updateField("insuranceNeeded", !form.insuranceNeeded)}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>{form.insuranceNeeded ? "Insurance needed" : "No insurance"}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.subLabel, { color: colors.textMuted, marginTop: spacing.md }]}>Availability window</Text>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <InputField
            label="Ready from"
            value={form.transportStart}
            onChangeText={(text) => updateField("transportStart", text)}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputField
            label="Deliver by"
            value={form.transportEnd}
            onChangeText={(text) => updateField("transportEnd", text)}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>
      <View style={styles.inlineToggleRow}>
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              borderColor: form.transportFlexible ? colors.primary : colors.border,
              backgroundColor: form.transportFlexible ? colors.primary + "1A" : colors.backgroundSecondary,
            },
          ]}
          onPress={() => updateField("transportFlexible", !form.transportFlexible)}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>{form.transportFlexible ? "Flexible slot" : "Fixed slot"}</Text>
        </TouchableOpacity>
      </View>
      <InputField
        label="Handling notes"
        value={form.specialHandling}
        onChangeText={(text) => updateField("specialHandling", text)}
        placeholder="Fragile, cold chain, escort..."
      />
      <InputField
        label="Availability notes"
        value={form.availabilityNotes}
        onChangeText={(text) => updateField("availabilityNotes", text)}
        placeholder="Dock timings, permits, escorts"
      />
    </SlideInView>
  );

  const renderTypeSection = () => {
    if (form.serviceType === "machine_repair") return renderMachineSection();
    if (form.serviceType === "worker") return renderWorkerSection();
    return renderTransportSection();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(108,99,255,0.12)", "rgba(74,201,255,0.05)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        <LinearGradient
          colors={["rgba(255,140,60,0.08)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <AnimatedCard variant="gradient" style={{ padding: 18, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <PulseAnimation>
                <View style={[styles.heroBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
                  <Text style={styles.heroBadgeText}>{selectedService?.icon || "✨"}</Text>
                </View>
              </PulseAnimation>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroTitle, { color: colors.text }]}>
                  {selectedService?.title || "Premium services on demand"}
                </Text>
                <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                  {selectedService?.subtitle || "Tell us what you need. We’ll coordinate the right experts and confirm details with you."}
                </Text>
              </View>
              <View style={[styles.heroTag, { backgroundColor: colors.accent + "15", borderColor: colors.accent }]}>
                <Text style={[styles.heroTagText, { color: colors.accent }]}>Step 1 of 3</Text>
              </View>
            </View>
            <View style={[styles.heroSteps, { borderColor: colors.border }]}>
              <Text style={[styles.heroStepLabel, { color: colors.textMuted }]}>How it works</Text>
              <View style={styles.heroStepRow}>
                <Text style={[styles.heroStep, { color: colors.text }]}><Text style={styles.heroStepStrong}>1.</Text> Share requirements</Text>
                <Text style={[styles.heroStep, { color: colors.text }]}><Text style={styles.heroStepStrong}>2.</Text> Admin assigns specialists</Text>
                <Text style={[styles.heroStep, { color: colors.text }]}><Text style={styles.heroStepStrong}>3.</Text> Track status in app</Text>
              </View>
            </View>
            {lastRequestId ? (
              <View style={[styles.successBanner, { borderColor: colors.primary }]}>
                <Text style={[styles.successText, { color: colors.text }]}>
                  Request logged • #{lastRequestId.slice(-6).toUpperCase()}
                </Text>
                <Text style={[styles.successSubText, { color: colors.textMuted }]}>
                  Our admin desk will confirm schedule and pricing shortly.
                </Text>
              </View>
            ) : null}
          </AnimatedCard>

          <View style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepPill, { color: colors.text, borderColor: colors.border }]}>Step 1</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore our services</Text>
            </View>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              First, see what we offer. Tap “Start request” on a card to open its tailored form.
            </Text>
          </View>
          <StaggeredCardList>
            {SERVICE_OPTIONS.map((option) => {
              const active = option.id === form.serviceType;
              return (
                <AnimatedCard
                  key={option.id}
                  variant="gradient"
                  style={
                    active
                      ? {
                          ...styles.serviceCard,
                          borderColor: colors.primary,
                          shadowColor: colors.primary,
                          shadowOpacity: 0.35,
                        }
                      : styles.serviceCard
                  }
                >
                  <LinearGradient
                    colors={option.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.serviceCardBg}
                  />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={[styles.serviceIcon, { backgroundColor: colors.background }]}>
                      <Text style={styles.serviceIconText}>{option.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.serviceTitle, { color: colors.text }]}>{option.title}</Text>
                      <Text style={[styles.serviceSubtitle, { color: colors.textMuted }]}>{option.subtitle}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.serviceBadge,
                        {
                          backgroundColor: active ? colors.primary + "25" : colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => selectServiceType(option.id)}
                    >
                      <Text style={[styles.serviceBadgeText, { color: active ? colors.primary : colors.textMuted }]}>
                        {active ? "Selected" : "Start request"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </AnimatedCard>
              );
            })}
          </StaggeredCardList>

          {!hasStarted || !form.serviceType ? (
            <AnimatedCard style={{ marginTop: spacing.lg }}>
              <View style={styles.stepHeader}>
                <Text style={[styles.stepPill, { color: colors.text, borderColor: colors.border }]}>Step 2</Text>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Service details</Text>
              </View>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                Tap “Start request” on a service to open its tailored form. Nothing is preselected by default.
              </Text>
              {errors.serviceType ? (
                <Text style={[styles.helperError, { color: "#FF7B87", marginTop: spacing.sm }]}>{errors.serviceType}</Text>
              ) : null}
            </AnimatedCard>
          ) : (
            <>
              <AnimatedCard style={{ marginTop: spacing.lg }}>
                <View style={styles.stepHeader}>
                  <Text style={[styles.stepPill, { color: colors.text, borderColor: colors.border }]}>Step 2</Text>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{selectedService?.title || "Service details"}</Text>
                </View>
                <InputField
                  label="Title"
                  required
                  value={form.title}
                  onChangeText={(text) => updateField("title", text)}
                  placeholder="Short headline for your request"
                  errorText={errors.title}
                />
                <InputField
                  label="Description"
                  value={form.description}
                  onChangeText={(text) => updateField("description", text)}
                  placeholder="Add context so we can assign the right team"
                  multiline
                  style={{ minHeight: 90, textAlignVertical: "top" }}
                />
                <Text style={[styles.subLabel, { color: colors.textMuted, marginBottom: spacing.sm }]}>Priority</Text>
                {renderPriorityPills()}
              </AnimatedCard>

              <AnimatedCard style={{ marginTop: spacing.md }}>
                <View style={styles.stepHeader}>
                  <Text style={[styles.stepPill, { color: colors.text, borderColor: colors.border }]}>Step 3</Text>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact & location</Text>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Contact name"
                      value={form.contactName}
                      onChangeText={(text) => updateField("contactName", text)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Phone"
                      value={form.contactPhone}
                      onChangeText={(text) => updateField("contactPhone", text)}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
                <InputField
                  label="Email"
                  value={form.contactEmail}
                  onChangeText={(text) => updateField("contactEmail", text)}
                  keyboardType="email-address"
                />
                <InputField
                  label="Address line"
                  value={form.locationLine1}
                  onChangeText={(text) => updateField("locationLine1", text)}
                  placeholder="Plant / warehouse"
                />
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="City"
                      value={form.locationCity}
                      onChangeText={(text) => updateField("locationCity", text)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="State"
                      value={form.locationState}
                      onChangeText={(text) => updateField("locationState", text)}
                    />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Country"
                      value={form.locationCountry}
                      onChangeText={(text) => updateField("locationCountry", text)}
                      placeholder="Country"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Postal code"
                      value={form.locationPostal}
                      onChangeText={(text) => updateField("locationPostal", text)}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <Text style={[styles.subLabel, { color: colors.textMuted, marginTop: spacing.sm }]}>Preferred dates</Text>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Start"
                      value={form.scheduleStart}
                      onChangeText={(text) => updateField("scheduleStart", text)}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="End"
                      value={form.scheduleEnd}
                      onChangeText={(text) => updateField("scheduleEnd", text)}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>
                <View style={styles.inlineToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      {
                        borderColor: form.scheduleFlexible ? colors.primary : colors.border,
                        backgroundColor: form.scheduleFlexible ? colors.primary + "1A" : colors.backgroundSecondary,
                      },
                    ]}
                    onPress={() => updateField("scheduleFlexible", !form.scheduleFlexible)}
                  >
                    <Text style={[styles.toggleText, { color: colors.text }]}>{form.scheduleFlexible ? "Flexible dates" : "Fixed dates"}</Text>
                  </TouchableOpacity>
                </View>
                <InputField
                  label="Schedule notes"
                  value={form.scheduleNotes}
                  onChangeText={(text) => updateField("scheduleNotes", text)}
                  placeholder="Off-shift windows, dock timing"
                />
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Budget estimate"
                      keyboardType="decimal-pad"
                      value={form.budgetEstimate}
                      onChangeText={(text) => updateField("budgetEstimate", text)}
                      placeholder="Optional"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Currency"
                      value={form.budgetCurrency}
                      onChangeText={(text) => updateField("budgetCurrency", text)}
                      placeholder="USD / INR"
                    />
                  </View>
                </View>
              </AnimatedCard>

              <AnimatedCard style={{ marginTop: spacing.md }}>
                {renderTypeSection()}
                <InputField
                  label="Additional notes"
                  value={form.notes}
                  onChangeText={(text) => updateField("notes", text)}
                  placeholder="Compliance, access, tooling, preferences"
                  multiline
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Admin will confirm schedule & pricing before dispatch.</Text>
                </View>
                <Button
                  label={user ? "Submit service request" : "Login to submit"}
                  onPress={handleSubmit}
                  loading={submitting}
                />
              </AnimatedCard>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heroBadge: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 22,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  heroTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroSteps: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  heroStepLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroStepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroStep: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.9,
  },
  heroStepStrong: {
    fontWeight: "800",
  },
  successBanner: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(108,99,255,0.12)",
  },
  successText: {
    fontSize: 14,
    fontWeight: "800",
  },
  successSubText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  serviceCard: {
    overflow: "hidden",
    position: "relative",
  },
  serviceCardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceIconText: {
    fontSize: 22,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  serviceSubtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  serviceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  pillRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  inlineToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 8,
  },
  toggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  helperError: {
    fontSize: 12,
    fontWeight: "700",
  },
});
