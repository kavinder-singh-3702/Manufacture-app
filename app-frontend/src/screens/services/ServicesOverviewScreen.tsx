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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { FadeInView } from "../../components/ui/AnimatedCard";
import { chatService } from "../../services/chat.service";
import { serviceRequestService, ServiceRequest, ServiceStatus } from "../../services/serviceRequest.service";
import type { RootStackParamList } from "../../navigation/types";
import { SERVICE_META, isServiceAvailable } from "./services.constants";
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
  const { contentPadding, sectionGap, fs, sp, isCompact } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";
  const { user, requestLogin } = useAuth();
  const { error: toastError } = useToast();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const pageBg = colors.background;

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
            { borderRadius: radius.lg, backgroundColor: neu.insetBg(isDark), marginHorizontal: contentPadding },
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
            { borderRadius: radius.lg, backgroundColor: neu.insetBg(isDark), marginHorizontal: contentPadding },
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
            { borderRadius: radius.lg, backgroundColor: neu.insetBg(isDark), marginHorizontal: contentPadding },
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
            { borderRadius: radius.lg, backgroundColor: neu.insetBg(isDark), marginHorizontal: contentPadding },
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
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: pageBg }]}
        contentContainerStyle={{
          paddingTop: spacing.md,
          // Bottom padding accommodates floating SupportFab (~76 + fab size) plus
          // bottom safe-area inset. Small extra so last card doesn't sit right under FAB.
          paddingBottom: insets.bottom + 110,
          gap: sectionGap + 4,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <FadeInView delay={0} duration={400}>
          <View style={[styles.heroHeader, { paddingHorizontal: contentPadding }]}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Services</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
              Operations command center for support, workforce, and logistics.
            </Text>
          </View>
        </FadeInView>

        {/* KPI Dashboard — neumorphic section */}
        <FadeInView delay={100} duration={400}>
          <View style={{ paddingHorizontal: contentPadding }}>
            <NeuSection isDark={isDark} borderRadius={radius.xl}>
              <SectionHeader title="My Requests" subtitle="Recent activity and status" />
              <View style={{ marginTop: spacing.md }}>
                <ServiceKpiStrip open={kpis.open} inProgress={kpis.inProgress} completed={kpis.completed} />
              </View>
            </NeuSection>
          </View>
        </FadeInView>

        {/* Service Catalog */}
        <View>
          <FadeInView delay={180} duration={400}>
            <View style={{ paddingHorizontal: contentPadding }}>
              <SectionHeader title="Service Catalog" subtitle="Start with the service you need" />
            </View>
          </FadeInView>

          <View style={[styles.catalogGrid, { marginTop: spacing.md }]}>
            {Object.values(SERVICE_META).map((service, index) => {
              // All four services in v1 are live. Future-proofing: as the
              // `ServiceType` union grows, any new entry not in
              // AVAILABLE_SERVICE_TYPES auto-renders as Coming Soon.
              const available = isServiceAvailable(service.type);
              return (
                <FadeInView key={service.type} delay={250 + index * 100} duration={450}>
                  <ServiceTypeCard
                    service={service}
                    accent={SERVICE_ACCENT_MAP[service.type]}
                    comingSoon={!available}
                    onPress={
                      available
                        ? () => navigation.navigate("ServiceRequest", { serviceType: service.type })
                        : undefined
                    }
                    onStart={
                      available
                        ? () => navigation.navigate("ServiceRequest", { serviceType: service.type })
                        : undefined
                    }
                  />
                </FadeInView>
              );
            })}

            {/* Business Setup Card — bold gradient (matches ServiceTypeCard) */}
            <FadeInView delay={650} duration={450}>
              <View
                style={{
                  borderRadius: radius.xl,
                  shadowColor: BUSINESS_ACCENT.glow,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.55,
                  shadowRadius: 18,
                  elevation: 8,
                }}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate("BusinessSetupRequest")}
                  activeOpacity={0.92}
                  style={{ borderRadius: radius.xl }}
                >
                  <LinearGradient
                    colors={BUSINESS_ACCENT.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      {
                        padding: isCompact ? sp(14) : sp(16),
                        gap: sp(12),
                        borderRadius: radius.xl,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: "rgba(255,255,255,0.10)",
                        overflow: "hidden",
                        position: "relative",
                      },
                    ]}
                  >
                    {/* Decorative blob */}
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: isCompact ? sp(140) : sp(160),
                        height: isCompact ? sp(140) : sp(160),
                        borderRadius: (isCompact ? sp(140) : sp(160)) / 2,
                        backgroundColor: BUSINESS_ACCENT.color + "26",
                      }}
                    />
                    <View style={[styles.businessHeader, { gap: sp(12) }]}>
                      <View
                        style={[
                          {
                            width: isCompact ? sp(48) : sp(52),
                            height: isCompact ? sp(48) : sp(52),
                            borderRadius: (isCompact ? sp(48) : sp(52)) / 2,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(255,255,255,0.10)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.18)",
                          },
                        ]}
                      >
                        <Text style={{ fontSize: fs(24) }}>{BUSINESS_ACCENT.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.businessTitle, { fontSize: fs(16), color: "#FFFFFF" }]}>Start your own business</Text>
                        <Text style={[styles.businessSubtitle, { fontSize: fs(12), lineHeight: fs(17), color: "rgba(255,255,255,0.74)" }]}>
                          Tell us your idea and get launch support from our team.
                        </Text>
                      </View>
                    </View>

                    {/* Hint pill — matches the structure of service cards */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: sp(10),
                        paddingVertical: sp(7),
                        borderRadius: radius.sm,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: "rgba(255,255,255,0.10)",
                      }}
                    >
                      <Ionicons name="information-circle-outline" size={fs(13)} color="rgba(255,255,255,0.78)" />
                      <Text
                        style={{
                          flex: 1,
                          fontSize: fs(11),
                          fontWeight: "600",
                          color: "rgba(255,255,255,0.86)",
                        }}
                        numberOfLines={1}
                      >
                        Share your business idea and contact details
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => navigation.navigate("BusinessSetupRequest")}
                      style={[
                        styles.businessCtaOuter,
                        {
                          borderRadius: radius.lg,
                          shadowColor: "rgba(0,0,0,0.35)",
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.4,
                          shadowRadius: 6,
                          elevation: 3,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.businessCtaGradient,
                          {
                            paddingVertical: sp(12),
                            paddingHorizontal: sp(16),
                            borderRadius: radius.lg,
                            backgroundColor: "rgba(255,255,255,0.96)",
                          },
                        ]}
                      >
                        <Text style={[styles.businessCtaText, { fontSize: fs(13), color: BUSINESS_ACCENT.color }]}>Start request</Text>
                        <View style={[styles.businessCtaArrow, { backgroundColor: BUSINESS_ACCENT.color }]}>
                          <Ionicons name="arrow-forward" size={fs(13)} color="#FFFFFF" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </FadeInView>
          </View>
        </View>

        {/* Recent Requests — edge-to-edge, gradient rows */}
        <View>
          <View style={{ paddingHorizontal: contentPadding }}>
            <SectionHeader
              title="Recent Requests"
              subtitle="Latest request submissions"
              actionLabel={requests.length >= 5 || showAllRequests ? (showAllRequests ? "Show less" : "View all") : undefined}
              onAction={requests.length >= 5 || showAllRequests ? handleToggleRequests : undefined}
            />
          </View>
          <View style={{ marginTop: spacing.md }}>{renderRequestsContent()}</View>
        </View>
      </ScrollView>

      <SupportFab loading={supportLoading} onPress={handleSupport} style={{ bottom: insets.bottom + 76 }} />
    </View>
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
