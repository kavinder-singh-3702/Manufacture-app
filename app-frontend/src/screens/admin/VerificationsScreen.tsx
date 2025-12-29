import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
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
} from "../../components/admin";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export const VerificationsScreen = () => {
  const { colors, spacing, radius } = useTheme();

  // State
  const [allVerifications, setAllVerifications] = useState<
    VerificationRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtered verifications
  const filteredVerifications = useMemo(() => {
    if (activeFilter === "all") {
      return allVerifications;
    }
    return allVerifications.filter((v) => v.status === activeFilter);
  }, [allVerifications, activeFilter]);

  // Filter tabs config
  const filterTabs = useMemo(() => {
    const counts = {
      all: allVerifications.length,
      pending: allVerifications.filter((v) => v.status === "pending").length,
      approved: allVerifications.filter((v) => v.status === "approved").length,
      rejected: allVerifications.filter((v) => v.status === "rejected").length,
    };
    return [
      { key: "all" as FilterStatus, label: "All", count: counts.all },
      {
        key: "pending" as FilterStatus,
        label: "Pending",
        count: counts.pending,
      },
      {
        key: "approved" as FilterStatus,
        label: "Approved",
        count: counts.approved,
      },
      {
        key: "rejected" as FilterStatus,
        label: "Rejected",
        count: counts.rejected,
      },
    ];
  }, [allVerifications]);

  // Fetch verifications
  const fetchVerifications = useCallback(async () => {
    try {
      setError(null);
      const data = await verificationService.listVerificationRequests();
      setAllVerifications(data);
    } catch (err: any) {
      console.error("Failed to fetch verifications:", err);
      setError(err.message || "Failed to load verification requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch verifications whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchVerifications();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerifications();
  }, [fetchVerifications]);

  // Helpers
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

  const formatDate = (dateString: string) => {
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
        Alert.alert("Error", `Cannot open ${documentName}`);
      }
    } catch (err) {
      console.error("Failed to open document:", err);
      Alert.alert("Error", `Failed to open ${documentName}`);
    }
  };

  const viewRequestDetails = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  const updateLocalVerification = (
    requestId: string,
    newStatus: "approved" | "rejected"
  ) => {
    setAllVerifications((prev) =>
      prev.map((v) => (v.id === requestId ? { ...v, status: newStatus } : v))
    );
  };

  // Approve handler
  const handleApprove = async (requestId: string) => {
    Alert.alert(
      "Approve Verification",
      "Are you sure you want to approve this company verification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setActionLoading(true);
            try {
              await verificationService.decideVerification(requestId, {
                action: "approve",
                notes: "Approved by admin",
              });
              updateLocalVerification(requestId, "approved");
              Alert.alert("Success", "Verification approved successfully");
              closeModal();
            } catch (err: any) {
              console.error("Failed to approve:", err);
              Alert.alert(
                "Error",
                err.message || "Failed to approve verification"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Reject handler
  const handleReject = async (requestId: string) => {
    Alert.prompt(
      "Reject Verification",
      "Please provide a reason for rejection:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason) => {
            if (!reason || reason.trim() === "") {
              Alert.alert("Error", "Rejection reason is required");
              return;
            }

            setActionLoading(true);
            try {
              await verificationService.decideVerification(requestId, {
                action: "reject",
                rejectionReason: reason.trim(),
              });
              updateLocalVerification(requestId, "rejected");
              Alert.alert("Success", "Verification rejected");
              closeModal();
            } catch (err: any) {
              console.error("Failed to reject:", err);
              Alert.alert(
                "Error",
                err.message || "Failed to reject verification"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      "plain-text",
      "",
      "default"
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading verifications...
        </Text>
      </View>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLoading(true);
            fetchVerifications();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AdminHeader
          title="Verifications"
          subtitle="Review company verification requests"
          count={allVerifications.length}
        />

        {/* Filter Tabs */}
        <AdminFilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
        />

        {/* Empty State */}
        {filteredVerifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {activeFilter === "all"
                ? "No verification requests found"
                : `No ${activeFilter} verification requests`}
            </Text>
          </View>
        ) : (
          /* Verification List */
          <View style={styles.list}>
            {filteredVerifications.map((item) => (
              <View key={item.id}>
                <AdminListCard
                  title={item.company?.displayName || "Unknown Company"}
                  subtitle={`By ${item.requestedBy?.displayName || "Unknown"}`}
                  avatarText={(
                    item.company?.displayName || "U"
                  )[0].toUpperCase()}
                  avatarColor={
                    item.status === "approved"
                      ? colors.success
                      : item.status === "rejected"
                      ? colors.error
                      : colors.warning
                  }
                  status={{
                    label: item.status,
                    type: getStatusType(item.status),
                  }}
                  meta={formatDate(item.createdAt)}
                  onPress={() => viewRequestDetails(item)}
                />

                {/* Inline Actions for Pending */}
                {item.status === "pending" && (
                  <View
                    style={[
                      styles.inlineActions,
                      { marginTop: spacing.sm, gap: spacing.sm },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleApprove(item.id)}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: colors.success,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReject(item.id)}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: colors.error,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Modal Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border, padding: spacing.lg },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Verification Details
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          {selectedRequest && (
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ padding: spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              {/* Company */}
              <View style={[styles.section, { marginBottom: spacing.xl }]}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  COMPANY
                </Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}>
                  {selectedRequest.company?.displayName || "Unknown"}
                </Text>
              </View>

              {/* Status */}
              <View style={[styles.section, { marginBottom: spacing.xl }]}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  STATUS
                </Text>
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
                    {selectedRequest.status}
                  </Text>
                </View>
              </View>

              {/* Requested By */}
              <View style={[styles.section, { marginBottom: spacing.xl }]}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  REQUESTED BY
                </Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}>
                  {selectedRequest.requestedBy?.displayName || "Unknown"}
                </Text>
                <Text
                  style={[styles.sectionSubvalue, { color: colors.textMuted }]}
                >
                  {selectedRequest.requestedBy?.email || ""}
                </Text>
              </View>

              {/* Submitted Date */}
              <View style={[styles.section, { marginBottom: spacing.xl }]}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  SUBMITTED ON
                </Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}>
                  {formatDate(selectedRequest.createdAt)}
                </Text>
              </View>

              {/* Documents */}
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
                      <Ionicons
                        name="document-text"
                        size={24}
                        color={colors.primary}
                      />
                      <View style={styles.documentInfo}>
                        <Text
                          style={[styles.documentTitle, { color: colors.text }]}
                        >
                          GST Certificate
                        </Text>
                        <Text
                          style={[
                            styles.documentMeta,
                            { color: colors.textMuted },
                          ]}
                        >
                          Tap to view
                        </Text>
                      </View>
                      <Ionicons
                        name="open-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={[styles.noDocument, { color: colors.textMuted }]}
                  >
                    No GST Certificate uploaded
                  </Text>
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
                        <Text
                          style={[styles.documentTitle, { color: colors.text }]}
                        >
                          Aadhaar Card
                        </Text>
                        <Text
                          style={[
                            styles.documentMeta,
                            { color: colors.textMuted },
                          ]}
                        >
                          Tap to view
                        </Text>
                      </View>
                      <Ionicons
                        name="open-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={[
                      styles.noDocument,
                      { color: colors.textMuted, marginTop: spacing.sm },
                    ]}
                  >
                    No Aadhaar Card uploaded
                  </Text>
                )}
              </View>

              {/* Rejection Reason */}
              {selectedRequest.status === "rejected" &&
                selectedRequest.rejectionReason && (
                  <View style={[styles.section, { marginBottom: spacing.xl }]}>
                    <Text
                      style={[styles.sectionLabel, { color: colors.error }]}
                    >
                      REJECTION REASON
                    </Text>
                    <Text style={[styles.sectionValue, { color: colors.text }]}>
                      {selectedRequest.rejectionReason}
                    </Text>
                  </View>
                )}

              {/* Decided By */}
              {selectedRequest.decidedBy && (
                <View style={[styles.section, { marginBottom: spacing.xl }]}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textMuted }]}
                  >
                    DECIDED BY
                  </Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}>
                    {selectedRequest.decidedBy.displayName}
                  </Text>
                  {selectedRequest.decidedAt && (
                    <Text
                      style={[
                        styles.sectionSubvalue,
                        { color: colors.textMuted },
                      ]}
                    >
                      on {formatDate(selectedRequest.decidedAt)}
                    </Text>
                  )}
                </View>
              )}

              {/* Modal Actions */}
              {selectedRequest.status === "pending" && (
                <View
                  style={[
                    styles.modalActions,
                    { gap: spacing.md, marginTop: spacing.lg },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading}
                    style={[
                      styles.modalActionButton,
                      {
                        backgroundColor: actionLoading
                          ? colors.textMuted
                          : colors.success,
                        borderRadius: radius.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#fff"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.modalActionButtonText}>
                          Approve Verification
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleReject(selectedRequest.id)}
                    disabled={actionLoading}
                    style={[
                      styles.modalActionButton,
                      {
                        backgroundColor: actionLoading
                          ? colors.textMuted
                          : colors.error,
                        borderRadius: radius.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#fff"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.modalActionButtonText}>
                          Reject Verification
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  list: {
    gap: 16,
  },
  inlineActions: {
    flexDirection: "row",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
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
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 17,
    fontWeight: "500",
  },
  sectionSubvalue: {
    fontSize: 14,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
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
    fontSize: 16,
    fontWeight: "600",
  },
  documentMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  noDocument: {
    fontSize: 14,
    fontStyle: "italic",
  },
  modalActions: {},
  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
