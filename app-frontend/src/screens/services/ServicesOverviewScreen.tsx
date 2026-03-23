import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { FadeInView } from "../../components/ui/AnimatedCard";
import { chatService } from "../../services/chat.service";
import { serviceRequestService, ServiceRequest, ServiceStatus } from "../../services/serviceRequest.service";
import type { RootStackParamList } from "../../navigation/types";
import { SERVICE_META } from "./services.constants";
import { SERVICE_ACCENT_MAP, BUSINESS_ACCENT, neu, NEU_BG_LIGHT, NEU_BG_DARK } from "./services.palette";
import {
  RecentRequestRow,
  SectionHeader,
  ServiceKpiStrip,
  ServiceTypeCard,
  SupportFab,
} from "./components";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OPEN_STATUSES: ServiceStatus[] = ["pending", "in_review", "scheduled"];

/* ─── Neumorphic wrapper (reusable) ─────────────────────────────────── */

const NeuSection = ({
  children,
  isDark,
  borderRadius,
  style,
}: {
  children: React.ReactNode;
  isDark: boolean;
  borderRadius: number;
  style?: any;
}) => (
  <View style={[neu.lightShadow(isDark), { borderRadius }, style]}>
    <View style={[neu.darkShadow(isDark), { borderRadius }]}>
      <View style={[{ borderRadius, backgroundColor: neu.cardBg(isDark), padding: 16 }]}>
        {children}
      </View>
    </View>
  </View>
);

/* ─── Screen ────────────────────────────────────────────────────────── */

