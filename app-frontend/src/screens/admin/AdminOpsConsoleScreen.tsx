import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import {
  adminService,
  AdminBusinessSetupRequest,
  AdminCallLog,
  AdminConversationQueueItem,
  AdminOpsRequest,
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
type OpsKindFilter = "all" | "service" | "business_setup";
type OpsStatusBucket = "all" | "open" | "closed" | "rejected";

type RequestDetail =
  | (AdminServiceRequest & { kind: "service" })
  | (AdminBusinessSetupRequest & { kind: "business_setup" });

const PAGE_SIZE = 25;

const SERVICE_NEXT_STATUS: Partial<Record<string, string>> = {
  pending: "in_review",
  in_review: "scheduled",
  scheduled: "in_progress",
  in_progress: "completed",
};

const BUSINESS_NEXT_STATUS: Partial<Record<string, string>> = {
  new: "contacted",
  contacted: "planning",
  planning: "onboarding",
  onboarding: "launched",
  launched: "closed",
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

const toStatusLabel = (status?: string) => (status || "-").replace(/_/g, " ");

const toKindLabel = (kind: OpsKindFilter | "service" | "business_setup") =>
  kind === "business_setup" ? "Startup" : kind === "service" ? "Service" : "All";

const getRequestTone = (status?: string) => {
  if (!status) return "neutral" as const;
  if (["completed", "launched", "closed"].includes(status)) return "success" as const;
  if (["cancelled", "rejected"].includes(status)) return "error" as const;
  return "warning" as const;
};

const getNextStatus = (request: AdminOpsRequest) => {
  if (request.kind === "service") {
    return SERVICE_NEXT_STATUS[request.status];
  }
  return BUSINESS_NEXT_STATUS[request.status];
};

const mapServiceToOps = (request: AdminServiceRequest): AdminOpsRequest => ({
  id: request.id,
  kind: "service",
  title: request.title,
  status: request.status,
  priority: request.priority,
  company: request.company,
  createdBy: request.createdBy,
  assignedTo: request.assignedTo,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
  serviceType: request.serviceType,
  preview: {
    serviceType: request.serviceType,
    description: request.description,
  },
});

const mapBusinessToOps = (request: AdminBusinessSetupRequest): AdminOpsRequest => ({
  id: request.id,
  kind: "business_setup",
  title: request.title,
  status: request.status,
  priority: request.priority,
  company: request.company,
  createdBy: request.createdBy,
  assignedTo: request.assignedTo,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
  referenceCode: request.referenceCode,
  preview: {
    businessType: request.businessType,
    workModel: request.workModel,
    location: request.location,
    budgetRange: request.budgetRange,
    startTimeline: request.startTimeline,
    source: request.source,
  },
});

export const AdminOpsConsoleScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeView, setActiveView] = useState<OpsView>("services");
  const [opsKindFilter, setOpsKindFilter] = useState<OpsKindFilter>("all");
  const [opsStatusBucket, setOpsStatusBucket] = useState<OpsStatusBucket>("all");
  const [search, setSearch] = useState("");

  const [opsRequests, setOpsRequests] = useState<AdminOpsRequest[]>([]);
  const [opsPagination, setOpsPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsLoadingMore, setOpsLoadingMore] = useState(false);

  const [conversations, setConversations] = useState<AdminConversationQueueItem[]>([]);
  const [conversationPagination, setConversationPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationLoadingMore, setConversationLoadingMore] = useState(false);

  const [callLogs, setCallLogs] = useState<AdminCallLog[]>([]);
  const [callPagination, setCallPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [callLoading, setCallLoading] = useState(false);
  const [callLoadingMore, setCallLoadingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const [selectedRequestSummary, setSelectedRequestSummary] = useState<AdminOpsRequest | null>(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<RequestDetail | null>(null);
  const [requestDetailLoading, setRequestDetailLoading] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  const [workflowTarget, setWorkflowTarget] = useState<{ request: AdminOpsRequest; targetStatus: string } | null>(null);
  const [workflowReason, setWorkflowReason] = useState("");
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const fetchOpsRequests = useCallback(
    async ({ reset = true, offset }: { reset?: boolean; offset?: number } = {}) => {
      const nextOffset = reset ? 0 : offset ?? 0;
      try {
        setScreenError(null);
        if (reset) {
          setOpsLoading(true);
        } else {
          setOpsLoadingMore(true);
        }

        const response = await adminService.listOpsRequests({
          limit: opsPagination.limit,
          offset: nextOffset,
          search: search.trim() || undefined,
          kind: opsKindFilter,
          statusBucket: opsStatusBucket,
          sort: "updatedAt:desc",
        });

        setOpsRequests((previous) => (reset ? response.requests : [...previous, ...response.requests]));
        setOpsPagination(response.pagination);
      } catch (err: any) {
        setScreenError(err.message || "Failed to load ops queue");
      } finally {
        setOpsLoading(false);
        setOpsLoadingMore(false);
      }
    },
    [opsKindFilter, opsPagination.limit, opsStatusBucket, search]
  );

  const fetchConversations = useCallback(
    async ({ reset = true, offset }: { reset?: boolean; offset?: number } = {}) => {
      const nextOffset = reset ? 0 : offset ?? 0;
      try {
        setScreenError(null);
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
        setScreenError(err.message || "Failed to load conversations");
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
        setScreenError(null);
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
        setScreenError(err.message || "Failed to load call logs");
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
      fetchOpsRequests({ reset: true }).finally(() => setRefreshing(false));
      return;
    }
    if (activeView === "messages") {
      fetchConversations({ reset: true }).finally(() => setRefreshing(false));
      return;
    }
    fetchCallLogs({ reset: true }).finally(() => setRefreshing(false));
  }, [activeView, fetchCallLogs, fetchConversations, fetchOpsRequests]);

  useFocusEffect(
    useCallback(() => {
      if (activeView === "services") {
        fetchOpsRequests({ reset: true });
      } else if (activeView === "messages") {
        fetchConversations({ reset: true });
      } else {
        fetchCallLogs({ reset: true });
      }
    }, [activeView, fetchCallLogs, fetchConversations, fetchOpsRequests])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeView === "services") {
        fetchOpsRequests({ reset: true });
      } else if (activeView === "messages") {
        fetchConversations({ reset: true });
      } else {
        fetchCallLogs({ reset: true });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [activeView, fetchCallLogs, fetchConversations, fetchOpsRequests, search, opsKindFilter, opsStatusBucket]);

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

  const openRequestDetail = useCallback(async (request: AdminOpsRequest) => {
    setSelectedRequestSummary(request);
    setSelectedRequestDetail(null);
    setRequestModalVisible(true);
    setRequestDetailLoading(true);

    try {
      if (request.kind === "service") {
        const detail = await adminService.getServiceRequestById(request.id);
        setSelectedRequestDetail({ ...detail, kind: "service" });
      } else {
        const detail = await adminService.getBusinessSetupRequestById(request.id);
        setSelectedRequestDetail({ ...detail, kind: "business_setup" });
      }
    } catch {
      setSelectedRequestDetail(null);
    } finally {
      setRequestDetailLoading(false);
    }
  }, []);

  const updateOpsRequestLocally = useCallback((next: AdminOpsRequest) => {
    setOpsRequests((previous) =>
      previous.map((entry) => (entry.id === next.id && entry.kind === next.kind ? next : entry))
    );
    setSelectedRequestSummary((previous) =>
      previous && previous.id === next.id && previous.kind === next.kind ? next : previous
    );
  }, []);

  const openWorkflowModal = useCallback((request: AdminOpsRequest, targetStatus: string) => {
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

      const expectedUpdatedAt =
        selectedRequestDetail &&
        selectedRequestDetail.id === workflowTarget.request.id &&
        selectedRequestDetail.kind === workflowTarget.request.kind
          ? selectedRequestDetail.updatedAt
          : workflowTarget.request.updatedAt;

      if (workflowTarget.request.kind === "service") {
        const response = await adminService.updateServiceRequestWorkflow(workflowTarget.request.id, {
          status: workflowTarget.targetStatus,
          reason,
          contextCompanyId: workflowTarget.request.company?.id || undefined,
          expectedUpdatedAt,
        });
        updateOpsRequestLocally(mapServiceToOps(response.request));
        setSelectedRequestDetail({ ...response.request, kind: "service" });
      } else {
        const response = await adminService.updateBusinessSetupRequestWorkflow(workflowTarget.request.id, {
          status: workflowTarget.targetStatus,
          reason,
          contextCompanyId: workflowTarget.request.company?.id || undefined,
          expectedUpdatedAt,
        });
        updateOpsRequestLocally(mapBusinessToOps(response.request));
        setSelectedRequestDetail({ ...response.request, kind: "business_setup" });
      }

      setWorkflowTarget(null);
      setWorkflowReason("");
      setWorkflowError(null);
    } catch (err: any) {
      setWorkflowError(err.message || "Failed to update workflow");
    } finally {
      setWorkflowLoading(false);
    }
  }, [selectedRequestDetail, updateOpsRequestLocally, workflowReason, workflowTarget]);

  const viewTabs = useMemo(
    () => [
      { key: "services" as OpsView, label: "Services" },
      { key: "messages" as OpsView, label: "Messages" },
      { key: "calls" as OpsView, label: "Calls" },
    ],
    []
  );

  const kindTabs = useMemo(
    () => [
      { key: "all" as OpsKindFilter, label: "All" },
      { key: "service" as OpsKindFilter, label: "Services" },
      { key: "business_setup" as OpsKindFilter, label: "Startup" },
    ],
    []
  );

  const statusTabs = useMemo(
    () => [
      { key: "all" as OpsStatusBucket, label: "All" },
      { key: "open" as OpsStatusBucket, label: "Open" },
      { key: "closed" as OpsStatusBucket, label: "Closed" },
      { key: "rejected" as OpsStatusBucket, label: "Rejected" },
    ],
    []
  );

  const renderOpsItem = useCallback(
    ({ item }: { item: AdminOpsRequest }) => {
      const nextStatus = getNextStatus(item);
      const title = item.title;
      const subtitle =
        item.kind === "service"
          ? `${(item.serviceType || "service").replace(/_/g, " ")} • ${item.company?.displayName || "No company"}`
          : `${item.preview?.businessType || "Startup request"} • ${item.preview?.location || "No location"}`;

      const kindLabel = toKindLabel(item.kind);

      return (
        <AdminListCard
          title={title}
          subtitle={subtitle}
          avatarText={(title || "R")[0].toUpperCase()}
          status={{ label: toStatusLabel(item.status), type: getRequestTone(item.status) }}
          meta={`${kindLabel} • Priority: ${item.priority} • Updated ${formatDate(item.updatedAt)}`}
          onPress={() => openRequestDetail(item)}
          rightContent={
            nextStatus ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openWorkflowModal(item, nextStatus)}
                style={[
                  styles.quickAction,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700" }}>Advance</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      );
    },
    [colors.border, colors.primary, colors.surfaceElevated, openRequestDetail, openWorkflowModal, radius.md]
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

  const data = activeView === "services" ? opsRequests : activeView === "messages" ? conversations : callLogs;
  const loading = activeView === "services" ? opsLoading : activeView === "messages" ? conversationLoading : callLoading;
  const loadingMore = activeView === "services" ? opsLoadingMore : activeView === "messages" ? conversationLoadingMore : callLoadingMore;
  const pagination = activeView === "services" ? opsPagination : activeView === "messages" ? conversationPagination : callPagination;
  const renderItem = activeView === "services" ? renderOpsItem : activeView === "messages" ? renderConversationItem : renderCallItem;

  const modalRequest = selectedRequestDetail || selectedRequestSummary;
  const modalPreview = modalRequest && "preview" in modalRequest ? modalRequest.preview : undefined;

  const workflowOptions = useMemo(() => {
    if (!modalRequest) return [];
    if (modalRequest.kind === "service") {
      return ["in_review", "scheduled", "in_progress", "completed", "cancelled"];
    }
    return ["contacted", "planning", "onboarding", "launched", "closed", "rejected"];
  }, [modalRequest]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={data as any[]}
        key={activeView}
        keyExtractor={(item: any) => `${item.kind || "generic"}:${item.id}`}
        renderItem={renderItem as any}
        ListHeaderComponent={
          <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
            <AdminHeader
              title="Ops Console"
              subtitle="Control startup and service queues, messages, and calls from one place."
              count={pagination.total}
            />
            <AdminSearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={activeView === "services" ? "Search startup/service requests..." : "Search users, messages, or phone..."}
            />
            <AdminFilterTabs tabs={viewTabs} activeTab={activeView} onTabChange={setActiveView} />
            {activeView === "services" ? (
              <>
                <AdminFilterTabs tabs={kindTabs} activeTab={opsKindFilter} onTabChange={setOpsKindFilter} />
                <AdminFilterTabs tabs={statusTabs} activeTab={opsStatusBucket} onTabChange={setOpsStatusBucket} />
              </>
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
            fetchOpsRequests({ reset: false, offset: nextOffset });
          } else if (activeView === "messages") {
            fetchConversations({ reset: false, offset: nextOffset });
          } else {
            fetchCallLogs({ reset: false, offset: nextOffset });
          }
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshActive} tintColor={colors.primary} />}
      />

      {screenError ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.error + "15",
              borderColor: colors.error + "40",
              marginHorizontal: spacing.lg,
              borderRadius: radius.md,
            },
          ]}
        >
          <Text style={{ color: colors.error, fontSize: 12, fontWeight: "700" }}>{screenError}</Text>
        </View>
      ) : null}

      <Modal visible={requestModalVisible} animationType="slide" onRequestClose={() => setRequestModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}> 
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, padding: spacing.lg }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>
              {modalRequest?.title || "Request"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setRequestModalVisible(false);
                setSelectedRequestSummary(null);
                setSelectedRequestDetail(null);
              }}
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {requestDetailLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.textMuted }}>Loading request details...</Text>
            </View>
          ) : modalRequest ? (
            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                Kind: {toKindLabel(modalRequest.kind)} • Status: {toStatusLabel(modalRequest.status)} • Priority: {modalRequest.priority}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                Company: {modalRequest.company?.displayName || "-"}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                Updated: {formatDate(modalRequest.updatedAt)}
              </Text>

              {modalRequest.kind === "service" ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700" }}>SERVICE TYPE</Text>
                  <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>
                    {modalRequest.serviceType?.replace(/_/g, " ") || "-"}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700", marginTop: 6 }}>DESCRIPTION</Text>
                  <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>
                    {("description" in modalRequest ? modalRequest.description : undefined) || modalPreview?.description || "No description provided."}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <InfoRow label="Reference" value={("referenceCode" in modalRequest ? modalRequest.referenceCode : undefined) || "-"} color={colors.text} />
                  <InfoRow
                    label="Business type"
                    value={("businessType" in modalRequest ? modalRequest.businessType : undefined) || modalPreview?.businessType || "-"}
                    color={colors.text}
                  />
                  <InfoRow
                    label="Work model"
                    value={("workModel" in modalRequest ? modalRequest.workModel : undefined) || modalPreview?.workModel || "-"}
                    color={colors.text}
                  />
                  <InfoRow
                    label="Location"
                    value={("location" in modalRequest ? modalRequest.location : undefined) || modalPreview?.location || "-"}
                    color={colors.text}
                  />
                  <InfoRow
                    label="Budget"
                    value={("budgetRange" in modalRequest ? modalRequest.budgetRange : undefined) || modalPreview?.budgetRange || "-"}
                    color={colors.text}
                  />
                  <InfoRow
                    label="Start timeline"
                    value={("startTimeline" in modalRequest ? modalRequest.startTimeline : undefined) || modalPreview?.startTimeline || "-"}
                    color={colors.text}
                  />
                  <InfoRow
                    label="Source"
                    value={("source" in modalRequest ? modalRequest.source : undefined) || modalPreview?.source || "-"}
                    color={colors.text}
                  />
                  <InfoRow label="Contact name" value={("contactName" in modalRequest ? modalRequest.contactName : undefined) || "-"} color={colors.text} />
                  <InfoRow label="Contact email" value={("contactEmail" in modalRequest ? modalRequest.contactEmail : undefined) || "-"} color={colors.text} />
                  <InfoRow label="Contact phone" value={("contactPhone" in modalRequest ? modalRequest.contactPhone : undefined) || "-"} color={colors.text} />
                  <InfoRow
                    label="Support needed"
                    value={
                      ("supportAreas" in modalRequest && Array.isArray(modalRequest.supportAreas) && modalRequest.supportAreas.length)
                        ? modalRequest.supportAreas.join(", ")
                        : "-"
                    }
                    color={colors.text}
                  />
                  <InfoRow label="Notes" value={("notes" in modalRequest ? modalRequest.notes : undefined) || "-"} color={colors.text} />
                </View>
              )}

              <View style={{ gap: spacing.sm }}>
                {workflowOptions
                  .filter((status) => status !== modalRequest.status)
                  .map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => openWorkflowModal(toOpsRequest(modalRequest), status)}
                      style={[
                        styles.workflowButton,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>
                        Set {toStatusLabel(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              {Array.isArray((modalRequest as any).timeline) && (modalRequest as any).timeline.length ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: spacing.xs }}>
                    Recent timeline
                  </Text>
                  {(modalRequest as any).timeline.slice(0, 5).map((entry: any, index: number) => (
                    <Text key={`${entry.type}-${index}`} style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
                      {String(entry.type || "event").toUpperCase()} • {formatDate(entry.at)}
                    </Text>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <ReasonInputModal
        visible={!!workflowTarget}
        title={workflowTarget ? `Move to ${toStatusLabel(workflowTarget.targetStatus)}` : "Update workflow"}
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

const toOpsRequest = (request: any): AdminOpsRequest => {
  if (request.kind === "service") {
    return mapServiceToOps(request as AdminServiceRequest);
  }
  if (request.kind === "business_setup" && (request.businessType || request.workModel || request.referenceCode)) {
    return mapBusinessToOps(request as AdminBusinessSetupRequest);
  }
  return request as AdminOpsRequest;
};

const InfoRow = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <View style={{ gap: 2 }}>
    <Text style={{ color: "#6B7280", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{label}</Text>
    <Text style={{ color, fontSize: 13, lineHeight: 18 }}>{value}</Text>
  </View>
);

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
