import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import {
  adminService,
  AdminCallLog,
  AdminConversationQueueItem,
  AdminServiceRequest,
} from "../../services/admin.service";
import { RootStackParamList } from "../../navigation/types";
import {
  AdminHeader,
  AdminSearchBar,
  AdminFilterTabs,
  AdminListCard,
  ReasonInputModal,
} from "../../components/admin";

type OpsView = "services" | "messages" | "calls";
type ServiceStatusFilter = "all" | "pending" | "in_review" | "scheduled" | "in_progress" | "completed" | "cancelled";

const PAGE_SIZE = 25;

const NEXT_STATUS: Partial<Record<string, string>> = {
  pending: "in_review",
  in_review: "scheduled",
  scheduled: "in_progress",
  in_progress: "completed",
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds?: number) => {
  const safe = Math.max(Number(seconds || 0), 0);
  const minutes = Math.floor(safe / 60);
  const rem = safe % 60;
  if (!minutes) return `${rem}s`;
  return `${minutes}m ${rem}s`;
};

export const AdminOpsConsoleScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeView, setActiveView] = useState<OpsView>("services");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<ServiceStatusFilter>("all");
  const [search, setSearch] = useState("");

  const [services, setServices] = useState<AdminServiceRequest[]>([]);
  const [servicePagination, setServicePagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceLoadingMore, setServiceLoadingMore] = useState(false);

  const [conversations, setConversations] = useState<AdminConversationQueueItem[]>([]);
  const [conversationPagination, setConversationPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationLoadingMore, setConversationLoadingMore] = useState(false);

  const [callLogs, setCallLogs] = useState<AdminCallLog[]>([]);
  const [callPagination, setCallPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [callLoading, setCallLoading] = useState(false);
  const [callLoadingMore, setCallLoadingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<AdminServiceRequest | null>(null);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);

  const [workflowTarget, setWorkflowTarget] = useState<{ request: AdminServiceRequest; targetStatus: string } | null>(null);
  const [workflowReason, setWorkflowReason] = useState("");
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const fetchServices = useCallback(
    async ({ reset = true, offset }: { reset?: boolean; offset?: number } = {}) => {
      const nextOffset = reset ? 0 : offset ?? 0;
      try {
        setError(null);
        if (reset) {
          setServiceLoading(true);
        } else {
          setServiceLoadingMore(true);
        }

        const response = await adminService.listServiceRequests({
          limit: servicePagination.limit,
          offset: nextOffset,
          search: search.trim() || undefined,
          status: serviceStatusFilter === "all" ? undefined : serviceStatusFilter,
          sort: "updatedAt:desc",
        });
        setServices((previous) => (reset ? response.requests : [...previous, ...response.requests]));
        setServicePagination(response.pagination);
      } catch (err: any) {
        setError(err.message || "Failed to load service queue");
      } finally {
        setServiceLoading(false);
        setServiceLoadingMore(false);
      }
    },
    [search, servicePagination.limit, serviceStatusFilter]
  );

  const fetchConversations = useCallback(
    async ({ reset = true, offset }: { reset?: boolean; offset?: number } = {}) => {
      const nextOffset = reset ? 0 : offset ?? 0;
      try {
        setError(null);
        if (reset) {
          setConversationLoading(true);
        } else {
          setConversationLoadingMore(true);
        }

        const response = await adminService.listConversations({
          limit: conversationPagination.limit,
          offset: nextOffset,
          search: search.trim() || undefined,
          sort: "updatedAt:desc",
        });
        setConversations((previous) => (reset ? response.conversations : [...previous, ...response.conversations]));
        setConversationPagination(response.pagination);
      } catch (err: any) {
        setError(err.message || "Failed to load conversations");
      } finally {
        setConversationLoading(false);
        setConversationLoadingMore(false);
      }
    },
    [conversationPagination.limit, search]
  );

  const fetchCallLogs = useCallback(
    async ({ reset = true, offset }: { reset?: boolean; offset?: number } = {}) => {
      const nextOffset = reset ? 0 : offset ?? 0;
      try {
        setError(null);
        if (reset) {
          setCallLoading(true);
        } else {
          setCallLoadingMore(true);
        }

        const response = await adminService.listCallLogs({
          limit: callPagination.limit,
          offset: nextOffset,
          sort: "startedAt:desc",
        });
        setCallLogs((previous) => (reset ? response.callLogs : [...previous, ...response.callLogs]));
        setCallPagination(response.pagination);
      } catch (err: any) {
        setError(err.message || "Failed to load call logs");
      } finally {
        setCallLoading(false);
        setCallLoadingMore(false);
      }
    },
    [callPagination.limit]
  );

  const refreshActive = useCallback(() => {
    setRefreshing(true);
    if (activeView === "services") {
      fetchServices({ reset: true }).finally(() => setRefreshing(false));
      return;
    }
    if (activeView === "messages") {
      fetchConversations({ reset: true }).finally(() => setRefreshing(false));
      return;
    }
    fetchCallLogs({ reset: true }).finally(() => setRefreshing(false));
  }, [activeView, fetchCallLogs, fetchConversations, fetchServices]);

  useFocusEffect(
    useCallback(() => {
      if (activeView === "services") {
        fetchServices({ reset: true });
      } else if (activeView === "messages") {
        fetchConversations({ reset: true });
      } else {
        fetchCallLogs({ reset: true });
      }
    }, [activeView, fetchCallLogs, fetchConversations, fetchServices])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeView === "services") {
        fetchServices({ reset: true });
      } else if (activeView === "messages") {
        fetchConversations({ reset: true });
      } else {
        fetchCallLogs({ reset: true });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [activeView, fetchCallLogs, fetchConversations, fetchServices, search, serviceStatusFilter]);

  const openChat = useCallback(
    (conversation: AdminConversationQueueItem) => {
      const participant = conversation.otherParticipant;
      if (!participant) return;
      navigation.navigate("Chat", {
        conversationId: conversation.id,
        recipientId: participant.id,
        recipientName: participant.name || "User",
        recipientPhone: participant.phone,
      });
    },
    [navigation]
  );

  const callUser = useCallback(async (phone?: string) => {
    if (!phone) {
      Alert.alert("No phone number", "This participant has no phone number.");
      return;
    }
    const cleaned = phone.replace(/[^\d+]/g, "");
    const url = `tel:${cleaned}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Call unavailable", phone);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Call unavailable", phone);
    }
  }, []);

  const updateServiceLocally = useCallback((next: AdminServiceRequest) => {
    setServices((previous) => previous.map((entry) => (entry.id === next.id ? next : entry)));
    setSelectedService((previous) => (previous?.id === next.id ? next : previous));
  }, []);

  const openWorkflowModal = useCallback((request: AdminServiceRequest, targetStatus: string) => {
    setWorkflowTarget({ request, targetStatus });
    setWorkflowReason("");
    setWorkflowError(null);
  }, []);

  const submitWorkflow = useCallback(async () => {
    if (!workflowTarget) return;
    const reason = workflowReason.trim();
    if (!reason) {
      setWorkflowError("Reason is required.");
      return;
    }
    try {
      setWorkflowLoading(true);
      const response = await adminService.updateServiceRequestWorkflow(workflowTarget.request.id, {
        status: workflowTarget.targetStatus,
        reason,
        contextCompanyId: workflowTarget.request.company?.id || undefined,
        expectedUpdatedAt: workflowTarget.request.updatedAt,
      });
      updateServiceLocally(response.request);
      setWorkflowTarget(null);
      setWorkflowReason("");
      setWorkflowError(null);
    } catch (err: any) {
      setWorkflowError(err.message || "Failed to update workflow");
    } finally {
      setWorkflowLoading(false);
    }
  }, [updateServiceLocally, workflowReason, workflowTarget]);

  const viewTabs = useMemo(
    () => [
      { key: "services" as OpsView, label: "Services" },
      { key: "messages" as OpsView, label: "Messages" },
      { key: "calls" as OpsView, label: "Calls" },
    ],
    []
  );

  const serviceStatusTabs = useMemo(
    () => [
      { key: "all" as ServiceStatusFilter, label: "All" },
      { key: "pending" as ServiceStatusFilter, label: "Pending" },
      { key: "in_review" as ServiceStatusFilter, label: "In review" },
      { key: "in_progress" as ServiceStatusFilter, label: "In progress" },
      { key: "completed" as ServiceStatusFilter, label: "Done" },
      { key: "cancelled" as ServiceStatusFilter, label: "Cancelled" },
    ],
    []
  );

  const renderServiceItem = useCallback(
    ({ item }: { item: AdminServiceRequest }) => (
      <AdminListCard
        title={item.title}
        subtitle={`${item.serviceType.replace(/_/g, " ")} • ${item.company?.displayName || "No company"}`}
        avatarText={(item.title || "S")[0].toUpperCase()}
        status={{ label: item.status.replace(/_/g, " "), type: item.status === "completed" ? "success" : item.status === "cancelled" ? "error" : "warning" }}
        meta={`Priority: ${item.priority} • Updated ${formatDate(item.updatedAt)}`}
        onPress={() => {
          setSelectedService(item);
          setServiceModalVisible(true);
        }}
        rightContent={
          NEXT_STATUS[item.status] ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openWorkflowModal(item, NEXT_STATUS[item.status] as string)}
              style={[styles.quickAction, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700" }}>Advance</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    ),
    [colors.border, colors.primary, colors.surfaceElevated, openWorkflowModal, radius.md]
  );

  const renderConversationItem = useCallback(
    ({ item }: { item: AdminConversationQueueItem }) => (
      <AdminListCard
        title={item.otherParticipant?.name || "Conversation"}
        subtitle={item.lastMessage || "No message yet"}
        avatarText={(item.otherParticipant?.name || "U")[0].toUpperCase()}
        status={{ label: item.unreadCount ? `${item.unreadCount} unread` : "Read", type: item.unreadCount ? "warning" : "neutral" }}
        meta={`Last activity ${formatDate(item.updatedAt)}`}
        onPress={() => openChat(item)}
        rightContent={
          <TouchableOpacity
            onPress={() => callUser(item.otherParticipant?.phone)}
            style={[styles.callButton, { backgroundColor: colors.badgePrimary, borderRadius: radius.pill }]}
          >
            <Ionicons name="call-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        }
      />
    ),
    [callUser, colors.badgePrimary, colors.primary, openChat, radius.pill]
  );

  const renderCallItem = useCallback(
    ({ item }: { item: AdminCallLog }) => (
      <AdminListCard
        title={`${item.caller?.displayName || "Unknown"} → ${item.callee?.displayName || "Unknown"}`}
        subtitle={item.notes || "Call log"}
        avatarText="C"
        status={{ label: formatDuration(item.durationSeconds), type: "neutral" }}
        meta={`Started ${formatDate(item.startedAt)}`}
        onPress={() => {
          if (item.callee?.email || item.caller?.email) {
            Alert.alert("Call details", `Caller: ${item.caller?.email || "-"}\nCallee: ${item.callee?.email || "-"}`);
          }
        }}
      />
    ),
    []
  );

  const data = activeView === "services" ? services : activeView === "messages" ? conversations : callLogs;
  const loading = activeView === "services" ? serviceLoading : activeView === "messages" ? conversationLoading : callLoading;
  const loadingMore = activeView === "services" ? serviceLoadingMore : activeView === "messages" ? conversationLoadingMore : callLoadingMore;
  const pagination = activeView === "services" ? servicePagination : activeView === "messages" ? conversationPagination : callPagination;
  const renderItem = activeView === "services" ? renderServiceItem : activeView === "messages" ? renderConversationItem : renderCallItem;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data as any[]}
        key={activeView}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem as any}
        ListHeaderComponent={
          <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
            <AdminHeader
              title="Ops Console"
              subtitle="Control services, messages, and calls from one queue."
              count={pagination.total}
            />
            <AdminSearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={activeView === "services" ? "Search services..." : "Search users, messages, or phone..."}
            />
            <AdminFilterTabs tabs={viewTabs} activeTab={activeView} onTabChange={setActiveView} />
            {activeView === "services" ? (
              <AdminFilterTabs tabs={serviceStatusTabs} activeTab={serviceStatusFilter} onTabChange={setServiceStatusFilter} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.emptyState, { paddingHorizontal: spacing.lg }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No records in this queue.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (loadingMore || !pagination.hasMore) return;
          const nextOffset = pagination.offset + pagination.limit;
          if (activeView === "services") {
            fetchServices({ reset: false, offset: nextOffset });
          } else if (activeView === "messages") {
            fetchConversations({ reset: false, offset: nextOffset });
          } else {
            fetchCallLogs({ reset: false, offset: nextOffset });
          }
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshActive} tintColor={colors.primary} />}
      />

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + "15", borderColor: colors.error + "40", marginHorizontal: spacing.lg, borderRadius: radius.md }]}>
          <Text style={{ color: colors.error, fontSize: 12, fontWeight: "700" }}>{error}</Text>
        </View>
      ) : null}

      <Modal visible={serviceModalVisible} animationType="slide" onRequestClose={() => setServiceModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, padding: spacing.lg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>
              {selectedService?.title || "Service request"}
            </Text>
            <TouchableOpacity onPress={() => setServiceModalVisible(false)}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {selectedService ? (
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                Status: {selectedService.status.replace(/_/g, " ")} • Priority: {selectedService.priority}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                Company: {selectedService.company?.displayName || "-"}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                Updated: {formatDate(selectedService.updatedAt)}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>
                {selectedService.description || "No description provided."}
              </Text>

              <View style={{ gap: spacing.sm }}>
                {["in_review", "scheduled", "in_progress", "completed", "cancelled"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => openWorkflowModal(selectedService, status)}
                    style={[styles.workflowButton, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>
                      Set {status.replace(/_/g, " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedService.timeline?.length ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: spacing.xs }}>
                    Recent timeline
                  </Text>
                  {selectedService.timeline.slice(0, 5).map((entry, index) => (
                    <Text key={`${entry.type}-${index}`} style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
                      {entry.type.toUpperCase()} • {formatDate(entry.at)}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>

      <ReasonInputModal
        visible={!!workflowTarget}
        title={workflowTarget ? `Move to ${workflowTarget.targetStatus.replace(/_/g, " ")}` : "Update workflow"}
        subtitle="Reason is stored in immutable admin audit history."
        value={workflowReason}
        onChangeValue={(value) => {
          setWorkflowReason(value);
          if (workflowError) setWorkflowError(null);
        }}
        onClose={() => {
          if (workflowLoading) return;
          setWorkflowTarget(null);
          setWorkflowReason("");
          setWorkflowError(null);
        }}
        onSubmit={submitWorkflow}
        submitLabel="Apply"
        loading={workflowLoading}
        error={workflowError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  quickAction: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  callButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    borderBottomWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  workflowButton: {
    borderWidth: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});
