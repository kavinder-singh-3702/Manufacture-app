import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { accountingService, PartyOutstandingData } from "../../services/accounting.service";

type PartyType = "customer" | "supplier";

export const PartyOutstandingScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PartyOutstandingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partyType, setPartyType] = useState<PartyType>("customer");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await accountingService.getPartyOutstanding({
        type: partyType,
        asOf: new Date().toISOString().split("T")[0],
      });
      setData(result);
    } catch (err: any) {
      console.error("Failed to fetch party outstanding:", err);
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [partyType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTypeChange = (type: PartyType) => {
    setPartyType(type);
    setLoading(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
            Loading Outstanding Report...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>❌ {error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}
            onPress={onRefresh}
          >
            <Text style={[styles.retryButtonText, { color: "#fff" }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate aging totals
  const agingTotals = {
    bucket_0_30: data?.rows.reduce((sum, row) => sum + row.aging.bucket_0_30, 0) || 0,
    bucket_31_60: data?.rows.reduce((sum, row) => sum + row.aging.bucket_31_60, 0) || 0,
    bucket_61_90: data?.rows.reduce((sum, row) => sum + row.aging.bucket_61_90, 0) || 0,
    bucket_90_plus: data?.rows.reduce((sum, row) => sum + row.aging.bucket_90_plus, 0) || 0,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <Text style={[styles.title, { color: colors.text }]}>👥 Party Outstanding</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Aging analysis of {partyType === "customer" ? "receivables" : "payables"}
          </Text>
        </View>

        {/* Type Selector */}
        <View style={[styles.typeSelector, { marginBottom: spacing.lg }]}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              {
                backgroundColor:
                  partyType === "customer" ? colors.primary : colors.backgroundSecondary,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => handleTypeChange("customer")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.typeButtonText,
                { color: partyType === "customer" ? "#fff" : colors.textSecondary },
              ]}
            >
              📥 Customers (Receivables)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              {
                backgroundColor:
                  partyType === "supplier" ? colors.primary : colors.backgroundSecondary,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => handleTypeChange("supplier")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.typeButtonText,
                { color: partyType === "supplier" ? "#fff" : colors.textSecondary },
              ]}
            >
              📤 Suppliers (Payables)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Outstanding Card */}
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor:
                partyType === "customer" ? colors.success + "15" : colors.error + "15",
              borderColor:
                partyType === "customer" ? colors.success + "40" : colors.error + "40",
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Total {partyType === "customer" ? "Receivables" : "Payables"}
          </Text>
          <Text
            style={[
              styles.totalValue,
              { color: partyType === "customer" ? colors.success : colors.error },
            ]}
          >
            ₹{(data?.totalOutstanding || 0).toLocaleString()}
          </Text>
          <Text style={[styles.totalHint, { color: colors.textMuted }]}>
            From {data?.rows.length || 0} {partyType === "customer" ? "customers" : "suppliers"}
          </Text>
        </View>

        {/* Aging Summary */}
        <View
          style={[
            styles.agingCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.agingTitle, { color: colors.text }]}>⏰ Aging Summary</Text>

          <View style={styles.agingBuckets}>
            <View style={styles.agingBucket}>
              <Text style={[styles.bucketLabel, { color: colors.textSecondary }]}>0-30 days</Text>
              <Text style={[styles.bucketValue, { color: colors.success }]}>
                ₹{(agingTotals.bucket_0_30 / 1000).toFixed(1)}K
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        data?.totalOutstanding
                          ? (agingTotals.bucket_0_30 / data.totalOutstanding) * 100
                          : 0
                      }%`,
                      backgroundColor: colors.success,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.agingBucket}>
              <Text style={[styles.bucketLabel, { color: colors.textSecondary }]}>31-60 days</Text>
              <Text style={[styles.bucketValue, { color: colors.warning }]}>
                ₹{(agingTotals.bucket_31_60 / 1000).toFixed(1)}K
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        data?.totalOutstanding
                          ? (agingTotals.bucket_31_60 / data.totalOutstanding) * 100
                          : 0
                      }%`,
                      backgroundColor: colors.warning,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.agingBucket}>
              <Text style={[styles.bucketLabel, { color: colors.textSecondary }]}>61-90 days</Text>
              <Text style={[styles.bucketValue, { color: colors.accentWarm }]}>
                ₹{(agingTotals.bucket_61_90 / 1000).toFixed(1)}K
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        data?.totalOutstanding
                          ? (agingTotals.bucket_61_90 / data.totalOutstanding) * 100
                          : 0
                      }%`,
                      backgroundColor: colors.accentWarm,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.agingBucket}>
              <Text style={[styles.bucketLabel, { color: colors.textSecondary }]}>90+ days</Text>
              <Text style={[styles.bucketValue, { color: colors.error }]}>
                ₹{(agingTotals.bucket_90_plus / 1000).toFixed(1)}K
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        data?.totalOutstanding
                          ? (agingTotals.bucket_90_plus / data.totalOutstanding) * 100
                          : 0
                      }%`,
                      backgroundColor: colors.error,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Party List */}
        {data && data.rows.length > 0 ? (
          <View
            style={[
              styles.partyListCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
              },
            ]}
          >
            <Text style={[styles.partyListTitle, { color: colors.text }]}>
              📋 {partyType === "customer" ? "Customer" : "Supplier"} Details
            </Text>

            {data.rows.map((party, index) => (
              <View
                key={party.partyId}
                style={[
                  styles.partyItem,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < data.rows.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.partyHeader}>
                  <Text style={[styles.partyName, { color: colors.text }]} numberOfLines={1}>
                    {party.partyName}
                  </Text>
                  <Text style={[styles.partyTotal, { color: colors.primary }]}>
                    ₹{party.totalOutstanding.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.partyAging}>
                  {party.aging.bucket_0_30 > 0 && (
                    <View style={styles.agingChip}>
                      <Text style={[styles.agingChipText, { color: colors.success }]}>
                        0-30: ₹{(party.aging.bucket_0_30 / 1000).toFixed(1)}K
                      </Text>
                    </View>
                  )}
                  {party.aging.bucket_31_60 > 0 && (
                    <View style={styles.agingChip}>
                      <Text style={[styles.agingChipText, { color: colors.warning }]}>
                        31-60: ₹{(party.aging.bucket_31_60 / 1000).toFixed(1)}K
                      </Text>
                    </View>
                  )}
                  {party.aging.bucket_61_90 > 0 && (
                    <View style={styles.agingChip}>
                      <Text style={[styles.agingChipText, { color: colors.accentWarm }]}>
                        61-90: ₹{(party.aging.bucket_61_90 / 1000).toFixed(1)}K
                      </Text>
                    </View>
                  )}
                  {party.aging.bucket_90_plus > 0 && (
                    <View style={styles.agingChip}>
                      <Text style={[styles.agingChipText, { color: colors.error }]}>
                        90+: ₹{(party.aging.bucket_90_plus / 1000).toFixed(1)}K
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text style={[styles.emptyIcon]}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Outstanding</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              No open {partyType === "customer" ? "receivables" : "payables"} found
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {},
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  totalCard: {
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 4,
  },
  totalHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  agingCard: {
    borderWidth: 1,
  },
  agingTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  agingBuckets: {
    gap: 16,
  },
  agingBucket: {
    gap: 6,
  },
  bucketLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  bucketValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  partyListCard: {
    borderWidth: 1,
  },
  partyListTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  partyItem: {
    paddingVertical: 12,
  },
  partyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  partyName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  partyTotal: {
    fontSize: 16,
    fontWeight: "800",
  },
  partyAging: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  agingChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  agingChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyCard: {
    padding: 40,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
  },
});
