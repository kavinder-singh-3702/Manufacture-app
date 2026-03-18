import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { useToast } from "../../components/ui/Toast";
import {
  businessSetupRequestService,
  BusinessBudgetRange,
  BusinessStartTimeline,
  BusinessSupportArea,
  BusinessWorkModel,
  CreateBusinessSetupRequestInput,
} from "../../services/businessSetupRequest.service";
import { RootStackParamList } from "../../navigation/types";
import { routes } from "../../navigation/routes";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Option<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

const WORK_MODE_OPTIONS: Option<BusinessWorkModel>[] = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "trading", label: "Trading" },
  { value: "services", label: "Services" },
  { value: "online", label: "Online / E-commerce" },
  { value: "hybrid", label: "Hybrid" },
  { value: "other", label: "Other" },
];

const BUDGET_OPTIONS: Option<BusinessBudgetRange>[] = [
  { value: "under_5_lakh", label: "Under 5 lakh" },
  { value: "5_10_lakh", label: "5 to 10 lakh" },
  { value: "10_25_lakh", label: "10 to 25 lakh" },
  { value: "25_50_lakh", label: "25 to 50 lakh" },
  { value: "50_lakh_1_cr", label: "50 lakh to 1 crore" },
  { value: "above_1_cr", label: "Above 1 crore" },
  { value: "undisclosed", label: "Prefer not to share" },
];

const TIMELINE_OPTIONS: Option<BusinessStartTimeline>[] = [
  { value: "immediately", label: "Immediately" },
  { value: "within_1_month", label: "Within 1 month" },
  { value: "1_3_months", label: "1 to 3 months" },
  { value: "3_6_months", label: "3 to 6 months" },
  { value: "6_plus_months", label: "6+ months" },
];

const SUPPORT_OPTIONS: Option<BusinessSupportArea>[] = [
  { value: "business_plan", label: "Business plan" },
  { value: "company_registration", label: "Company registration" },
  { value: "licenses", label: "Licenses" },
  { value: "factory_setup", label: "Factory setup" },
  { value: "vendor_sourcing", label: "Vendor sourcing" },
  { value: "finance_funding", label: "Finance/funding" },
  { value: "compliance_tax", label: "Compliance & tax" },
  { value: "hiring_training", label: "Hiring & training" },
  { value: "technology_setup", label: "Technology setup" },
  { value: "go_to_market", label: "Go-to-market" },
];

type FormState = {
  businessType: string;
  workModel: BusinessWorkModel | "";
  location: string;
  budgetRange: BusinessBudgetRange | "";
  startTimeline: BusinessStartTimeline | "";
  supportAreas: BusinessSupportArea[];
  founderExperience: "first_time" | "under_2_years" | "2_to_5_years" | "5_plus_years";
  teamSize: string;
  preferredContactChannel: "phone" | "email" | "whatsapp" | "chat";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
};

