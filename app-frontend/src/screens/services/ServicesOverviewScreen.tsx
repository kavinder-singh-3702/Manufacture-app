import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { AnimatedCard, StaggeredCardList, PulseAnimation } from "../../components/ui";
import { chatService } from "../../services/chat.service";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

const SERVICE_CARDS = [
  {
    id: "machine_repair",
    title: "Machine Repair",
    subtitle: "Precision, heavy, packaging & custom lines",
    icon: "🛠️",
    gradient: ["#5a6fd6", "#6b5b95"] as [string, string],
    accentGradient: ["#c9a0dc", "#b8829e"] as [string, string],
    bullets: ["CNC & line diagnostics", "OEM-grade parts", "Planned downtime windows"],
    stats: { rating: "4.9", jobs: "2.4k+" },
  },
  {
    id: "worker",
    title: "Expert Workforce",
    subtitle: "Screened operators, technicians, supervisors",
    icon: "👷‍♂️",
    gradient: ["#c9a0dc", "#b8829e"] as [string, string],
    accentGradient: ["#7ab8d9", "#5a9ebe"] as [string, string],
    bullets: ["Industry-matched skills", "Shift-ready rosters", "Safety-first onboarding"],
    stats: { rating: "4.8", jobs: "5.1k+" },
  },
  {
    id: "transport",
    title: "Transport & Fleet",
    subtitle: "Road, rail, air & sea with secured handling",
    icon: "🚚",
    gradient: ["#7ab8d9", "#5a9ebe"] as [string, string],
    accentGradient: ["#6dbfa3", "#5aab8f"] as [string, string],
    bullets: ["Route planning", "Escorted loads", "Insurance-ready docs"],
    stats: { rating: "4.9", jobs: "3.8k+" },
  },
] as const;

