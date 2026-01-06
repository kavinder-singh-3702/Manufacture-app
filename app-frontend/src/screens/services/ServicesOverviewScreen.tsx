import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { AnimatedCard, StaggeredCardList, PulseAnimation } from "../../components/ui";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SERVICE_CARDS = [
  {
    id: "machine_repair",
    title: "Machine Repair",
    subtitle: "Precision, heavy, packaging & custom lines",
    icon: "🛠️",
    gradient: ["#6C63FF", "#4AC9FF"] as [string, string],
    bullets: ["CNC & line diagnostics", "OEM-grade parts", "Planned downtime windows"],
  },
  {
    id: "worker",
    title: "Expert Workforce",
    subtitle: "Screened operators, technicians, supervisors",
    icon: "👷‍♂️",
    gradient: ["#FF8C3C", "#FFB07A"] as [string, string],
    bullets: ["Industry-matched skills", "Shift-ready rosters", "Safety-first onboarding"],
  },
  {
    id: "transport",
    title: "Transport & Fleet",
    subtitle: "Road, rail, air & sea with secured handling",
    icon: "🚚",
    gradient: ["#4AC9FF", "#6C63FF"] as [string, string],
    bullets: ["Route planning", "Escorted loads", "Insurance-ready docs"],
  },
] as const;

export const ServicesOverviewScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<Nav>();

  const heroGradient = useMemo(
    () => ["rgba(12,14,18,0.92)", "rgba(12,14,18,0.78)", "transparent"],
    []
  );

  const handleStart = (serviceType: string) => {
    navigation.navigate("ServiceDetail", { serviceType: serviceType as any });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        <LinearGradient
          colors={["rgba(12,14,18,0.85)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1, position: "absolute", inset: 0 }}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 44, gap: 16, alignItems: "center" }}>
        <AnimatedCard variant="gradient" style={[styles.heroCard, { maxWidth: 960 }]}>
          <LinearGradient
            colors={["#2B2646", "#211E35", "#161421"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.heroRing} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroBadgeRow}>
              <PulseAnimation>
                <View
                  style={[
                    styles.heroBadge,
                    { backgroundColor: colors.primary + "1f", borderColor: colors.primary, borderRadius: radius.lg },
                  ]}
                >
                  <Text style={styles.heroBadgeText}>⚡</Text>
                </View>
              </PulseAnimation>
              <View style={styles.heroTagWrap}>
                <Text style={[styles.heroTagText, { color: colors.text }]}>Concierge desk online</Text>
                <Text style={[styles.heroTagHint, { color: colors.textMuted }]}>Admins orchestrate every request</Text>
              </View>
            </View>
          </View>
          <View style={[styles.livePill, { borderColor: colors.border, backgroundColor: "#0F1115" }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.liveText, { color: colors.text }]}>Live routing</Text>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Services with a premium ops layer.</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textOnPrimary || colors.textMuted }]}>
              Give us the brief. We’ll match the right bench, confirm schedules, and keep approvals and updates in-app.
            </Text>
            <TouchableOpacity
              onPress={() => handleStart(SERVICE_CARDS[0].id)}
              activeOpacity={0.88}
              style={{ alignSelf: "flex-start" }}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark || colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaButton}
              >
                <Text style={[styles.ctaText, { color: colors.textOnPrimary || "#fff" }]}>Start a request</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        <View style={{ marginTop: spacing.sm, marginBottom: spacing.xs, width: "100%", maxWidth: 960 }}>
          <View style={styles.stepHeader}>
            <Text style={[styles.stepPill, { color: colors.text, borderColor: colors.border }]}>Our services</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pick a track to review details</Text>
          </View>
          <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
            Tap “Check it” to explore scope, FAQs, and send a short note to the admin desk.
          </Text>
        </View>

        <StaggeredCardList>
          {SERVICE_CARDS.map((option, idx) => (
            <AnimatedCard
              key={option.id}
              delay={idx * 80}
              style={[styles.serviceCard, { width: "100%", maxWidth: 960, backgroundColor: colors.surface }]}
            >
              <LinearGradient
                colors={[option.gradient[0] + "26", option.gradient[1] + "14"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.serviceCardBg}
              />
              <View style={[styles.serviceGlow, { backgroundColor: option.gradient[0] + "14" }]} />
              <View style={styles.serviceContent}>
                <View style={styles.serviceHeaderRow}>
                  <View style={[styles.serviceIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <LinearGradient
                      colors={[option.gradient[0], option.gradient[1]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.serviceIconText}>{option.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceTitle, { color: colors.text }]}>{option.title}</Text>
                    <Text style={[styles.serviceSubtitle, { color: colors.textMuted }]}>{option.subtitle}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusChip,
                      { borderColor: colors.border, backgroundColor: colors.primary + "12" },
                    ]}
                  >
                    <Text style={[styles.statusChipText, { color: colors.textOnPrimary || colors.text }]}>Concierge assigned</Text>
                  </View>
                </View>

                <View style={styles.bulletPills}>
                  {option.bullets.map((bullet) => (
                    <View
                      key={bullet}
                      style={[
                        styles.pill,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    >
                      <View style={[styles.pillDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.pillText, { color: colors.text }]}>{bullet}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.serviceFooterRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceFootnote, { color: colors.textMuted }]}>
                      Admins hold approvals, schedule crews, and keep documentation inside the request thread.
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleStart(option.id)} activeOpacity={0.88}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark || colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.serviceBadge, { borderColor: "transparent" }]}
                    >
                      <Text style={[styles.serviceBadgeText, { color: colors.textOnPrimary || "#fff" }]}>Check it</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedCard>
          ))}
        </StaggeredCardList>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    padding: 18,
    width: "100%",
    overflow: "hidden",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(108,99,255,0.18)",
    top: -80,
    right: -40,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(82,72,230,0.12)",
    bottom: -50,
    left: -30,
  },
  heroRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    top: 50,
    left: 50,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
    flexWrap: "wrap",
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  heroBadge: {
    padding: 12,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 20,
  },
  heroTagWrap: {
    gap: 4,
  },
  heroTagText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  heroTagHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  ctaButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "800",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  serviceCard: {
    overflow: "hidden",
    position: "relative",
  },
  serviceCardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  serviceGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -40,
    right: -30,
    opacity: 0.6,
  },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
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
    marginTop: 4,
  },
  serviceBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  serviceBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  serviceContent: {
    gap: 12,
  },
  serviceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  bulletPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  serviceFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  serviceFootnote: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
});
