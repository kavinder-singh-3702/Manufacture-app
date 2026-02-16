import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  FlatList,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { verificationService } from "../../services/verificationService";
import { VerificationRequest } from "../../types/company";
import {
  AdminHeader,
  AdminFilterTabs,
  AdminListCard,
  AdminSearchBar,
  ReasonInputModal,
} from "../../components/admin";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const PAGE_SIZE = 20;

export const VerificationsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });

  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchVerifications = useCallback(
    async ({
      reset = true,
      explicitSearch,
      offset,
    }: {
      reset?: boolean;
      explicitSearch?: string;
      offset?: number;
    } = {}) => {
      const query = (explicitSearch ?? searchQuery).trim();
      const nextOffset = reset ? 0 : offset ?? 0;

      try {
        setError(null);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await verificationService.listVerificationRequests({
          status: activeFilter === "all" ? undefined : activeFilter,
          search: query || undefined,
          limit: pagination.limit,
          offset: nextOffset,
          sort: "createdAt:desc",
        });

        const nextPagination =
          response.pagination || {
            total: response.requests.length,
            limit: pagination.limit,
            offset: nextOffset,
            hasMore: false,
          };

        setVerifications((previous) =>
          reset ? response.requests : [...previous, ...response.requests]
        );
        setPagination(nextPagination);
      } catch (err: any) {
        console.error("Failed to fetch verifications:", err);
        setError(err.message || "Failed to load verification requests");
        if (reset) {
          setVerifications([]);
          setPagination((prev) => ({ ...prev, offset: 0, hasMore: false, total: 0 }));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, pagination.limit, searchQuery]
  );

  useFocusEffect(
    useCallback(() => {
      fetchVerifications({ reset: true });
    }, [fetchVerifications])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVerifications({ reset: true, explicitSearch: searchQuery });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, fetchVerifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerifications({ reset: true });
  }, [fetchVerifications]);

  const getStatusType = (status: string) => {
    switch (status) {
      case "approved":
        return "success" as const;
      case "rejected":
        return "error" as const;
      default:
        return "warning" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    return "Pending review";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openDocument = async (url: string, documentName: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Unable to open", `Cannot open ${documentName}`);
      }
    } catch (err) {
      console.error("Failed to open document:", err);
      Alert.alert("Unable to open", `Failed to open ${documentName}`);
    }
  };

  const viewRequestDetails = useCallback((request: VerificationRequest) => {
    setSelectedRequest(request);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedRequest(null);
  }, []);

  const applyVerificationUpdate = useCallback((updatedRequest: VerificationRequest) => {
    setVerifications((previous) =>
      previous.map((item) => (item.id === updatedRequest.id ? updatedRequest : item))
    );
    setSelectedRequest((previous) =>
      previous && previous.id === updatedRequest.id ? updatedRequest : previous
    );
  }, []);

  const handleApprove = useCallback(
    async (requestId: string) => {
      Alert.alert(
        "Approve verification",
        "Approve this verification request? The company will move to active status.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: async () => {
              setActionLoading(true);
              try {
                const updated = await verificationService.decideVerification(requestId, {
                  action: "approve",
                  notes: "Approved from admin mobile console",
                });
                applyVerificationUpdate(updated);
                Alert.alert("Approved", "Verification request approved successfully.");
              } catch (err: any) {
                console.error("Failed to approve:", err);
                Alert.alert("Error", err.message || "Failed to approve verification");
              } finally {
                setActionLoading(false);
              }
            },
          },
        ]
      );
    },
    [applyVerificationUpdate]
  );

  const openRejectModal = useCallback((requestId: string) => {
    setRejectRequestId(requestId);
    setRejectReason("");
    setRejectError(null);
    setRejectModalVisible(true);
  }, []);

  const closeRejectModal = useCallback(() => {
    setRejectModalVisible(false);
    setRejectRequestId(null);
    setRejectReason("");
    setRejectError(null);
  }, []);

  const submitReject = useCallback(async () => {
    const reason = rejectReason.trim();
    if (!rejectRequestId) {
      setRejectError("No request selected.");
      return;
    }
    if (!reason) {
      setRejectError("Rejection reason is required.");
      return;
    }

    setActionLoading(true);
    setRejectError(null);
    try {
      const updated = await verificationService.decideVerification(rejectRequestId, {
        action: "reject",
        rejectionReason: reason,
      });
      applyVerificationUpdate(updated);
      closeRejectModal();
      Alert.alert("Rejected", "Verification request rejected.");
    } catch (err: any) {
      console.error("Failed to reject:", err);
      setRejectError(err.message || "Failed to reject verification");
    } finally {
      setActionLoading(false);
    }
  }, [applyVerificationUpdate, closeRejectModal, rejectReason, rejectRequestId]);

  const filterTabs = useMemo(
    () => [
      { key: "all" as FilterStatus, label: "All" },
      { key: "pending" as FilterStatus, label: "Pending" },
      { key: "approved" as FilterStatus, label: "Approved" },
      { key: "rejected" as FilterStatus, label: "Rejected" },
    ],
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: VerificationRequest }) => (
      <View>
        <AdminListCard
          key={item.id}
          title={item.company?.displayName || "Unknown company"}
          subtitle={`Requested by ${item.requestedBy?.displayName || "Unknown user"}`}
          avatarText={(item.company?.displayName || "U")[0].toUpperCase()}
          avatarColor={
            item.status === "approved"
              ? colors.success
              : item.status === "rejected"
              ? colors.error
              : colors.warning
          }
          status={{
            label: getStatusLabel(item.status),
            type: getStatusType(item.status),
          }}
          meta={`Submitted ${formatDate(item.createdAt)}`}
          onPress={() => viewRequestDetails(item)}
        />

        {item.status === "pending" ? (
          <View style={[styles.inlineActions, { marginTop: spacing.sm, gap: spacing.sm }]}> 
            <TouchableOpacity
              onPress={() => handleApprove(item.id)}
              style={[
                styles.actionButton,
                isCompact ? styles.actionButtonStacked : styles.actionButtonInline,
                {
                  backgroundColor: colors.success,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Ionicons name="checkmark" size={18} color={colors.textOnPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.actionButtonText, { color: colors.textOnPrimary }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openRejectModal(item.id)}
              style={[
                styles.actionButton,
                isCompact ? styles.actionButtonStacked : styles.actionButtonInline,
                {
                  backgroundColor: colors.error,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textOnPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.actionButtonText, { color: colors.textOnPrimary }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    ),
    [
      colors.error,
      colors.success,
      colors.warning,
      getStatusLabel,
      handleApprove,
      isCompact,
      openRejectModal,
      radius.sm,
      spacing.sm,
      viewRequestDetails,
    ]
  );

  const listHeader = useMemo(
    () => (
      <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
        <AdminHeader
          title="Verifications"
          subtitle="Review submissions, request corrections, and keep compliance queue healthy."
          count={pagination.total}
        />

        <AdminSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by company or requester..."
        />

        <AdminFilterTabs tabs={filterTabs} activeTab={activeFilter} onTabChange={setActiveFilter} />
      </View>
    ),
    [activeFilter, filterTabs, pagination.total, searchQuery, spacing.lg, spacing.md]
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading verifications...</Text>
      </View>
    );
  }

  if (error && !verifications.length && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLoading(true);
            fetchVerifications({ reset: true });
          }}
        >
          <Text style={[styles.retryButtonText, { color: colors.textOnPrimary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={verifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={[styles.emptyState, { paddingHorizontal: spacing.lg }]}> 
            <Text style={[styles.emptyText, { color: colors.textMuted }]}> 
              {searchQuery.trim()
                ? "No verification requests match your current filters"
                : "No verification requests found"}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (loadingMore || !pagination.hasMore) return;
          fetchVerifications({ reset: false, offset: pagination.offset + pagination.limit });
        }}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}> 
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border, padding: spacing.lg },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Verification details</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {selectedRequest ? (
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ padding: spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.section, { marginBottom: spacing.xl }]}> 
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>COMPANY</Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}>
                  {selectedRequest.company?.displayName || "Unknown"}
                </Text>
              </View>

              <View style={[styles.section, { marginBottom: spacing.xl }]}> 
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>STATUS</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          selectedRequest.status === "approved"
                            ? colors.success
                            : selectedRequest.status === "rejected"
                            ? colors.error
                            : colors.warning,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          selectedRequest.status === "approved"
                            ? colors.success
                            : selectedRequest.status === "rejected"
                            ? colors.error
                            : colors.warning,
                      },
                    ]}
                  >
                    {getStatusLabel(selectedRequest.status)}
                  </Text>
                </View>
              </View>

              <View style={[styles.section, { marginBottom: spacing.xl }]}> 
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>REQUESTED BY</Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}> 
                  {selectedRequest.requestedBy?.displayName || "Unknown"}
                </Text>
                <Text style={[styles.sectionSubvalue, { color: colors.textMuted }]}> 
                  {selectedRequest.requestedBy?.email || ""}
                </Text>
              </View>

              <View style={[styles.section, { marginBottom: spacing.xl }]}> 
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SUBMITTED ON</Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}> 
                  {formatDate(selectedRequest.createdAt)}
                </Text>
              </View>

              <View style={[styles.section, { marginBottom: spacing.xl }]}> 
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textMuted, marginBottom: spacing.sm },
                  ]}
                >
                  DOCUMENTS
                </Text>

                {selectedRequest.documents?.gstCertificate?.url ? (
                  <TouchableOpacity
                    onPress={() =>
                      openDocument(
                        selectedRequest.documents.gstCertificate!.url,
                        "GST Certificate"
                      )
                    }
                    style={[
                      styles.documentCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        padding: spacing.md,
                        marginBottom: spacing.sm,
                      },
                    ]}
                  >
                    <View style={styles.documentRow}>
                      <Ionicons name="document-text" size={24} color={colors.primary} />
                      <View style={styles.documentInfo}>
                        <Text style={[styles.documentTitle, { color: colors.text }]}>GST Certificate</Text>
                        <Text style={[styles.documentMeta, { color: colors.textMuted }]}>Tap to view</Text>
                      </View>
                      <Ionicons name="open-outline" size={20} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.noDocument, { color: colors.textMuted }]}>No GST certificate uploaded</Text>
                )}

                {selectedRequest.documents?.aadhaarCard?.url ? (
                  <TouchableOpacity
                    onPress={() =>
                      openDocument(
                        selectedRequest.documents.aadhaarCard!.url,
                        "Aadhaar Card"
                      )
                    }
                    style={[
                      styles.documentCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    <View style={styles.documentRow}>
                      <Ionicons name="card" size={24} color={colors.primary} />
                      <View style={styles.documentInfo}>
                        <Text style={[styles.documentTitle, { color: colors.text }]}>Aadhaar Card</Text>
                        <Text style={[styles.documentMeta, { color: colors.textMuted }]}>Tap to view</Text>
                      </View>
                      <Ionicons name="open-outline" size={20} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.noDocument, { color: colors.textMuted, marginTop: spacing.sm }]}> 
                    No Aadhaar card uploaded
                  </Text>
                )}
              </View>

              {selectedRequest.status === "rejected" && selectedRequest.rejectionReason ? (
                <View style={[styles.section, { marginBottom: spacing.xl }]}> 
                  <Text style={[styles.sectionLabel, { color: colors.error }]}>REJECTION REASON</Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}> 
                    {selectedRequest.rejectionReason}
                  </Text>
                </View>
              ) : null}

              {selectedRequest.decidedBy ? (
                <View style={[styles.section, { marginBottom: spacing.xl }]}> 
                  <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DECIDED BY</Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}> 
                    {selectedRequest.decidedBy.displayName}
                  </Text>
                  {selectedRequest.decidedAt ? (
                    <Text style={[styles.sectionSubvalue, { color: colors.textMuted }]}> 
                      on {formatDate(selectedRequest.decidedAt)}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {selectedRequest.status === "pending" ? (
                <View style={[styles.modalActions, { gap: spacing.sm, marginTop: spacing.lg }]}> 
                  <TouchableOpacity
                    onPress={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading}
                    style={[
                      styles.modalActionButton,
                      {
                        backgroundColor: actionLoading ? colors.textMuted : colors.success,
                        borderRadius: radius.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={colors.textOnPrimary} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.textOnPrimary}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.modalActionButtonText, { color: colors.textOnPrimary }]}>Approve verification</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openRejectModal(selectedRequest.id)}
                    disabled={actionLoading}
                    style={[
                      styles.modalActionButton,
                      {
                        backgroundColor: actionLoading ? colors.textMuted : colors.error,
                        borderRadius: radius.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={colors.textOnPrimary} />
                    ) : (
                      <>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={colors.textOnPrimary}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.modalActionButtonText, { color: colors.textOnPrimary }]}>Reject verification</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <ReasonInputModal
        visible={rejectModalVisible}
        title="Reject verification"
        subtitle="Provide a clear reason. This will be visible in admin audit history."
        value={rejectReason}
        onChangeValue={(value) => {
          setRejectReason(value);
          if (rejectError) setRejectError(null);
        }}
        onClose={closeRejectModal}
        onSubmit={submitReject}
        submitLabel="Reject"
        loading={actionLoading}
        error={rejectError}
        maxLength={400}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    minHeight: 42,
  },
  actionButtonInline: {
    flex: 1,
  },
  actionButtonStacked: {
    width: "100%",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
  },
  section: {},
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionSubvalue: {
    fontSize: 13,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
  },
  documentCard: {
    borderWidth: 1,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  documentMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  noDocument: {
    fontSize: 13,
    fontStyle: "italic",
  },
  modalActions: {},
  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
