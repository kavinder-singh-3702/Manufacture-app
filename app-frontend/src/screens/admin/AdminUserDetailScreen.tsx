import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { adminService, AdminUserOverview } from "../../services/admin.service";
import { RootStackParamList } from "../../navigation/types";
import { AdminHeader } from "../../components/admin";
import { AdaptiveSingleLineText } from "../../components/text/AdaptiveSingleLineText";

type RouteProps = RouteProp<RootStackParamList, "AdminUserDetail">;

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

export const AdminUserDetailScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const { userId } = route.params;

  const [overview, setOverview] = useState<AdminUserOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setError(null);
      const response = await adminService.getUserOverview(userId, { limit: 8 });
      setOverview(response);
    } catch (err: any) {
      setError(err.message || "Failed to load user overview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const campaignSummary = useMemo(() => {
    const byStatus = overview?.campaigns?.byStatus || {};
    return Object.entries(byStatus)
      .map(([status, count]) => `${status}: ${count}`)
      .join(" • ");
  }, [overview?.campaigns?.byStatus]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading user overview...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadOverview();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <AdminHeader
        title="User 360"
        subtitle={overview?.user?.displayName || overview?.user?.email || "User control panel"}
      />

      {error ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.error + "15",
              borderColor: colors.error + "40",
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={{ color: colors.error, fontWeight: "700", fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}

      {overview ? (
        <>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Email: {overview.user.email}</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Role: {overview.user.role}</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Status: {overview.user.status}</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Joined: {formatDate(overview.user.createdAt)}</Text>
            <View style={[styles.inlineActions, { marginTop: spacing.sm }]}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
                onPress={() =>
                  navigation.navigate("UserPreferences", {
                    userId,
                    displayName: overview.user.displayName || overview.user.email,
                  })
                }
              >
                <Ionicons name="options-outline" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>Preferences</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
                onPress={() =>
                  navigation.navigate("UserActivity", {
                    userId,
                    displayName: overview.user.displayName || overview.user.email,
                  })
                }
              >
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>Audit Trail</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>Total requests: {overview.services.total}</Text>
            {overview.services.recent.length ? (
              overview.services.recent.slice(0, 5).map((service) => (
                <View key={service.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <AdaptiveSingleLineText style={[styles.itemTitle, { color: colors.text }]}>
                    {service.title}
                  </AdaptiveSingleLineText>
                  <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                    {service.status} • {service.priority}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>No service requests.</Text>
            )}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Campaigns</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>Total campaigns: {overview.campaigns.total}</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{campaignSummary || "No campaign activity"}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary, borderRadius: radius.md, marginTop: spacing.sm }]}
              onPress={() => navigation.navigate("CampaignStudio")}
            >
              <Text style={{ color: colors.textOnPrimary, fontWeight: "700", fontSize: 12 }}>Open Campaign Studio</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Communications</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Conversations: {overview.communications.conversations.total}
            </Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>Calls: {overview.communications.calls.total}</Text>

            {overview.communications.conversations.recent.slice(0, 3).map((conversation) => (
              <View key={conversation.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <AdaptiveSingleLineText style={[styles.itemTitle, { color: colors.text }]}>
                  {conversation.lastMessage || "No last message"}
                </AdaptiveSingleLineText>
                <Text style={[styles.itemMeta, { color: colors.textMuted }]}>{formatDate(conversation.updatedAt)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            {overview.activity.recent.length ? (
              overview.activity.recent.slice(0, 6).map((entry) => (
                <View key={entry.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <AdaptiveSingleLineText style={[styles.itemTitle, { color: colors.text }]}>
                    {entry.label || entry.action || "Activity"}
                  </AdaptiveSingleLineText>
                  <Text style={[styles.itemMeta, { color: colors.textMuted }]}>{formatDate(entry.createdAt)}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>No recent activity.</Text>
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
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
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    borderWidth: 1,
  },
  sectionCard: {
    borderWidth: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 3,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    minHeight: 36,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  primaryButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  itemRow: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemMeta: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "500",
  },
});
