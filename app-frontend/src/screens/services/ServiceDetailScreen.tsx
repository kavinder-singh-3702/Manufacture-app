import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { AnimatedCard, SlideInView, PulseAnimation } from "../../components/ui";
import { Button } from "../../components/common/Button";
import { ServiceType } from "../../services/serviceRequest.service";
import type { RootStackParamList } from "../../navigation/types";
import { InputField } from "../../components/common/InputField";
import { useToast } from "../../components/ui/Toast";
import { serviceRequestService } from "../../services/serviceRequest.service";
import { ApiError } from "../../services/http";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, "ServiceDetail">;

const SERVICE_LIBRARY: Record<ServiceType, {
  title: string;
  subtitle: string;
  icon: string;
  gradient: [string, string];
  bullets: string[];
  highlights: string[];
  footer: string;
}> = {
  machine_repair: {
    title: "Machine Repair",
    subtitle: "Precision, heavy, packaging & custom lines",
    icon: "🛠️",
    gradient: ["#6C63FF", "#4AC9FF"],
    bullets: [
      "CNC & line diagnostics by vetted specialists",
      "OEM-grade parts sourcing & compliance",
      "Planned downtime windows to protect throughput",
    ],
    highlights: ["Predictive checks", "On-site / remote triage", "Warranty-safe repairs"],
    footer: "Share make/model and downtime windows. Admin will confirm a schedule before dispatch.",
  },
  worker: {
    title: "Expert Workforce",
    subtitle: "Screened operators, technicians, supervisors",
    icon: "👷‍♂️",
    gradient: ["#FF8C3C", "#FFB07A"],
    bullets: [
      "Industry-matched roles with verified skills",
      "Shift-ready rosters with safety-first onboarding",
      "Supervisors and QA leads available on request",
    ],
    highlights: ["Background screened", "PPE & safety ready", "Language-fit options"],
    footer: "List your headcount, shift type, and start date. We’ll finalize roster & rates with you.",
  },
  transport: {
    title: "Transport & Fleet",
    subtitle: "Road, rail, air & sea with secured handling",
    icon: "🚚",
    gradient: ["#4AC9FF", "#6C63FF"],
    bullets: [
      "Route planning and escorted loads",
      "Insurance-ready docs and compliance",
      "Special handling for fragile or cold chain",
    ],
    highlights: ["Multi-modal", "Return-trip options", "Dock timing coordination"],
    footer: "Tell us pickup/drop, load type, and timing. We plan the route and confirm before dispatch.",
  },
};

export const ServiceDetailScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const { serviceType } = route.params;
  const { success: toastSuccess, error: toastError } = useToast();

  const [issueSummary, setIssueSummary] = useState("");
  const [machineType, setMachineType] = useState("cnc");
  const [workerIndustry, setWorkerIndustry] = useState("general");
  const [headcount, setHeadcount] = useState("1");
  const [pickupCity, setPickupCity] = useState("");
  const [dropCity, setDropCity] = useState("");
  const [loadType, setLoadType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const service = useMemo(() => SERVICE_LIBRARY[serviceType], [serviceType]);

  const handleBack = () => navigation.goBack();
  const handleStartRequest = async () => {
    try {
      if (serviceType === "machine_repair" && !issueSummary.trim()) {
        toastError("Add the issue", "Share what needs attention to route you faster.");
        return;
      }
      if (serviceType === "worker" && (!headcount || Number(headcount) < 1)) {
        toastError("Headcount required", "Add how many people you need.");
        return;
      }
      if (serviceType === "transport" && (!pickupCity.trim() || !dropCity.trim())) {
        toastError("Add route", "Provide pickup and drop locations.");
        return;
      }

      setSubmitting(true);
      const base = {
        serviceType,
        title: `${service.title} assistance`,
        priority: "high" as const,
        description: notes.trim() || undefined,
      };

      if (serviceType === "machine_repair") {
        await serviceRequestService.create({
          ...base,
          machineRepairDetails: {
            machineType,
            issueSummary: issueSummary.trim(),
          },
        });
      } else if (serviceType === "worker") {
        await serviceRequestService.create({
          ...base,
          workerDetails: {
            industry: workerIndustry,
            headcount: Number(headcount) || 1,
          },
        });
      } else if (serviceType === "transport") {
        await serviceRequestService.create({
          ...base,
          transportDetails: {
            pickupLocation: { city: pickupCity.trim() },
            dropLocation: { city: dropCity.trim() },
            loadType: loadType.trim() || undefined,
          },
        });
      }

      toastSuccess("Request sent", "Our admin desk will contact you shortly.");
      navigation.navigate("Main", { screen: "services" as any });
    } catch (err: any) {
      const apiError = err as ApiError;
      toastError("Could not send request", apiError?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(108,99,255,0.18)", "rgba(74,201,255,0.08)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        <LinearGradient
          colors={["rgba(255,140,60,0.14)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1, position: "absolute", inset: 0 }}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
            <View style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.backText, { color: colors.text }]}>←</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.breadcrumb, { color: colors.textMuted }]}>Services / {service.title}</Text>
        </View>

        <AnimatedCard variant="gradient" style={{ padding: 20 }}>
          <LinearGradient
            colors={service.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroOverlay}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
              <Text style={styles.iconText}>{service.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{service.title}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{service.subtitle}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {service.highlights.map((tag) => (
                  <View key={tag} style={[styles.tag, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </AnimatedCard>

        <AnimatedCard style={{ padding: 16, gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What you get</Text>
          {service.bullets.map((bullet, idx) => (
            <SlideInView key={bullet} delay={60 * idx}>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.bulletText, { color: colors.text }]}>{bullet}</Text>
              </View>
            </SlideInView>
          ))}
        </AnimatedCard>

        <AnimatedCard style={{ padding: 16, gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick request</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>{service.footer}</Text>

          {serviceType === "machine_repair" && (
            <>
              <InputField
                label="Machine type"
                value={machineType}
                onChangeText={setMachineType}
                placeholder="cnc, packaging, press..."
              />
              <InputField
                label="Issue summary"
                required
                value={issueSummary}
                onChangeText={setIssueSummary}
                placeholder="Briefly describe the fault"
              />
            </>
          )}

          {serviceType === "worker" && (
            <>
              <InputField
                label="Industry"
                value={workerIndustry}
                onChangeText={setWorkerIndustry}
                placeholder="automotive, textile, packaging..."
              />
              <InputField
                label="Headcount"
                required
                keyboardType="number-pad"
                value={headcount}
                onChangeText={setHeadcount}
                placeholder="e.g. 5"
              />
            </>
          )}

          {serviceType === "transport" && (
            <>
              <InputField
                label="Pickup city"
                required
                value={pickupCity}
                onChangeText={setPickupCity}
                placeholder="Where from?"
              />
              <InputField
                label="Drop city"
                required
                value={dropCity}
                onChangeText={setDropCity}
                placeholder="Where to?"
              />
              <InputField
                label="Load type (optional)"
                value={loadType}
                onChangeText={setLoadType}
                placeholder="Pallets, crates, cold chain..."
              />
            </>
          )}

          <InputField
            label="Extra notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Timing, urgency, or special context"
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          <Button label="Get assistance" onPress={handleStartRequest} loading={submitting} />
        </AnimatedCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  backText: {
    fontSize: 18,
    fontWeight: "800",
  },
  breadcrumb: {
    fontSize: 13,
    fontWeight: "700",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    borderRadius: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  bodyText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
