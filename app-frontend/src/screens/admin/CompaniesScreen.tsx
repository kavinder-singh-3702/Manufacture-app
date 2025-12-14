import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { adminService, AdminCompany } from "../../services/admin.service";
import { RequestDocumentsModal } from "../../components/admin/RequestDocumentsModal";

// ============================================================
// FILTER STATUS TYPE
// ============================================================
type FilterStatus = "all" | "active" | "pending-verification" | "inactive";

// ============================================================
// COMPANIES SCREEN
// ============================================================
// Admin screen to view and manage all companies in the system

export const CompaniesScreen = () => {
  // ------------------------------------------------------------
  // HOOKS & THEME
  // ------------------------------------------------------------
  const { colors, spacing } = useTheme();

  // ------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------
  const [allCompanies, setAllCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestDocsModalVisible, setRequestDocsModalVisible] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);

  // ------------------------------------------------------------
  // FILTERED COMPANIES (LOCAL FILTERING)
  // ------------------------------------------------------------
  const filteredCompanies = useMemo(() => {
    let result = allCompanies;

    // Filter by status
    if (activeFilter !== "all") {
      result = result.filter((c) => c.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.displayName.toLowerCase().includes(query) ||
          c.owner?.displayName?.toLowerCase().includes(query) ||
          c.owner?.email?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allCompanies, activeFilter, searchQuery]);

  // ------------------------------------------------------------
  // FETCH COMPANIES FROM API
  // ------------------------------------------------------------
  const fetchCompanies = useCallback(async () => {
    try {
      setError(null);
      const data = await adminService.listCompanies();
      setAllCompanies(data.companies);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      console.error("Failed to fetch companies:", err);
      setError(err.message || "Failed to load companies");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ------------------------------------------------------------
  // INITIAL DATA LOAD
  // ------------------------------------------------------------
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // ------------------------------------------------------------
  // PULL TO REFRESH
  // ------------------------------------------------------------
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompanies();
  }, [fetchCompanies]);

  // ------------------------------------------------------------
  // REQUEST DOCUMENTS HANDLER
  // ------------------------------------------------------------
  const handleRequestDocuments = useCallback((company: AdminCompany) => {
    setSelectedCompany(company);
    setRequestDocsModalVisible(true);
  }, []);

  const handleRequestDocsSuccess = useCallback(() => {
    // Update local state to mark documents as requested
    if (selectedCompany) {
      setAllCompanies((prev) =>
        prev.map((c) =>
          c.id === selectedCompany.id
            ? { ...c, documentsRequestedAt: new Date().toISOString() }
            : c
        )
      );
    }
    Alert.alert(
      "Request Sent",
      "Document request has been sent successfully. The company owner will receive an email and notification.",
      [{ text: "OK" }]
    );
  }, [selectedCompany]);

  // ------------------------------------------------------------
  // DELETE COMPANY HANDLER
  // ------------------------------------------------------------
  const handleDeleteCompany = useCallback(
    (company: AdminCompany) => {
      Alert.alert(
        "Delete Company",
        `Are you sure you want to delete "${company.displayName}"?\n\nThis action cannot be undone and will also remove all associated verification requests.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setDeletingId(company.id);
                await adminService.deleteCompany(company.id);
                // Remove from local state
                setAllCompanies((prev) => prev.filter((c) => c.id !== company.id));
                setTotalCount((prev) => prev - 1);
                Alert.alert("Success", `"${company.displayName}" has been deleted.`);
              } catch (err: any) {
                console.error("Failed to delete company:", err);
                Alert.alert("Error", err.message || "Failed to delete company");
              } finally {
                setDeletingId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  // ------------------------------------------------------------
  // GET STATUS COLOR
  // ------------------------------------------------------------
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return colors.success;
      case "pending-verification":
        return colors.warning;
      case "inactive":
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  // ------------------------------------------------------------
  // FORMAT DATE
  // ------------------------------------------------------------
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ------------------------------------------------------------
  // GET COUNTS FOR TABS
  // ------------------------------------------------------------
  const getCounts = useMemo(() => {
    return {
      all: allCompanies.length,
      active: allCompanies.filter((c) => c.status === "active").length,
      "pending-verification": allCompanies.filter((c) => c.status === "pending-verification").length,
      inactive: allCompanies.filter((c) => c.status === "inactive").length,
    };
  }, [allCompanies]);

  // ------------------------------------------------------------
  // RENDER LOADING STATE
  // ------------------------------------------------------------
  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading companies...
        </Text>
      </View>
    );
  }

  // ------------------------------------------------------------
  // RENDER ERROR STATE
  // ------------------------------------------------------------
  if (error && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLoading(true);
            fetchCompanies();
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
        <Text style={[styles.title, { color: colors.text }]}>Companies</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          {totalCount} total companies in the system
        </Text>

        {/* ========== SEARCH BAR ========== */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginBottom: spacing.md,
              padding: spacing.sm,
              borderRadius: 8,
            },
          ]}
        >
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search companies or owners..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={[styles.clearButton, { color: colors.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ========== FILTER TABS ========== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
        >
          <View style={[styles.tabs, { gap: spacing.sm }]}>
            {(["all", "active", "pending-verification", "inactive"] as FilterStatus[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveFilter(tab)}
                style={[
                  styles.tab,
                  {
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
                  {tab === "pending-verification" ? "Pending" : tab.charAt(0).toUpperCase() + tab.slice(1)} (
                  {getCounts[tab]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ========== EMPTY STATE ========== */}
        {filteredCompanies.length === 0 ? (
          <View style={[styles.emptyState, { padding: spacing.xl }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? "No companies match your search" : "No companies found"}
            </Text>
          </View>
        ) : (
          /* ========== COMPANIES LIST ========== */
          <View style={[styles.list, { gap: spacing.sm }]}>
            {filteredCompanies.map((company) => (
              <TouchableOpacity
                key={company.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    padding: spacing.md,
                    borderRadius: 12,
                  },
                ]}
                activeOpacity={0.7}
              >
                {/* ---- Header: Company Name & Status ---- */}
                <View style={styles.cardHeader}>
                  <View style={styles.companyInfo}>
                    {/* Company Logo Placeholder */}
                    <View
                      style={[
                        styles.logoPlaceholder,
                        {
                          backgroundColor: colors.primary + "20",
                          marginRight: spacing.sm,
                        },
                      ]}
                    >
                      <Text style={[styles.logoText, { color: colors.primary }]}>
                        {company.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.nameContainer}>
                      <Text style={[styles.companyName, { color: colors.text }]}>
                        {company.displayName}
                      </Text>
                      {company.legalName && company.legalName !== company.displayName && (
                        <Text style={[styles.legalName, { color: colors.textMuted }]}>
                          {company.legalName}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(company.status) + "20",
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 4,
                        borderRadius: 4,
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(company.status) }]}>
                      {company.status === "pending-verification" ? "Pending" : company.status}
                    </Text>
                  </View>
                </View>

                {/* ---- Type & Categories ---- */}
                <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Type:</Text>
                  <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                    {company.type}
                  </Text>
                </View>

                {company.categories.length > 0 && (
                  <View style={[styles.categoriesRow, { marginTop: spacing.xs, gap: spacing.xs }]}>
                    {company.categories.slice(0, 3).map((cat, index) => (
                      <View
                        key={index}
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor: colors.background,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 2,
                            borderRadius: 4,
                          },
                        ]}
                      >
                        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                          {cat}
                        </Text>
                      </View>
                    ))}
                    {company.categories.length > 3 && (
                      <Text style={[styles.moreCategories, { color: colors.textMuted }]}>
                        +{company.categories.length - 3} more
                      </Text>
                    )}
                  </View>
                )}

                {/* ---- Owner Info ---- */}
                {company.owner && (
                  <View style={[styles.ownerRow, { marginTop: spacing.sm }]}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Owner:</Text>
                    <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                      {company.owner.displayName} ({company.owner.email})
                    </Text>
                  </View>
                )}

                {/* ---- Footer: Created Date & Action Buttons ---- */}
                <View style={[styles.cardFooter, { marginTop: spacing.sm }]}>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    Created {formatDate(company.createdAt)}
                  </Text>
                  <View style={[styles.actionButtons, { gap: spacing.xs }]}>
                    {/* Request Documents Button - Only for pending companies */}
                    {company.status === "pending-verification" && company.owner && (
                      <TouchableOpacity
                        onPress={() => !company.documentsRequestedAt && handleRequestDocuments(company)}
                        disabled={!!company.documentsRequestedAt}
                        style={[
                          styles.requestDocsButton,
                          {
                            backgroundColor: company.documentsRequestedAt
                              ? colors.success + "15"
                              : colors.primary + "15",
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            borderRadius: 6,
                            opacity: company.documentsRequestedAt ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.requestDocsButtonText,
                            { color: company.documentsRequestedAt ? colors.success : colors.primary },
                          ]}
                        >
                          {company.documentsRequestedAt ? "Requested" : "Request Docs"}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={() => handleDeleteCompany(company)}
                      disabled={deletingId === company.id}
                      style={[
                        styles.deleteButton,
                        {
                          backgroundColor: colors.error + "15",
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          borderRadius: 6,
                          opacity: deletingId === company.id ? 0.5 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                        {deletingId === company.id ? "Deleting..." : "Delete"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ========== REQUEST DOCUMENTS MODAL ========== */}
      <RequestDocumentsModal
        visible={requestDocsModalVisible}
        company={selectedCompany}
        onClose={() => {
          setRequestDocsModalVisible(false);
          setSelectedCompany(null);
        }}
        onSuccess={handleRequestDocsSuccess}
      />
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================
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
    marginTop: 12,
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
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  clearButton: {
    fontSize: 14,
    paddingHorizontal: 8,
  },
  tabs: {
    flexDirection: "row",
  },
  tab: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  list: {},
  card: {
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  companyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
  },
  nameContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "700",
  },
  legalName: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {},
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  categoryBadge: {},
  categoryText: {
    fontSize: 11,
  },
  moreCategories: {
    fontSize: 11,
    marginLeft: 4,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  dateText: {
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestDocsButton: {},
  requestDocsButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {},
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