export const ServicesOverviewScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const { user, requestLogin } = useAuth();
  const { error: toastError } = useToast();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const pageBg = isDark ? NEU_BG_DARK : NEU_BG_LIGHT;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  const isGuest = !user || user.role === "guest";

  /* ── data loading (unchanged) ──────────────────────────────────────── */

  const loadRequests = useCallback(
    async (opts?: { refreshing?: boolean; forceLimit?: number }) => {
      if (isGuest) {
        setRequests([]);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const isRefreshing = Boolean(opts?.refreshing);
      const limit = opts?.forceLimit || (showAllRequests ? 30 : 5);

      if (!isRefreshing) setLoading(true);
      setError(null);

      try {
        const response = await serviceRequestService.list({
          limit,
          offset: 0,
          sort: "newest",
        });
        setRequests(response.services || []);
      } catch (err: any) {
        setError(err?.message || "Could not load service requests right now.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isGuest, showAllRequests]
  );

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests({ refreshing: true });
  }, [loadRequests]);

  const handleToggleRequests = useCallback(() => {
    const next = !showAllRequests;
    setShowAllRequests(next);
    loadRequests({ forceLimit: next ? 30 : 5 });
  }, [loadRequests, showAllRequests]);

  const handleSupport = useCallback(async () => {
    if (supportLoading) return;

    if (!user || user.role === "guest") {
      requestLogin();
      return;
    }

    setSupportLoading(true);
    try {
      const conversationId = await chatService.startConversation();
      navigation.navigate("Chat", {
        conversationId,
        recipientName: "Support Team",
      });
    } catch {
      toastError("Support unavailable", "Unable to open support chat right now.");
    } finally {
      setSupportLoading(false);
    }
  }, [navigation, requestLogin, supportLoading, toastError, user]);

  const kpis = useMemo(() => {
    const open = requests.filter((item) => OPEN_STATUSES.includes(item.status)).length;
    const inProgress = requests.filter((item) => item.status === "in_progress").length;
    const completed = requests.filter((item) => item.status === "completed").length;

    return { open, inProgress, completed };
  }, [requests]);

  /* ── requests content ──────────────────────────────────────────────── */

  const renderRequestsContent = () => {
    if (isGuest) {
      return (
        <View
          style={[
            styles.emptyCard,
            neu.pressed(isDark),
            { borderRadius: radius.lg, backgroundColor: neu.insetBg(isDark) },
          ]}
        >
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Login to manage service requests</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Track request status, response time, and updates in one place.
          </Text>
          <TouchableOpacity
            style={[styles.inlineButton, neu.buttonRaised(isDark), { borderRadius: radius.md, backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={requestLogin}
          >
            <Text style={[styles.inlineButtonText, { color: colors.textOnPrimary }]}>Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loading) {
      return (
        <View
          style={[
            styles.emptyCard,
            neu.pressed(isDark),
            { borderRadius: radius.lg, backgroundColor: neu.insetBg(isDark) },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Loading request dashboard...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View
          style={[
            styles.emptyCard,
            neu.pressed(isDark),
            { borderRadius: radius.lg, backgroundColor: neu.insetBg(isDark) },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load requests</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.inlineButton, neu.buttonRaised(isDark), { borderRadius: radius.md, backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => loadRequests()}
          >
            <Text style={[styles.inlineButtonText, { color: colors.textOnPrimary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!requests.length) {
      return (
        <View
          style={[
            styles.emptyCard,
            neu.pressed(isDark),
            { borderRadius: radius.lg, backgroundColor: neu.insetBg(isDark) },
          ]}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No requests yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Start with a service card above and your request will appear here.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.requestList}>
        {requests.map((request) => (
          <RecentRequestRow
            key={request._id}
            request={request}
            onPress={() => navigation.push("ServiceRequest", { serviceType: request.serviceType, serviceId: request._id })}
          />
        ))}
      </View>
    );
  };

  /* ── render ────────────────────────────────────────────────────────── */

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl + insets.bottom + 50,
          gap: 20,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <FadeInView delay={0} duration={400}>
          <View style={styles.heroHeader}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Services</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
              Operations command center for support, workforce, and logistics.
            </Text>
          </View>
        </FadeInView>

        {/* KPI Dashboard — neumorphic section */}
        <FadeInView delay={100} duration={400}>
          <NeuSection isDark={isDark} borderRadius={radius.xl}>
            <SectionHeader title="My Requests" subtitle="Recent activity and status" />
            <View style={{ marginTop: spacing.md }}>
              <ServiceKpiStrip open={kpis.open} inProgress={kpis.inProgress} completed={kpis.completed} />
            </View>
          </NeuSection>
        </FadeInView>

        {/* Service Catalog */}
        <View>
          <FadeInView delay={180} duration={400}>
            <SectionHeader title="Service Catalog" subtitle="Start with the service you need" />
          </FadeInView>

          <View style={[styles.catalogGrid, { marginTop: spacing.md }]}>
            {Object.values(SERVICE_META).map((service, index) => (
              <FadeInView key={service.type} delay={250 + index * 100} duration={450}>
                <ServiceTypeCard
                  service={service}
                  accent={SERVICE_ACCENT_MAP[service.type]}
                  onPress={() => navigation.navigate("ServiceRequest", { serviceType: service.type })}
                  onStart={() => navigation.navigate("ServiceRequest", { serviceType: service.type })}
                />
              </FadeInView>
            ))}

            {/* Business Setup Card — neumorphic */}
            <FadeInView delay={650} duration={450}>
              <View style={[neu.lightShadow(isDark), { borderRadius: radius.xl }]}>
                <View style={[neu.darkShadow(isDark), { borderRadius: radius.xl }]}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate("BusinessSetupRequest")}
                    style={[
                      styles.businessCard,
                      {
                        borderRadius: radius.xl,
                        backgroundColor: neu.cardBg(isDark),
                      },
                    ]}
                  >
                    <View style={styles.businessHeader}>
                      <View
                        style={[
                          styles.businessIcon,
                          neu.pressed(isDark),
                          {
                            borderRadius: 24,
                            backgroundColor: isDark ? `${BUSINESS_ACCENT.color}18` : BUSINESS_ACCENT.soft,
                          },
                        ]}
                      >
                        <Text style={styles.businessEmoji}>{BUSINESS_ACCENT.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.businessTitle, { color: colors.text }]}>Start your own business</Text>
                        <Text style={[styles.businessSubtitle, { color: colors.textMuted }]}>
                          Tell us your idea and get launch support from our team.
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate("BusinessSetupRequest")}
                      style={[
                        styles.businessCtaOuter,
                        neu.buttonRaised(isDark),
                        { borderRadius: radius.lg },
                      ]}
                    >
                      <LinearGradient
                        colors={[BUSINESS_ACCENT.color, `${BUSINESS_ACCENT.color}DD`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.businessCtaGradient, { borderRadius: radius.lg }]}
                      >
                        <Text style={styles.businessCtaText}>Start request</Text>
                        <View style={styles.businessCtaArrow}>
                          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              </View>
            </FadeInView>
          </View>
        </View>

        {/* Recent Requests — neumorphic section */}
        <NeuSection isDark={isDark} borderRadius={radius.xl}>
          <SectionHeader
            title="Recent Requests"
            subtitle="Latest request submissions"
            actionLabel={requests.length >= 5 || showAllRequests ? (showAllRequests ? "Show less" : "View all") : undefined}
            onAction={requests.length >= 5 || showAllRequests ? handleToggleRequests : undefined}
          />
          <View style={{ marginTop: spacing.md }}>{renderRequestsContent()}</View>
        </NeuSection>
      </ScrollView>

      <SupportFab loading={supportLoading} onPress={handleSupport} style={{ bottom: insets.bottom + 76 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  heroHeader: { gap: 4, paddingHorizontal: 4 },
  pageTitle: { fontSize: 28, fontWeight: "900", letterSpacing: -0.4 },
  pageSubtitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },

  catalogGrid: { gap: 14 },

  // Business card
  businessCard: {
    padding: 16,
    gap: 14,
    overflow: "hidden",
  },
  businessHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  businessIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  businessEmoji: { fontSize: 22 },
  businessTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  businessSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "500", lineHeight: 17 },
  businessCtaOuter: { overflow: "hidden" },
  businessCtaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  businessCtaText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 },
  businessCtaArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Requests
  requestList: { gap: 10 },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  emptyTitle: { fontSize: 14, fontWeight: "800" },
  emptySubtitle: { textAlign: "center", fontSize: 12, fontWeight: "600", lineHeight: 17 },
  inlineButton: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineButtonText: { fontSize: 12, fontWeight: "800" },
});
