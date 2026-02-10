import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import {
  CampaignContentType,
  CampaignStatus,
  PersonalizedOffer,
  preferenceService,
} from "../../services/preference.service";
import { RootStackParamList } from "../../navigation/types";
import { CampaignCard } from "./components";

const STATUS_FILTERS: Array<CampaignStatus | "all"> = ["all", "active", "draft", "expired", "archived"];
const CONTENT_FILTERS: Array<CampaignContentType | "all"> = ["all", "product", "service"];

const getUserId = (campaign: PersonalizedOffer): string | undefined => {
  if (!campaign.user) return undefined;
  if (typeof campaign.user === "string") return campaign.user;
  return campaign.user.id;
};

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
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });

  const fetchCampaigns = useCallback(
    async ({ reset = true } = {}) => {
      try {
        setError(null);
        if (reset) {
          setLoading((prev) => prev || !refreshing);
        } else {
          setLoadingMore(true);
        }

        const nextOffset = reset ? 0 : pagination.offset + pagination.limit;
        const response = await preferenceService.listCampaigns({
          includeExpired: true,
          userId: userIdFilter.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          contentType: contentFilter === "all" ? undefined : contentFilter,
          limit: pagination.limit,
          offset: nextOffset,
        });

        const nextCampaigns = response.campaigns || [];
        setCampaigns((prev) => (reset ? nextCampaigns : [...prev, ...nextCampaigns]));
        setPagination((prev) => ({
          total: response.pagination?.total ?? prev.total,
          limit: response.pagination?.limit ?? prev.limit,
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
    [contentFilter, pagination.limit, pagination.offset, statusFilter, userIdFilter, refreshing]
  );

  useFocusEffect(
    useCallback(() => {
      fetchCampaigns({ reset: true });
    }, [fetchCampaigns])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCampaigns({ reset: true });
  }, [fetchCampaigns]);

  const applyStatusUpdate = useCallback(
    async (campaign: PersonalizedOffer, status: CampaignStatus) => {
      const userId = getUserId(campaign);
      if (!userId) {
        Alert.alert("Update unavailable", "Campaign user is missing.");
        return;
      }
      try {
        setUpdatingCampaignId(campaign.id);
        await preferenceService.updateCampaign(userId, campaign.id, { status });
        await fetchCampaigns({ reset: true });
      } catch (err: any) {
        Alert.alert("Update failed", err.message || "Could not update campaign status.");
      } finally {
        setUpdatingCampaignId(null);
      }
    },
    [fetchCampaigns]
  );

  const duplicateCampaign = useCallback(
    async (campaign: PersonalizedOffer) => {
      const userId = getUserId(campaign);
      if (!userId) {
        Alert.alert("Duplicate unavailable", "Campaign user is missing.");
        return;
      }
      try {
        setUpdatingCampaignId(campaign.id);
        await preferenceService.createCampaign(userId, {
          contentType: campaign.contentType || "product",
          serviceType: campaign.serviceType,
          productId: campaign.product?.id,
          title: `${campaign.title} (copy)`,
          message: campaign.message,
          creative: campaign.creative,
          offerType: campaign.offerType,
          newPrice: campaign.newPrice,
          oldPrice: campaign.oldPrice,
          currency: campaign.currency,
          minOrderValue: campaign.minOrderValue,
          priority: campaign.priority,
          startsAt: campaign.startsAt,
          expiresAt: campaign.expiresAt,
          status: "draft",
          contact: campaign.contact,
          metadata: campaign.metadata,
        });
        await fetchCampaigns({ reset: true });
      } catch (err: any) {
        Alert.alert("Duplicate failed", err.message || "Could not duplicate campaign.");
      } finally {
        setUpdatingCampaignId(null);
      }
    },
    [fetchCampaigns]
  );

  const subtitle = useMemo(() => {
    const parts = [`${pagination.total} total`];
    if (statusFilter !== "all") parts.push(`status: ${statusFilter}`);
    if (contentFilter !== "all") parts.push(`type: ${contentFilter}`);
    return parts.join(" • ");
  }, [pagination.total, statusFilter, contentFilter]);

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
        <View style={styles.filterRow}>
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
        </View>
        <View style={styles.filterRow}>
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
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => fetchCampaigns({ reset: true })}
            style={[styles.reloadButton, { borderRadius: radius.md, backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700" }}>Reload</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (loadingMore || !pagination.hasMore) return;
            fetchCampaigns({ reset: false });
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
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
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reloadButton: {
    minHeight: 36,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
});
