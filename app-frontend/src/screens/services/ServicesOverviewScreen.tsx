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
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { chatService } from "../../services/chat.service";
import { serviceRequestService, ServiceRequest, ServiceStatus } from "../../services/serviceRequest.service";
import type { RootStackParamList } from "../../navigation/types";
import { routes } from "../../navigation/routes";
import { SERVICE_META } from "./services.constants";
import {
  RecentRequestRow,
  SectionHeader,
  ServiceKpiStrip,
  ServiceTypeCard,
  SupportFab,
} from "./components";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OPEN_STATUSES: ServiceStatus[] = ["pending", "in_review", "scheduled"];

export const ServicesOverviewScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { user, requestLogin } = useAuth();
  const { error: toastError } = useToast();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  const isGuest = !user || user.role === "guest";

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

  const renderRequestsContent = () => {
    if (isGuest) {
      return (
        <View style={[styles.emptyCard, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Login to manage service requests</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Track request status, response time, and updates in one place.</Text>
          <TouchableOpacity
            style={[styles.inlineButton, { borderRadius: radius.md, backgroundColor: colors.primary }]}
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
        <View style={[styles.emptyCard, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Loading request dashboard...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.emptyCard, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load requests</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.inlineButton, { borderRadius: radius.md, backgroundColor: colors.primary }]}
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
        <View style={[styles.emptyCard, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No requests yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Start with a service card above and your request will appear here.</Text>
        </View>
      );
    }

    return (
      <View style={styles.requestList}>
        {requests.map((request) => (
          <RecentRequestRow
            key={request._id}
            request={request}
            onPress={() => navigation.navigate("ServiceRequest", { serviceType: request.serviceType })}
            onQuickAction={() => navigation.navigate("ServiceRequest", { serviceType: request.serviceType })}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlayAccent]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl + insets.bottom + 50,
          gap: spacing.lg,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Services</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>Operations command center for support, workforce, and logistics.</Text>
        </View>

        <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <SectionHeader title="My Requests" subtitle="Recent activity and status" />
          <View style={{ marginTop: spacing.md }}>
            <ServiceKpiStrip open={kpis.open} inProgress={kpis.inProgress} completed={kpis.completed} />
          </View>
        </View>

        <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <SectionHeader title="Service Catalog" subtitle="Start with the service you need" />
          <View style={[styles.catalogGrid, { marginTop: spacing.md }]}> 
            {Object.values(SERVICE_META).map((service) => (
              <ServiceTypeCard
                key={service.type}
                service={service}
                onPress={() => navigation.navigate("ServiceRequest", { serviceType: service.type })}
                onStart={() => navigation.navigate("ServiceRequest", { serviceType: service.type })}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <SectionHeader
            title="Recent Requests"
            subtitle="Latest request submissions"
            actionLabel={requests.length >= 5 || showAllRequests ? (showAllRequests ? "Show less" : "View all") : undefined}
            onAction={requests.length >= 5 || showAllRequests ? handleToggleRequests : undefined}
          />
          <View style={{ marginTop: spacing.md }}>{renderRequestsContent()}</View>
        </View>
      </ScrollView>

      <SupportFab loading={supportLoading} onPress={handleSupport} style={{ bottom: insets.bottom + 76 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  headerWrap: { gap: 4 },
  pageTitle: { fontSize: 28, fontWeight: "900", letterSpacing: -0.4 },
  pageSubtitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 2,
  },
  catalogGrid: { gap: 10 },
  requestList: { gap: 10 },
  emptyCard: {
    borderWidth: 1,
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
