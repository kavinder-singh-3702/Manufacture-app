import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useTheme } from "../../hooks/useTheme";
import { verificationService } from "../../services/verificationService";
import { VerificationRequest } from "../../types/company";

// ============================================================
// VERIFICATION STATUS TYPE
// ============================================================
// This defines the possible filter values for the tabs
// "all" means show everything, others filter by status
type FilterStatus = "all" | "pending" | "approved" | "rejected";

// ============================================================
// MAIN COMPONENT: VerificationsScreen
// ============================================================
// This screen allows admins to:
// 1. View all company verification requests
// 2. Filter by status (pending/approved/rejected) - LOCAL filtering (no API call)
// 3. View uploaded documents (GST Certificate & Aadhaar)
// 4. Approve or reject pending requests
export const VerificationsScreen = () => {
  // ------------------------------------------------------------
  // HOOKS & THEME
  // ------------------------------------------------------------
  // useTheme() gives us access to colors and spacing from our theme
  const { colors, spacing } = useTheme();

  // ------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------
  // allVerifications: Complete list from API (never filtered)
  // We keep ALL data here and filter locally for instant tab switching
  const [allVerifications, setAllVerifications] = useState<VerificationRequest[]>([]);

  // loading: Shows spinner while fetching data (only on initial load)
  const [loading, setLoading] = useState(true);

  // refreshing: For pull-to-refresh functionality
  const [refreshing, setRefreshing] = useState(false);

  // error: Stores error message if API call fails
  const [error, setError] = useState<string | null>(null);

  // activeFilter: Currently selected tab filter
  // IMPORTANT: Changing this does NOT trigger API call - filtering is done locally
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  // selectedRequest: The request currently being viewed in detail modal
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  // modalVisible: Controls visibility of the detail modal
  const [modalVisible, setModalVisible] = useState(false);

  // actionLoading: Shows spinner on approve/reject buttons while processing
  const [actionLoading, setActionLoading] = useState(false);

  // ------------------------------------------------------------
  // FILTERED VERIFICATIONS (LOCAL FILTERING - NO API CALL)
  // ------------------------------------------------------------
  // useMemo recalculates only when allVerifications or activeFilter changes
  // This is instant because it filters in memory, no network request
  const filteredVerifications = useMemo(() => {
    if (activeFilter === "all") {
      return allVerifications;
    }
    // Filter locally based on status
    return allVerifications.filter((v) => v.status === activeFilter);
  }, [allVerifications, activeFilter]);

  // ------------------------------------------------------------
  // FETCH ALL VERIFICATION REQUESTS FROM API
  // ------------------------------------------------------------
  // This function fetches ALL verifications (no filter param)
  // We only call this on initial load and pull-to-refresh
  const fetchVerifications = useCallback(async () => {
    try {
      setError(null); // Clear any previous errors

      // Always fetch ALL verifications (no filter)
      // Filtering is done locally via useMemo above
      const data = await verificationService.listVerificationRequests();

      // Update state with fetched data
      setAllVerifications(data);
    } catch (err: any) {
      // If API call fails, show error message
      console.error("Failed to fetch verifications:", err);
      setError(err.message || "Failed to load verification requests");
    } finally {
      // Always hide loading spinner when done
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ------------------------------------------------------------
  // INITIAL DATA LOAD
  // ------------------------------------------------------------
  // useEffect runs when component mounts (first renders)
  // We fetch all verifications ONCE on initial load
  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // ------------------------------------------------------------
  // PULL TO REFRESH HANDLER
  // ------------------------------------------------------------
  // Called when user pulls down on the scroll view
  // This is the ONLY way to re-fetch data from API (besides initial load)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerifications();
  }, [fetchVerifications]);

  // ------------------------------------------------------------
  // FILTER TAB CHANGE HANDLER
  // ------------------------------------------------------------
  // Called when user taps on a filter tab (All, Pending, etc.)
  // IMPORTANT: This does NOT make an API call - filtering is instant and local
  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    // No API call needed! filteredVerifications updates automatically via useMemo
  };

  // ------------------------------------------------------------
  // OPEN DOCUMENT IN BROWSER/VIEWER
  // ------------------------------------------------------------
  // When admin taps on a document, open it in the device browser
  // The URL is an S3 public URL that directly serves the file
  const openDocument = async (url: string, documentName: string) => {
    try {
      // Check if the device can open this URL
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        // Open URL in default browser/viewer
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open ${documentName}`);
      }
    } catch (err) {
      console.error("Failed to open document:", err);
      Alert.alert("Error", `Failed to open ${documentName}`);
    }
  };

  // ------------------------------------------------------------
  // VIEW REQUEST DETAILS
  // ------------------------------------------------------------
  // Opens the modal with full details of a verification request
  const viewRequestDetails = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  // ------------------------------------------------------------
  // CLOSE DETAIL MODAL
  // ------------------------------------------------------------
  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  // ------------------------------------------------------------
  // UPDATE LOCAL STATE AFTER APPROVE/REJECT
  // ------------------------------------------------------------
  // Instead of re-fetching from API, we update the local state directly
  // This makes the UI update instantly without network delay
  const updateLocalVerification = (requestId: string, newStatus: "approved" | "rejected") => {
    setAllVerifications((prev) =>
      prev.map((v) =>
        v.id === requestId
          ? { ...v, status: newStatus }
          : v
      )
    );
  };

  // ------------------------------------------------------------
  // APPROVE VERIFICATION REQUEST
  // ------------------------------------------------------------
  // Called when admin taps "Approve" button
  const handleApprove = async (requestId: string) => {
    // Show confirmation dialog before approving
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
              // Call API to approve the request
              // PATCH /api/verification-requests/{requestId}
              // Body: { action: "approve" }
              await verificationService.decideVerification(requestId, {
                action: "approve",
                notes: "Approved by admin",
              });

              // Update local state immediately (no API refetch needed)
              updateLocalVerification(requestId, "approved");

              // Show success message
              Alert.alert("Success", "Verification approved successfully");

              // Close modal
              closeModal();
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
  };

  // ------------------------------------------------------------
  // REJECT VERIFICATION REQUEST
  // ------------------------------------------------------------
  // Called when admin taps "Reject" button
  const handleReject = async (requestId: string) => {
    // Show confirmation dialog with reason input
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
              // Call API to reject the request
              // PATCH /api/verification-requests/{requestId}
              // Body: { action: "reject", rejectionReason: "..." }
              await verificationService.decideVerification(requestId, {
                action: "reject",
                rejectionReason: reason.trim(),
              });

              // Update local state immediately (no API refetch needed)
              updateLocalVerification(requestId, "rejected");

              // Show success message
              Alert.alert("Success", "Verification rejected");

              // Close modal
              closeModal();
            } catch (err: any) {
              console.error("Failed to reject:", err);
              Alert.alert("Error", err.message || "Failed to reject verification");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      "plain-text", // Input type
      "", // Default value
      "default" // Keyboard type
    );
  };

  // ------------------------------------------------------------
  // GET STATUS COLOR
  // ------------------------------------------------------------
  // Returns the appropriate color based on verification status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return colors.success; // Green
      case "rejected":
        return colors.error; // Red
      default:
        return colors.warning; // Yellow/Orange for pending
    }
  };

  // ------------------------------------------------------------
  // FORMAT DATE FOR DISPLAY
  // ------------------------------------------------------------
  // Converts ISO date string to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ------------------------------------------------------------
  // GET COUNT FOR EACH TAB (for badge display)
  // ------------------------------------------------------------
  const getCounts = useMemo(() => {
    return {
      all: allVerifications.length,
      pending: allVerifications.filter((v) => v.status === "pending").length,
      approved: allVerifications.filter((v) => v.status === "approved").length,
      rejected: allVerifications.filter((v) => v.status === "rejected").length,
    };
  }, [allVerifications]);

  // ------------------------------------------------------------
  // RENDER LOADING STATE
  // ------------------------------------------------------------
  // Show spinner while loading data
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

  // ------------------------------------------------------------
  // RENDER ERROR STATE
  // ------------------------------------------------------------
  // Show error message with retry button if API call failed
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

  // ------------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ========== SCROLLABLE CONTENT ========== */}
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ========== HEADER ========== */}
        <Text style={[styles.title, { color: colors.text }]}>Verifications</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          Review company verification requests
        </Text>

        {/* ========== FILTER TABS ========== */}
        {/* These tabs filter LOCALLY - no API call, instant switching */}
        <View style={[styles.tabs, { gap: spacing.sm, marginBottom: spacing.md }]}>
          {(["all", "pending", "approved", "rejected"] as FilterStatus[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleFilterChange(tab)}
              style={[
                styles.tab,
                {
                  // Highlight active tab with primary color
                  backgroundColor: activeFilter === tab ? colors.primary : colors.surface,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 8,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeFilter === tab ? "#fff" : colors.textSecondary },
                ]}
              >
                {/* Capitalize first letter + count badge */}
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getCounts[tab]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ========== EMPTY STATE ========== */}
        {/* Show message if no verifications found for current filter */}
        {filteredVerifications.length === 0 ? (
          <View style={[styles.emptyState, { padding: spacing.xl }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeFilter === "all"
                ? "No verification requests found"
                : `No ${activeFilter} verification requests`}
            </Text>
          </View>
        ) : (
          /* ========== VERIFICATION LIST ========== */
          <View style={[styles.list, { gap: spacing.sm }]}>
            {filteredVerifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => viewRequestDetails(item)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    padding: spacing.md,
                    borderRadius: 12,
                  },
                ]}
              >
                {/* ---- Card Header: Company Name & Status ---- */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.companyName, { color: colors.text }]}>
                    {item.company?.displayName || "Unknown Company"}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        // Add transparency to status color for background
                        backgroundColor: getStatusColor(item.status) + "20",
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 4,
                        borderRadius: 4,
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* ---- Submitted By ---- */}
                <Text style={[styles.submittedBy, { color: colors.textSecondary, marginTop: 4 }]}>
                  Submitted by {item.requestedBy?.displayName || "Unknown"}
                </Text>

                {/* ---- Date ---- */}
                <Text style={[styles.date, { color: colors.textMuted, marginTop: 2 }]}>
                  {formatDate(item.createdAt)}
                </Text>

                {/* ---- Document Links ---- */}
                {/* Show clickable links to view uploaded documents */}
                <View style={[styles.documentLinks, { marginTop: spacing.sm, gap: spacing.xs }]}>
                  {item.documents?.gstCertificate?.url && (
                    <TouchableOpacity
                      onPress={() => openDocument(item.documents.gstCertificate!.url, "GST Certificate")}
                      style={[styles.documentLink, { backgroundColor: colors.background }]}
                    >
                      <Text style={[styles.documentLinkText, { color: colors.primary }]}>
                        View GST Certificate
                      </Text>
                    </TouchableOpacity>
                  )}
                  {item.documents?.aadhaarCard?.url && (
                    <TouchableOpacity
                      onPress={() => openDocument(item.documents.aadhaarCard!.url, "Aadhaar Card")}
                      style={[styles.documentLink, { backgroundColor: colors.background }]}
                    >
                      <Text style={[styles.documentLinkText, { color: colors.primary }]}>
                        View Aadhaar Card
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ---- Action Buttons (only for pending) ---- */}
                {item.status === "pending" && (
                  <View style={[styles.actions, { gap: spacing.sm, marginTop: spacing.md }]}>
                    <TouchableOpacity
                      onPress={() => handleApprove(item.id)}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: colors.success,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: 6,
                        },
                      ]}
                    >
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReject(item.id)}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: colors.error,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: 6,
                        },
                      ]}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ---- Tap to view more hint ---- */}
                <Text style={[styles.tapHint, { color: colors.textMuted, marginTop: spacing.sm }]}>
                  Tap to view details
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ========== DETAIL MODAL ========== */}
      {/* Full-screen modal to view verification request details */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* ---- Modal Header ---- */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, padding: spacing.md }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Verification Details</Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* ---- Modal Content ---- */}
          {selectedRequest && (
            <ScrollView style={styles.modalContent} contentContainerStyle={{ padding: spacing.md }}>
              {/* Company Info */}
              <View style={[styles.section, { marginBottom: spacing.lg }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Company</Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}>
                  {selectedRequest.company?.displayName || "Unknown"}
                </Text>
              </View>

              {/* Status */}
              <View style={[styles.section, { marginBottom: spacing.lg }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(selectedRequest.status) + "20",
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                      borderRadius: 4,
                      alignSelf: "flex-start",
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(selectedRequest.status) }]}>
                    {selectedRequest.status}
                  </Text>
                </View>
              </View>

              {/* Requested By */}
              <View style={[styles.section, { marginBottom: spacing.lg }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Requested By</Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}>
                  {selectedRequest.requestedBy?.displayName || "Unknown"}
                </Text>
                <Text style={[styles.sectionSubvalue, { color: colors.textMuted }]}>
                  {selectedRequest.requestedBy?.email || ""}
                </Text>
              </View>

              {/* Submitted Date */}
              <View style={[styles.section, { marginBottom: spacing.lg }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Submitted On</Text>
                <Text style={[styles.sectionValue, { color: colors.text }]}>
                  {formatDate(selectedRequest.createdAt)}
                </Text>
              </View>

              {/* Notes (if any) */}
              {selectedRequest.notes && (
                <View style={[styles.section, { marginBottom: spacing.lg }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notes</Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}>
                    {selectedRequest.notes}
                  </Text>
                </View>
              )}

              {/* Documents Section */}
              <View style={[styles.section, { marginBottom: spacing.lg }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                  Documents
                </Text>

                {/* GST Certificate */}
                {selectedRequest.documents?.gstCertificate?.url ? (
                  <TouchableOpacity
                    onPress={() => openDocument(selectedRequest.documents.gstCertificate!.url, "GST Certificate")}
                    style={[
                      styles.documentCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        padding: spacing.md,
                        borderRadius: 8,
                        marginBottom: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={[styles.documentTitle, { color: colors.text }]}>GST Certificate</Text>
                    <Text style={[styles.documentMeta, { color: colors.textMuted }]}>
                      {selectedRequest.documents.gstCertificate.fileName || "Document"}
                    </Text>
                    <Text style={[styles.documentAction, { color: colors.primary, marginTop: 4 }]}>
                      Tap to view
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.noDocument, { color: colors.textMuted }]}>
                    No GST Certificate uploaded
                  </Text>
                )}

                {/* Aadhaar Card */}
                {selectedRequest.documents?.aadhaarCard?.url ? (
                  <TouchableOpacity
                    onPress={() => openDocument(selectedRequest.documents.aadhaarCard!.url, "Aadhaar Card")}
                    style={[
                      styles.documentCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        padding: spacing.md,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    <Text style={[styles.documentTitle, { color: colors.text }]}>Aadhaar Card</Text>
                    <Text style={[styles.documentMeta, { color: colors.textMuted }]}>
                      {selectedRequest.documents.aadhaarCard.fileName || "Document"}
                    </Text>
                    <Text style={[styles.documentAction, { color: colors.primary, marginTop: 4 }]}>
                      Tap to view
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.noDocument, { color: colors.textMuted }]}>
                    No Aadhaar Card uploaded
                  </Text>
                )}
              </View>

              {/* Rejection Reason (if rejected) */}
              {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                <View style={[styles.section, { marginBottom: spacing.lg }]}>
                  <Text style={[styles.sectionTitle, { color: colors.error }]}>Rejection Reason</Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}>
                    {selectedRequest.rejectionReason}
                  </Text>
                </View>
              )}

              {/* Decision Info (if decided) */}
              {selectedRequest.decidedBy && (
                <View style={[styles.section, { marginBottom: spacing.lg }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Decided By</Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}>
                    {selectedRequest.decidedBy.displayName}
                  </Text>
                  {selectedRequest.decidedAt && (
                    <Text style={[styles.sectionSubvalue, { color: colors.textMuted }]}>
                      on {formatDate(selectedRequest.decidedAt)}
                    </Text>
                  )}
                </View>
              )}

              {/* Action Buttons (only for pending requests) */}
              {selectedRequest.status === "pending" && (
                <View style={[styles.modalActions, { gap: spacing.md, marginTop: spacing.lg }]}>
                  <TouchableOpacity
                    onPress={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading}
                    style={[
                      styles.modalActionButton,
                      {
                        backgroundColor: actionLoading ? colors.textMuted : colors.success,
                        padding: spacing.md,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalActionButtonText}>Approve Verification</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleReject(selectedRequest.id)}
                    disabled={actionLoading}
                    style={[
                      styles.modalActionButton,
                      {
                        backgroundColor: actionLoading ? colors.textMuted : colors.error,
                        padding: spacing.md,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalActionButtonText}>Reject Verification</Text>
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

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
  },

  // Scrollable content area
  content: {
    flexGrow: 1,
  },

  // Centered container for loading/error states
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Loading text
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },

  // Error text
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },

  // Retry button
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

  // Page title
  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  // Page subtitle
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },

  // Filter tabs container
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  // Individual tab
  tab: {},

  // Tab text
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty state container
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },

  // Verification list
  list: {},

  // Verification card
  card: {
    borderWidth: 1,
  },

  // Card header (company name + status)
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Company name
  companyName: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },

  // Status badge
  statusBadge: {},
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // Submitted by text
  submittedBy: {
    fontSize: 14,
  },

  // Date text
  date: {
    fontSize: 12,
  },

  // Document links container
  documentLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  // Individual document link
  documentLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  documentLinkText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Action buttons container
  actions: {
    flexDirection: "row",
  },

  // Individual action button
  actionButton: {
    flex: 1,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Tap hint text
  tapHint: {
    fontSize: 11,
    textAlign: "center",
  },

  // Modal styles
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
  closeButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
  },

  // Section styles (for modal content)
  section: {},
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  sectionSubvalue: {
    fontSize: 14,
    marginTop: 2,
  },

  // Document card in modal
  documentCard: {
    borderWidth: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  documentMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  documentAction: {
    fontSize: 14,
    fontWeight: "500",
  },
  noDocument: {
    fontSize: 14,
    fontStyle: "italic",
  },

  // Modal action buttons
  modalActions: {},
  modalActionButton: {
    alignItems: "center",
  },
  modalActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
