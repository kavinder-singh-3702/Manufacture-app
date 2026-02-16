import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import {
  CampaignThemeKey,
  CampaignContentType,
  CampaignStatus,
  PersonalizedOffer,
  preferenceService,
} from "../../services/preference.service";
import { RootStackParamList } from "../../navigation/types";
import { CampaignCard } from "./components";
import { CAMPAIGN_THEME_OPTIONS, normalizeCampaignThemeKey } from "../dashboard/components/campaignTheme";

const STATUS_FILTERS: Array<CampaignStatus | "all"> = ["all", "active", "draft", "expired", "archived"];
const CONTENT_FILTERS: Array<CampaignContentType | "all"> = ["all", "product", "service"];
const SORT_FILTERS = [
  { key: "updatedAt:desc", label: "Updated ↓" },
  { key: "updatedAt:asc", label: "Updated ↑" },
  { key: "createdAt:desc", label: "Created ↓" },
  { key: "createdAt:asc", label: "Created ↑" },
  { key: "priority:desc", label: "Priority" },
] as const;

const getUserId = (campaign: PersonalizedOffer): string | undefined => {
  if (!campaign.user) return undefined;
  if (typeof campaign.user === "string") return campaign.user;
  return campaign.user.id;
};

type SortValue = (typeof SORT_FILTERS)[number]["key"];