const INITIAL_FORM: FormState = {
  businessType: "",
  workModel: "",
  location: "",
  budgetRange: "",
  startTimeline: "",
  supportAreas: [],
  founderExperience: "first_time",
  teamSize: "",
  preferredContactChannel: "phone",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

export const BusinessSetupRequestScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_FORM,
    contactName: String(user?.displayName || "").trim(),
    contactEmail: String(user?.email || "").trim(),
    contactPhone: String((user?.phone as string) || "").trim(),
  }));

  const isGuest = !user || user.role === "guest";

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => {
      if (!previous[field as string]) return previous;
      const next = { ...previous };
      delete next[field as string];
      return next;
    });
  };

  const validateStepOne = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.businessType.trim()) nextErrors.businessType = "Business type is required";
    if (!form.workModel) nextErrors.workModel = "Select a work model";
    if (!form.location.trim()) nextErrors.location = "Location is required";
    if (!form.budgetRange) nextErrors.budgetRange = "Select budget range";
    if (!form.startTimeline) nextErrors.startTimeline = "Select your expected start timeline";

    setFieldErrors((previous) => ({ ...previous, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const validateFinal = () => {
    const nextErrors: Record<string, string> = {};

    if (isGuest && !form.contactName.trim()) {
      nextErrors.contactName = "Contact name is required for guest submissions";
    }

    if (isGuest && !form.contactEmail.trim() && !form.contactPhone.trim()) {
      nextErrors.contactEmail = "Add at least one contact method (email or phone)";
    }

    if (form.contactEmail.trim() && !/^\S+@\S+\.\S+$/.test(form.contactEmail.trim())) {
      nextErrors.contactEmail = "Enter a valid email";
    }

    setFieldErrors((previous) => ({ ...previous, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const payload = useMemo((): CreateBusinessSetupRequestInput => {
    const parsedTeamSize = Number(form.teamSize);

    return {
      businessType: form.businessType.trim(),
      workModel: form.workModel as BusinessWorkModel,
      location: form.location.trim(),
      budgetRange: form.budgetRange as BusinessBudgetRange,
      startTimeline: form.startTimeline as BusinessStartTimeline,
      supportAreas: form.supportAreas,
      founderExperience: form.founderExperience,
      teamSize: Number.isFinite(parsedTeamSize) && parsedTeamSize >= 0 ? parsedTeamSize : undefined,
      preferredContactChannel: form.preferredContactChannel,
      contactName: form.contactName.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
  }, [form]);

  const goToNext = () => {
    if (!validateStepOne()) return;
    setStep(2);
  };

  const submit = async () => {
    if (!validateFinal()) return;

    try {
      setSubmitting(true);
      const result = await businessSetupRequestService.create(payload);
      success(
        "Request submitted",
        `Tracking ID: ${result.trackingReference}. Our team will contact you soon.`
      );
      navigation.navigate("Main", { screen: routes.SERVICES });
    } catch (err: any) {
      error("Could not submit", err?.message || "Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          locations={[0, 0.58, 1]}
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
              style={[
                styles.backButton,
                { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="arrow-back" size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Start your own business</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Tell us your goal and our team will help you launch professionally.</Text>
            </View>
          </View>

          <View style={[styles.progressWrap, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface }]}>
            {[1, 2].map((index) => {
              const active = index === step;
              const done = index < step;
              return (
                <View key={index} style={styles.progressItem}>
                  <View
                    style={[
                      styles.progressDot,
                      {
                        borderRadius: radius.pill,
                        backgroundColor: done || active ? colors.primary : colors.surfaceElevated,
                        borderColor: done || active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.progressDotText, { color: done || active ? colors.textOnPrimary : colors.textMuted }]}>{index}</Text>
                  </View>
                  <Text style={[styles.progressLabel, { color: active ? colors.text : colors.textMuted }]}>
                    {index === 1 ? "Business basics" : "Support details"}
                  </Text>
                </View>
              );
            })}
          </View>

          {step === 1 ? (
            <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <InputField
                label="Which business are you starting?"
                required
                value={form.businessType}
                onChangeText={(value) => setField("businessType", value)}
                placeholder="e.g. Snacks manufacturing, packaging unit"
                errorText={fieldErrors.businessType}
              />

              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Work model *</Text>
              <ChipGrid
                options={WORK_MODE_OPTIONS}
                value={form.workModel}
                onSelect={(value) => setField("workModel", value)}
                errorText={fieldErrors.workModel}
              />

              <InputField
                label="Location"
                required
                value={form.location}
                onChangeText={(value) => setField("location", value)}
                placeholder="City, state"
                helperText="Where do you plan to operate this business?"
                errorText={fieldErrors.location}
              />

              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Expected budget *</Text>
              <ChipGrid
                options={BUDGET_OPTIONS}
                value={form.budgetRange}
                onSelect={(value) => setField("budgetRange", value)}
                errorText={fieldErrors.budgetRange}
              />

              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>When do you want to start? *</Text>
              <ChipGrid
                options={TIMELINE_OPTIONS}
                value={form.startTimeline}
                onSelect={(value) => setField("startTimeline", value)}
                errorText={fieldErrors.startTimeline}
              />

              <Button label="Continue" onPress={goToNext} />
            </View>
          ) : (
            <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Where do you need help?</Text>
              <MultiChipGrid
                options={SUPPORT_OPTIONS}
                values={form.supportAreas}
                onToggle={(value) => {
                  const exists = form.supportAreas.includes(value);
                  setField(
                    "supportAreas",
                    exists ? form.supportAreas.filter((item) => item !== value) : [...form.supportAreas, value]
                  );
                }}
              />

              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Preferred contact</Text>
              <ChipGrid
                options={[
                  { value: "phone", label: "Phone" },
                  { value: "email", label: "Email" },
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "chat", label: "Chat" },
                ]}
                value={form.preferredContactChannel}
                onSelect={(value) => setField("preferredContactChannel", value)}
              />

              <InputField
                label="Contact name"
                required={isGuest}
                value={form.contactName}
                onChangeText={(value) => setField("contactName", value)}
                placeholder="Your full name"
                errorText={fieldErrors.contactName}
              />

              <InputField
                label="Contact email"
                value={form.contactEmail}
                onChangeText={(value) => setField("contactEmail", value)}
                placeholder="name@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                errorText={fieldErrors.contactEmail}
              />

              <InputField
                label="Contact phone"
                value={form.contactPhone}
                onChangeText={(value) => setField("contactPhone", value)}
                placeholder="+91..."
                keyboardType="phone-pad"
              />

              <InputField
                label="Team size (optional)"
                value={form.teamSize}
                onChangeText={(value) => setField("teamSize", value.replace(/[^0-9]/g, ""))}
                placeholder="Current or expected team size"
                keyboardType="number-pad"
              />

              <InputField
                label="Additional notes"
                value={form.notes}
                onChangeText={(value) => setField("notes", value)}
                placeholder="Describe your requirements or constraints"
                multiline
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />

              <View style={styles.footerActions}>
                <Button label="Back" variant="secondary" onPress={() => setStep(1)} style={{ flex: 1 }} />
                <Button
                  label={submitting ? "Submitting..." : "Submit request"}
                  onPress={submit}
                  loading={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const ChipGrid = <T extends string>({
  options,
  value,
  onSelect,
  errorText,
}: {
  options: Array<Option<T>>;
  value: T | "";
  onSelect: (value: T) => void;
  errorText?: string;
}) => {
  const { colors, radius } = useTheme();

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={styles.chipGrid}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.86}
              onPress={() => onSelect(option.value)}
              style={[
                styles.chip,
                {
                  borderRadius: radius.md,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? `${colors.primary}14` : colors.surfaceElevated,
                },
              ]}
            >
              <Text style={[styles.chipLabel, { color: active ? colors.primary : colors.text }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {errorText ? <Text style={[styles.fieldError, { color: colors.error }]}>{errorText}</Text> : null}
    </View>
  );
};

const MultiChipGrid = <T extends string>({
  options,
  values,
  onToggle,
}: {
  options: Array<Option<T>>;
  values: T[];
  onToggle: (value: T) => void;
}) => {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.chipGrid, { marginBottom: 14 }]}> 
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.86}
            onPress={() => onToggle(option.value)}
            style={[
              styles.chip,
              {
                borderRadius: radius.md,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? `${colors.primary}14` : colors.surfaceElevated,
              },
            ]}
          >
            <Text style={[styles.chipLabel, { color: active ? colors.primary : colors.text }]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  progressWrap: {
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 26,
    height: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    padding: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  fieldError: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  footerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
});