export const ServicesOverviewScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<Nav>();
  const [isContactingSupport, setIsContactingSupport] = useState(false);

  const heroGradient = useMemo(
    () => ["#0F0C29", "#302b63", "#24243e"] as const,
    []
  );

  const handleStart = (serviceType: string) => {
    navigation.navigate("ServiceDetail", { serviceType: serviceType as any });
  };

  const handleContactSupport = async () => {
    if (isContactingSupport) return;

    setIsContactingSupport(true);
    try {
      const conversationId = await chatService.startConversation();
      navigation.navigate("Chat", {
        conversationId,
        recipientName: "Support Team",
      });
    } catch (error) {
      console.error("Failed to start support chat:", error);
    } finally {
      setIsContactingSupport(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#0a0a0f" }]}>
      {/* Top Header with Support Button */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Services</Text>
        </View>
        <TouchableOpacity
          onPress={handleContactSupport}
          activeOpacity={0.85}
          disabled={isContactingSupport}
          style={styles.supportButtonContainer}
        >
          <LinearGradient
            colors={["#6dbfa3", "#5aab8f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.supportButton}
          >
            {isContactingSupport ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.supportButtonIcon}>💬</Text>
                <Text style={styles.supportButtonText}>Support</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {/* Animated background orbs - subtle */}
      <View style={styles.bgOrbContainer}>
        <LinearGradient
          colors={["#5a6fd6", "#6b5b95"]}
          style={[styles.bgOrb, styles.bgOrb1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={["#c9a0dc", "#b8829e"]}
          style={[styles.bgOrb, styles.bgOrb2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={["#7ab8d9", "#5a9ebe"]}
          style={[styles.bgOrb, styles.bgOrb3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Hero Section */}
        <AnimatedCard variant="gradient" style={styles.heroCard}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Decorative elements */}
          <View style={styles.heroDecoContainer}>
            <LinearGradient
              colors={["rgba(90,111,214,0.25)", "rgba(107,91,149,0.12)"]}
              style={styles.heroGlowOrb1}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <LinearGradient
              colors={["rgba(201,160,220,0.2)", "rgba(184,130,158,0.1)"]}
              style={styles.heroGlowOrb2}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.heroRing1} />
            <View style={styles.heroRing2} />
            <View style={styles.heroSparkle1} />
            <View style={styles.heroSparkle2} />
            <View style={styles.heroSparkle3} />
          </View>

          <View style={styles.heroContent}>
            {/* Status badge */}
            <View style={styles.heroBadgeContainer}>
              <PulseAnimation>
                <LinearGradient
                  colors={["#6dbfa3", "#5aab8f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.liveBadge}
                >
                  <View style={styles.liveDotOuter}>
                    <View style={styles.liveDotInner} />
                  </View>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </LinearGradient>
              </PulseAnimation>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Concierge Desk Online</Text>
                <Text style={styles.statusSubtitle}>24/7 Premium Support Active</Text>
              </View>
            </View>

            {/* Main hero text */}
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroEyebrow}>PREMIUM SERVICES</Text>
              <Text style={styles.heroTitle}>
                Industrial Solutions{"\n"}
                <Text style={styles.heroTitleAccent}>Delivered with Excellence</Text>
              </Text>
              <Text style={styles.heroDescription}>
                From machine repairs to workforce deployment — experience concierge-level
                service with real-time tracking and dedicated support.
              </Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>10k+</Text>
                <Text style={styles.statLabel}>Jobs Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4.9</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24/7</Text>
                <Text style={styles.statLabel}>Support</Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={() => handleStart(SERVICE_CARDS[0].id)}
              activeOpacity={0.9}
              style={styles.ctaContainer}
            >
              <LinearGradient
                colors={["#5a6fd6", "#6b5b95", "#c9a0dc"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>Start Your Request</Text>
                <Text style={styles.ctaArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <LinearGradient
              colors={["#5a6fd6", "#6b5b95"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionPill}
            >
              <Text style={styles.sectionPillText}>SERVICES</Text>
            </LinearGradient>
            <Text style={styles.sectionTitle}>Choose Your Service</Text>
          </View>
          <Text style={styles.sectionHint}>Tap to explore details</Text>
        </View>

        {/* Service Cards */}
        <StaggeredCardList>
          {SERVICE_CARDS.map((service, idx) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => handleStart(service.id)}
              activeOpacity={0.95}
              style={styles.serviceCardTouchable}
            >
              <AnimatedCard delay={idx * 100} style={styles.serviceCard}>
                {/* Card background gradient */}
                <LinearGradient
                  colors={[`${service.gradient[0]}15`, `${service.gradient[1]}08`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Decorative glow */}
                <LinearGradient
                  colors={[`${service.gradient[0]}30`, "transparent"]}
                  style={styles.cardGlow}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />

                {/* Card content */}
                <View style={styles.cardContent}>
                  {/* Header row */}
                  <View style={styles.cardHeader}>
                    <LinearGradient
                      colors={service.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconContainer}
                    >
                      <Text style={styles.serviceIcon}>{service.icon}</Text>
                    </LinearGradient>

                    <View style={styles.cardHeaderText}>
                      <Text style={styles.serviceTitle}>{service.title}</Text>
                      <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                    </View>

                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingStar}>★</Text>
                      <Text style={styles.ratingValue}>{service.stats.rating}</Text>
                    </View>
                  </View>

                  {/* Feature pills */}
                  <View style={styles.featurePillsContainer}>
                    {service.bullets.map((bullet, i) => (
                      <View key={bullet} style={styles.featurePill}>
                        <LinearGradient
                          colors={service.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.featureDot}
                        />
                        <Text style={styles.featureText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.jobsContainer}>
                      <Text style={styles.jobsValue}>{service.stats.jobs}</Text>
                      <Text style={styles.jobsLabel}>jobs completed</Text>
                    </View>

                    <LinearGradient
                      colors={service.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.exploreButton}
                    >
                      <Text style={styles.exploreButtonText}>Explore</Text>
                      <Text style={styles.exploreArrow}>→</Text>
                    </LinearGradient>
                  </View>
                </View>

                {/* Bottom accent line */}
                <LinearGradient
                  colors={service.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardAccentLine}
                />
              </AnimatedCard>
            </TouchableOpacity>
          ))}
        </StaggeredCardList>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  supportButtonContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    minWidth: 110,
    justifyContent: "center",
  },
  supportButtonIcon: {
    fontSize: 16,
  },
  supportButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  bgOrbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.15,
  },
  bgOrb1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  bgOrb2: {
    width: 250,
    height: 250,
    top: 400,
    left: -120,
  },
  bgOrb3: {
    width: 200,
    height: 200,
    bottom: 100,
    right: -80,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroDecoContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  heroGlowOrb1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
  },
  heroGlowOrb2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -40,
    left: -40,
  },
  heroRing1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    top: 40,
    right: 60,
  },
  heroRing2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    bottom: 60,
    left: 40,
  },
  heroSparkle1: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
    top: 80,
    right: 100,
  },
  heroSparkle2: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.4)",
    top: 140,
    left: 80,
  },
  heroSparkle3: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.5)",
    bottom: 100,
    right: 60,
  },
  heroContent: {
    padding: 24,
    gap: 20,
  },
  heroBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDotOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  statusSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  heroTextContainer: {
    gap: 12,
  },
  heroEyebrow: {
    color: "#c9a0dc",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
  },
  heroTitleAccent: {
    color: "#7ab8d9",
  },
  heroDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  ctaContainer: {
    alignSelf: "flex-start",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  ctaArrow: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    gap: 8,
  },
  sectionPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sectionPillText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  sectionHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },

  // Service Cards
  serviceCardTouchable: {
    width: "100%",
    maxWidth: 960,
  },
  serviceCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(26,26,46,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  cardGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -60,
  },
  cardContent: {
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  serviceIcon: {
    fontSize: 28,
  },
  cardHeaderText: {
    flex: 1,
  },
  serviceTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  serviceSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingStar: {
    color: "#ffd700",
    fontSize: 14,
  },
  ratingValue: {
    color: "#ffd700",
    fontSize: 14,
    fontWeight: "700",
  },
  featurePillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  jobsContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  jobsValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  jobsLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "500",
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  exploreArrow: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cardAccentLine: {
    height: 3,
  },
});
