import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { adminService, AdminCompany } from "../../services/admin.service";
import { RequestDocumentsModal } from "../../components/admin/RequestDocumentsModal";
import {
  AdminHeader,
  AdminSearchBar,
  AdminFilterTabs,
  AdminListCard,
  AdminActionSheet,
} from "../../components/admin";
import { RootStackParamList } from "../../navigation/types";
import { isAdminRole } from "../../constants/roles";

type FilterStatus = "all" | "active" | "pending-verification" | "inactive" | "archived";

const PAGE_SIZE = 30;

export const CompaniesScreen = () => {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isSuperAdmin = user?.role === "super-admin";

  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [mutatingCompanyId, setMutatingCompanyId] = useState<string | null>(null);

  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [requestDocsCompany, setRequestDocsCompany] = useState<AdminCompany | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [requestDocsModalVisible, setRequestDocsModalVisible] = useState(false);

  const fetchCompanies = useCallback(
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

        const response = await adminService.listCompanies({
          status: activeFilter === "all" ? undefined : activeFilter,
          search: query || undefined,
          limit: pagination.limit,
          offset: nextOffset,
          sort: "updatedAt:desc",
        });

        setCompanies((previous) => (reset ? response.companies : [...previous, ...response.companies]));
        setPagination(response.pagination);
      } catch (err: any) {
        console.error("Failed to fetch companies:", err);
        setError(err.message || "Failed to load companies");
        if (reset) {
          setCompanies([]);
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
      fetchCompanies({ reset: true });
    }, [fetchCompanies])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies({ reset: true, explicitSearch: searchQuery });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, fetchCompanies]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompanies({ reset: true });
  }, [fetchCompanies]);

  const getStatusType = (status: string) => {
    switch (status) {
      case "active":
        return "success" as const;
      case "pending-verification":
        return "warning" as const;
      case "archived":
      case "inactive":
      case "suspended":
        return "error" as const;
      default:
        return "neutral" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "pending-verification") return "Pending review";
    if (status === "archived") return "Archived";
    return status;
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

  const openActionSheet = (company: AdminCompany) => {
    setSelectedCompany(company);
    setActionSheetVisible(true);
  };

  const closeActionSheet = useCallback(() => {
    setActionSheetVisible(false);
    setSelectedCompany(null);
  }, []);

  const closeRequestDocsModal = useCallback(() => {
    setRequestDocsModalVisible(false);
    setRequestDocsCompany(null);
  }, []);

  const updateCompanyInList = useCallback((companyId: string, patch: Partial<AdminCompany>) => {
    setCompanies((previous) => previous.map((item) => (item.id === companyId ? { ...item, ...patch } : item)));
  }, []);

  const handleRequestDocuments = useCallback(() => {
    if (!selectedCompany || selectedCompany.documentsRequestedAt) return;
    setRequestDocsCompany(selectedCompany);
    setActionSheetVisible(false);
    setSelectedCompany(null);
    setTimeout(() => setRequestDocsModalVisible(true), 80);
  }, [selectedCompany]);

  const handleRequestDocsSuccess = useCallback(() => {
    if (requestDocsCompany) {
      updateCompanyInList(requestDocsCompany.id, { documentsRequestedAt: new Date().toISOString() });
    }
    Alert.alert("Request sent", "Document request was sent to the company owner.");
    closeRequestDocsModal();
  }, [closeRequestDocsModal, requestDocsCompany, updateCompanyInList]);

  const handleArchiveCompany = useCallback(() => {
    if (!selectedCompany) return;

    Alert.alert(
      "Archive company",
      `Archive "${selectedCompany.displayName}"? This keeps data for audit and can be reversed later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              setMutatingCompanyId(selectedCompany.id);
              await adminService.archiveCompany(selectedCompany.id, {
                contextCompanyId: selectedCompany.id,
                reason: "Archived from mobile admin console",
              });
              updateCompanyInList(selectedCompany.id, {
                status: "archived",
                archivedAt: new Date().toISOString(),
              });
              Alert.alert("Archived", `"${selectedCompany.displayName}" is now archived.`);
            } catch (err: any) {
              console.error("Failed to archive company:", err);
              Alert.alert("Error", err.message || "Failed to archive company");
            } finally {
              setMutatingCompanyId(null);
              setSelectedCompany(null);
            }
          },
        },
      ]
    );
  }, [selectedCompany, updateCompanyInList]);

  const handleHardDeleteCompany = useCallback(() => {
    if (!selectedCompany) return;

    Alert.alert(
      "Hard delete company",
      `Permanently remove "${selectedCompany.displayName}" and queue cleanup? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Hard delete",
          style: "destructive",
          onPress: async () => {
            try {
              setMutatingCompanyId(selectedCompany.id);
              const response = await adminService.hardDeleteCompany(selectedCompany.id, {
                reason: "Hard delete requested from mobile super-admin console",
                contextCompanyId: selectedCompany.id,
              });
              setCompanies((previous) => previous.filter((item) => item.id !== selectedCompany.id));
              setPagination((previous) => ({ ...previous, total: Math.max(0, previous.total - 1) }));
              Alert.alert("Job queued", response.message || "Hard-delete cleanup was queued.");
            } catch (err: any) {
              console.error("Failed to hard delete company:", err);
              Alert.alert("Error", err.message || "Failed to hard delete company");
            } finally {
              setMutatingCompanyId(null);
              setSelectedCompany(null);
            }
          },
        },
      ]
    );
  }, [selectedCompany]);

  const actions = useMemo(() => {
    const list: Array<{
      label: string;
      icon: any;
      onPress: () => void;
      destructive?: boolean;
      disabled?: boolean;
      closeOnPress?: boolean;
    }> = [
      {
        label: "Open company profile",
        icon: "business-outline",
        onPress: () => {
          if (!selectedCompany) return;
          setActionSheetVisible(false);
          navigation.navigate("CompanyProfile", { companyId: selectedCompany.id });
        },
      },
      {
        label: "Quick summary",
        icon: "information-circle-outline",
        onPress: () => {
          if (!selectedCompany) return;
          setActionSheetVisible(false);
          Alert.alert(
            selectedCompany.displayName,
            `Status: ${getStatusLabel(selectedCompany.status)}\nType: ${selectedCompany.type}\nOwner: ${
              selectedCompany.owner?.displayName || "N/A"
            }\nEmail: ${selectedCompany.owner?.email || "N/A"}\nCreated: ${formatDate(selectedCompany.createdAt)}`,
            [{ text: "Close" }]
          );
        },
      },
    ];

    if (selectedCompany?.status === "pending-verification" && selectedCompany?.owner) {
      list.push({
        label: selectedCompany.documentsRequestedAt ? "Documents already requested" : "Request documents",
        icon: "document-text-outline",
        onPress: handleRequestDocuments,
        disabled: !!selectedCompany.documentsRequestedAt,
        closeOnPress: false,
      });
    }

    list.push({
      label: "Archive company",
      icon: "archive-outline",
      onPress: handleArchiveCompany,
      destructive: true,
    });

    if (isSuperAdmin) {
      list.push({
        label: "Hard delete (super-admin)",
        icon: "trash-outline",
        onPress: handleHardDeleteCompany,
        destructive: true,
      });
    }

    return list;
  }, [
    formatDate,
    getStatusLabel,
    handleArchiveCompany,
    handleHardDeleteCompany,
    handleRequestDocuments,
    isSuperAdmin,
    navigation,
    selectedCompany,
  ]);

  const filterTabs = useMemo(
    () => [
      { key: "all" as FilterStatus, label: "All" },
      { key: "active" as FilterStatus, label: "Active" },
      { key: "pending-verification" as FilterStatus, label: "Pending" },
      { key: "inactive" as FilterStatus, label: "Inactive" },
      { key: "archived" as FilterStatus, label: "Archived" },
    ],
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: AdminCompany }) => (
      <AdminListCard
        key={item.id}
        title={item.displayName}
        subtitle={item.owner ? `Owner: ${item.owner.displayName}` : item.type}
        avatarText={item.displayName.charAt(0).toUpperCase()}
        avatarColor={
          item.status === "active"
            ? colors.success
            : item.status === "pending-verification"
            ? colors.warning
            : colors.textMuted
        }
        status={{
          label: getStatusLabel(item.status),
          type: getStatusType(item.status),
        }}
        meta={`Created ${formatDate(item.createdAt)}`}
        onPress={() => openActionSheet(item)}
        style={{ opacity: mutatingCompanyId === item.id ? 0.5 : 1 }}
      />
    ),
    [colors.success, colors.textMuted, colors.warning, formatDate, mutatingCompanyId]
  );

  const listHeader = useMemo(
    () => (
      <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
        <AdminHeader
          title="Companies"
          subtitle={
            isAdminRole(user?.role)
              ? "Moderate company lifecycle, verification, and compliance."
              : "Manage all companies"
          }
          count={pagination.total}
        />

        <AdminSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search company name or owner..."
        />

        <AdminFilterTabs tabs={filterTabs} activeTab={activeFilter} onTabChange={setActiveFilter} />
      </View>
    ),
    [activeFilter, filterTabs, pagination.total, searchQuery, spacing.lg, spacing.md, user?.role]
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading companies...</Text>
      </View>
    );
  }

  if (error && !companies.length && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLoading(true);
            fetchCompanies({ reset: true });
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
        data={companies}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={[styles.emptyState, { paddingHorizontal: spacing.lg }]}> 
            <Text style={[styles.emptyText, { color: colors.textMuted }]}> 
              {searchQuery.trim()
                ? "No companies match your current filters"
                : "No companies available for this filter"}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (loadingMore || !pagination.hasMore) return;
          fetchCompanies({ reset: false, offset: pagination.offset + pagination.limit });
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

      <AdminActionSheet
        visible={actionSheetVisible}
        onClose={closeActionSheet}
        title={selectedCompany?.displayName}
        subtitle={selectedCompany?.owner?.email}
        actions={actions}
      />

      <RequestDocumentsModal
        visible={requestDocsModalVisible}
        company={requestDocsCompany}
        onClose={closeRequestDocsModal}
        onSuccess={handleRequestDocsSuccess}
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
});
