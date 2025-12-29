import { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { adminService, AdminCompany } from "../../services/admin.service";
import { RequestDocumentsModal } from "../../components/admin/RequestDocumentsModal";
import {
  AdminHeader,
  AdminSearchBar,
  AdminFilterTabs,
  AdminListCard,
  AdminActionSheet,
} from "../../components/admin";

type FilterStatus = "all" | "active" | "pending-verification" | "inactive";

export const CompaniesScreen = () => {
  const { colors, spacing } = useTheme();

  // State
  const [allCompanies, setAllCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestDocsModalVisible, setRequestDocsModalVisible] = useState(false);

  // Action sheet state
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(
    null
  );
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    let result = allCompanies;

    if (activeFilter !== "all") {
      result = result.filter((c) => c.status === activeFilter);
    }

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

  // Filter tabs config
  const filterTabs = useMemo(() => {
    const counts = {
      all: allCompanies.length,
      active: allCompanies.filter((c) => c.status === "active").length,
      "pending-verification": allCompanies.filter(
        (c) => c.status === "pending-verification"
      ).length,
      inactive: allCompanies.filter((c) => c.status === "inactive").length,
    };
    return [
      { key: "all" as FilterStatus, label: "All", count: counts.all },
      { key: "active" as FilterStatus, label: "Active", count: counts.active },
      {
        key: "pending-verification" as FilterStatus,
        label: "Pending",
        count: counts["pending-verification"],
      },
      {
        key: "inactive" as FilterStatus,
        label: "Inactive",
        count: counts.inactive,
      },
    ];
  }, [allCompanies]);

  // Fetch companies
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

  // Refetch companies whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompanies();
  }, [fetchCompanies]);

  // Status helpers
  const getStatusType = (status: string) => {
    switch (status) {
      case "active":
        return "success" as const;
      case "pending-verification":
        return "warning" as const;
      case "inactive":
        return "error" as const;
      default:
        return "neutral" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    return status === "pending-verification" ? "Pending" : status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Action handlers
  const handleCompanyPress = (company: AdminCompany) => {
    setSelectedCompany(company);
    setActionSheetVisible(true);
  };

  const handleRequestDocuments = () => {
    setActionSheetVisible(false);
    if (selectedCompany && !selectedCompany.documentsRequestedAt) {
      setRequestDocsModalVisible(true);
    }
  };

  const handleRequestDocsSuccess = () => {
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
      "Document request has been sent successfully.",
      [{ text: "OK" }]
    );
  };

  const handleDeleteCompany = () => {
    if (!selectedCompany) return;

    setActionSheetVisible(false);

    Alert.alert(
      "Delete Company",
      `Are you sure you want to delete "${selectedCompany.displayName}"?\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(selectedCompany.id);
              await adminService.deleteCompany(selectedCompany.id);
              setAllCompanies((prev) =>
                prev.filter((c) => c.id !== selectedCompany.id)
              );
              setTotalCount((prev) => prev - 1);
              Alert.alert(
                "Success",
                `"${selectedCompany.displayName}" has been deleted.`
              );
            } catch (err: any) {
              console.error("Failed to delete company:", err);
              Alert.alert("Error", err.message || "Failed to delete company");
            } finally {
              setDeletingId(null);
              setSelectedCompany(null);
            }
          },
        },
      ]
    );
  };

  // Build action sheet actions
  const getActions = () => {
    const actions = [
      {
        label: "View Details",
        icon: "information-circle-outline" as const,
        onPress: () => {
          if (!selectedCompany) return;
          setActionSheetVisible(false);
          Alert.alert(
            selectedCompany.displayName,
            `Status: ${getStatusLabel(selectedCompany.status)}\n` +
            `Type: ${selectedCompany.type}\n` +
            `Owner: ${selectedCompany.owner?.displayName || "N/A"}\n` +
            `Email: ${selectedCompany.owner?.email || "N/A"}\n` +
            `Created: ${formatDate(selectedCompany.createdAt)}`,
            [{ text: "OK" }]
          );
        },
      },
    ];

    if (
      selectedCompany?.status === "pending-verification" &&
      selectedCompany?.owner
    ) {
      actions.push({
        label: selectedCompany.documentsRequestedAt
          ? "Documents Requested"
          : "Request Documents",
        icon: "document-text-outline" as const,
        onPress: handleRequestDocuments,
        disabled: !!selectedCompany.documentsRequestedAt,
      } as any);
    }

    actions.push({
      label: "Delete Company",
      icon: "trash-outline" as const,
      onPress: handleDeleteCompany,
      destructive: true,
    } as any);

    return actions;
  };

  // Loading state
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

  // Error state
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
          title="Companies"
          subtitle="Manage all companies"
          count={totalCount}
        />

        {/* Search */}
        <AdminSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search companies or owners..."
        />

        {/* Filter Tabs */}
        <AdminFilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
        />

        {/* Empty State */}
        {filteredCompanies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery
                ? "No companies match your search"
                : "No companies found"}
            </Text>
          </View>
        ) : (
          /* Company List */
          <View style={styles.list}>
            {filteredCompanies.map((company) => (
              <AdminListCard
                key={company.id}
                title={company.displayName}
                subtitle={
                  company.owner
                    ? `Owner: ${company.owner.displayName}`
                    : company.type
                }
                avatarText={company.displayName.charAt(0).toUpperCase()}
                avatarColor={
                  company.status === "active"
                    ? colors.success
                    : company.status === "pending-verification"
                    ? colors.warning
                    : colors.textMuted
                }
                status={{
                  label: getStatusLabel(company.status),
                  type: getStatusType(company.status),
                }}
                meta={`Created ${formatDate(company.createdAt)}`}
                onPress={() => handleCompanyPress(company)}
                style={{
                  opacity: deletingId === company.id ? 0.5 : 1,
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Sheet */}
      <AdminActionSheet
        visible={actionSheetVisible}
        onClose={() => {
          setActionSheetVisible(false);
          setSelectedCompany(null);
        }}
        title={selectedCompany?.displayName}
        subtitle={selectedCompany?.owner?.email}
        actions={getActions()}
      />

      {/* Request Documents Modal */}
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
});
