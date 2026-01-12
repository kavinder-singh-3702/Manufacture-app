import { useState } from "react";
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
import { AnimatedCard, StaggeredCardList } from "../../components/ui";
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