export const CampaignStudioScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, radius } = useTheme();

  const [campaigns, setCampaigns] = useState<PersonalizedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [contentFilter, setContentFilter] = useState<CampaignContentType | "all">("all");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("updatedAt:desc");

  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PersonalizedOffer | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editThemeKey, setEditThemeKey] = useState<CampaignThemeKey>("campaignFocus");
  const [editSaving, setEditSaving] = useState(false);

  const mergeCampaigns = useCallback((next: PersonalizedOffer[]) => {
    const map = new Map<string, PersonalizedOffer>();
    next.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, []);

  const fetchCampaigns = useCallback(
    async ({ reset = true, offset }: { reset?: boolean; offset?: number } = {}) => {
      const nextOffset = reset ? 0 : offset ?? pagination.offset + pagination.limit;

      try {
        setError(null);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await preferenceService.listCampaigns({
          includeExpired: true,
          userId: userIdFilter.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          contentType: contentFilter === "all" ? undefined : contentFilter,
          search: search.trim() || undefined,
          sort,
          limit: pagination.limit,
          offset: nextOffset,
        });

        const nextItems = response.campaigns || [];
        setCampaigns((previous) => (reset ? mergeCampaigns(nextItems) : mergeCampaigns([...previous, ...nextItems])));
        setPagination((previous) => ({
          total: response.pagination?.total ?? previous.total,
          limit: response.pagination?.limit ?? previous.limit,
          offset: response.pagination?.offset ?? nextOffset,
          hasMore: response.pagination?.hasMore ?? false,
        }));
      } catch (err: any) {
        setError(err.message || "Failed to load campaigns");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [contentFilter, mergeCampaigns, pagination.limit, pagination.offset, search, sort, statusFilter, userIdFilter]
  );

  useFocusEffect(
    useCallback(() => {
      fetchCampaigns({ reset: true });
    }, [fetchCampaigns])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCampaigns({ reset: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [contentFilter, fetchCampaigns, search, sort, statusFilter, userIdFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCampaigns({ reset: true });
  }, [fetchCampaigns]);

  const updateCampaignLocally = useCallback((next: PersonalizedOffer) => {
    setCampaigns((previous) => previous.map((item) => (item.id === next.id ? next : item)));
    setEditingCampaign((previous) => (previous?.id === next.id ? next : previous));
  }, []);

  const applyStatusUpdate = useCallback(
    async (campaign: PersonalizedOffer, status: CampaignStatus) => {
      const userId = getUserId(campaign);
      if (!userId) {
        Alert.alert("Update unavailable", "Campaign user is missing.");
        return;
      }
      try {
        setUpdatingCampaignId(campaign.id);
        const response = await preferenceService.updateCampaign(userId, campaign.id, {
          status,
          expectedUpdatedAt: campaign.updatedAt,
        });
        updateCampaignLocally(response.campaign);
      } catch (err: any) {
        Alert.alert("Update failed", err.message || "Could not update campaign status.");
      } finally {
        setUpdatingCampaignId(null);
      }
    },
    [updateCampaignLocally]
  );

  const duplicateCampaign = useCallback(async (campaign: PersonalizedOffer) => {
    try {
      setUpdatingCampaignId(campaign.id);
      const response = await preferenceService.duplicateCampaign(campaign.id);
      setCampaigns((previous) => [response.campaign, ...previous.filter((item) => item.id !== response.campaign.id)]);
      setPagination((previous) => ({ ...previous, total: previous.total + 1 }));
    } catch (err: any) {
      Alert.alert("Duplicate failed", err.message || "Could not duplicate campaign.");
    } finally {
      setUpdatingCampaignId(null);
    }
  }, []);

  const openEditModal = useCallback((campaign: PersonalizedOffer) => {
    setEditingCampaign(campaign);
    setEditTitle(campaign.title || "");
    setEditMessage(campaign.message || "");
    setEditThemeKey(normalizeCampaignThemeKey(campaign.creative?.themeKey));
    setEditModalVisible(true);
  }, []);

  const closeEditModal = useCallback(() => {
    if (editSaving) return;
    setEditModalVisible(false);
    setEditingCampaign(null);
    setEditTitle("");
    setEditMessage("");
    setEditThemeKey("campaignFocus");
  }, [editSaving]);

  const saveEdit = useCallback(async () => {
    if (!editingCampaign) return;
    const userId = getUserId(editingCampaign);
    if (!userId) {
      Alert.alert("Update unavailable", "Campaign user is missing.");
      return;
    }

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      Alert.alert("Validation", "Title is required.");
      return;
    }

    try {
      setEditSaving(true);
      const response = await preferenceService.updateCampaign(userId, editingCampaign.id, {
        title: trimmedTitle,
        message: editMessage.trim() || undefined,
        creative: { themeKey: editThemeKey },
        expectedUpdatedAt: editingCampaign.updatedAt,
      });
      updateCampaignLocally(response.campaign);
      closeEditModal();
    } catch (err: any) {
      Alert.alert("Update failed", err.message || "Could not update campaign.");
    } finally {
      setEditSaving(false);
    }
  }, [closeEditModal, editMessage, editThemeKey, editTitle, editingCampaign, updateCampaignLocally]);

  const subtitle = useMemo(() => {
    const parts = [`${pagination.total} total`];
    if (statusFilter !== "all") parts.push(`status: ${statusFilter}`);
    if (contentFilter !== "all") parts.push(`type: ${contentFilter}`);
    return parts.join(" • ");
  }, [contentFilter, pagination.total, statusFilter]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Campaign Studio</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.sm }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search title or message"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: radius.md,
            },
          ]}
          autoCapitalize="none"
        />
        <TextInput
          value={userIdFilter}
          onChangeText={setUserIdFilter}
          placeholder="Filter by user id (optional)"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: radius.md,
            },
          ]}
          autoCapitalize="none"
        />

        <FlatList
          data={STATUS_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `status-${item}`}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setStatusFilter(item)}
              style={[
                styles.chip,
                {
                  borderRadius: radius.pill,
                  borderColor: statusFilter === item ? colors.primary : colors.border,
                  backgroundColor: statusFilter === item ? colors.badgePrimary : colors.surface,
                },
              ]}
            >
              <Text style={{ color: statusFilter === item ? colors.primary : colors.textMuted, fontWeight: "700", fontSize: 12 }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          data={CONTENT_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `content-${item}`}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setContentFilter(item)}
              style={[
                styles.chip,
                {
                  borderRadius: radius.pill,
                  borderColor: contentFilter === item ? colors.primary : colors.border,
                  backgroundColor: contentFilter === item ? colors.badgePrimary : colors.surface,
                },
              ]}
            >
              <Text style={{ color: contentFilter === item ? colors.primary : colors.textMuted, fontWeight: "700", fontSize: 12 }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          data={SORT_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setSort(item.key)}
              style={[
                styles.chip,
                {
                  borderRadius: radius.pill,
                  borderColor: sort === item.key ? colors.primary : colors.border,
                  backgroundColor: sort === item.key ? colors.badgePrimary : colors.surface,
                },
              ]}
            >
              <Text style={{ color: sort === item.key ? colors.primary : colors.textMuted, fontWeight: "700", fontSize: 12 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.textMuted }}>Loading campaigns...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.error, marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchCampaigns({ reset: true })}
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}
          >
            <Text style={{ color: colors.textOnPrimary, fontWeight: "700" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (loadingMore || !pagination.hasMore) return;
            fetchCampaigns({ reset: false, offset: pagination.offset + pagination.limit });
          }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: colors.textMuted }}>No campaigns for the current filters.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <CampaignCard
              campaign={item}
              updating={updatingCampaignId === item.id}
              onPublish={() => applyStatusUpdate(item, "active")}
              onPause={() => applyStatusUpdate(item, "draft")}
              onArchive={() => applyStatusUpdate(item, "archived")}
              onDuplicate={() => duplicateCampaign(item)}
              onEdit={() => openEditModal(item)}
              onPreview={() =>
                Alert.alert(
                  item.creative?.headline || item.title,
                  item.creative?.subheadline || item.message || "No preview copy configured."
                )
              }
            />
          )}
        />
      )}

      <Modal visible={editModalVisible} animationType="slide" onRequestClose={closeEditModal}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, padding: spacing.lg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Campaign</Text>
            <TouchableOpacity onPress={closeEditModal}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Campaign title"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderRadius: radius.md,
                },
              ]}
            />
            <TextInput
              value={editMessage}
              onChangeText={setEditMessage}
              placeholder="Campaign message"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              style={[
                styles.textArea,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderRadius: radius.md,
                },
              ]}
            />

            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: 12 }}>Theme style</Text>
              <View style={styles.themeRow}>
                {CAMPAIGN_THEME_OPTIONS.map((option) => {
                  const selected = normalizeCampaignThemeKey(editThemeKey) === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      activeOpacity={0.86}
                      onPress={() => setEditThemeKey(option.key)}
                      style={[
                        styles.themeChip,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.badgePrimary : colors.surfaceElevated,
                          borderRadius: radius.pill,
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? colors.primary : colors.textSecondary, fontWeight: "700", fontSize: 12 }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
              <TouchableOpacity
                onPress={closeEditModal}
                disabled={editSaving}
                style={[styles.modalButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={editSaving}
                style={[styles.modalButton, { backgroundColor: colors.primary, borderRadius: radius.md, opacity: editSaving ? 0.75 : 1 }]}
              >
                {editSaving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={{ color: colors.textOnPrimary, fontWeight: "700" }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "500",
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  retryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: "center",
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
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButton: {
    minHeight: 40,
    minWidth: 120,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
});
