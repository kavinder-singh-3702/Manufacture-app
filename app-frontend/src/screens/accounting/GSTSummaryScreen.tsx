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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { accountingService, GSTSummaryData } from "../../services/accounting.service";
import { CompanyRequiredCard } from "../../components/company";
import { RootStackParamList } from "../../navigation/types";
import { DateRangePicker, DateRange } from "../../components/accounting/DateRangePicker";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const GSTSummaryScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { user, requestLogin } = useAuth();
  const navigation = useNavigation<Nav>();
  const isGuest = !user || user.role === "guest";
  const hasCompany = Boolean(user?.activeCompany);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<GSTSummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const fetchData = useCallback(async () => {
    if (isGuest || !hasCompany) {
      setError(null);
      setData(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const result = await accountingService.getGSTSummary(dateRange);
      setData(result);
    } catch (err: any) {
      console.error("Failed to fetch GST summary:", err);
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, hasCompany, isGuest]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    setLoading(true);
  };

  const handleChooseCompany = useCallback(() => {
    navigation.navigate("CompanyContextPicker", {
      redirectTo: { kind: "stack", screen: "GSTSummary" },
      source: "GST Summary",
    });
  }, [navigation]);

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: "center", padding: spacing.lg }}>
          <CompanyRequiredCard
            title="Login to continue"
            description="Sign in to view GST reports for your business."
            primaryLabel="Login"
            onPrimaryPress={requestLogin}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!hasCompany) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: "center", padding: spacing.lg }}>
          <CompanyRequiredCard
            description="GST summary is tied to your active company ledger. Choose or create a company to continue."
            onPrimaryPress={handleChooseCompany}
            onSecondaryPress={() =>
              navigation.navigate("CompanyCreate", { redirectTo: { kind: "stack", screen: "GSTSummary" } })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
            Loading GST Summary...
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

  // Calculate totals
  const totalInput = (data?.input.cgst || 0) + (data?.input.sgst || 0) + (data?.input.igst || 0);
  const totalOutput = (data?.output.cgst || 0) + (data?.output.sgst || 0) + (data?.output.igst || 0);

  // Prepare bar chart data
  const barData = [
    {
      value: data?.input.cgst || 0,
      label: "CGST",
      frontColor: colors.primary,
      topLabelComponent: () => (
        <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700" }}>
          ₹{((data?.input.cgst || 0) / 1000).toFixed(1)}K
        </Text>
      ),
    },
    {
      value: data?.input.sgst || 0,
      label: "SGST",
      frontColor: colors.accentWarm,
      topLabelComponent: () => (
        <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700" }}>
          ₹{((data?.input.sgst || 0) / 1000).toFixed(1)}K
        </Text>
      ),
    },
    {
      value: data?.input.igst || 0,
      label: "IGST",
      frontColor: colors.success,
      topLabelComponent: () => (
        <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700" }}>
          ₹{((data?.input.igst || 0) / 1000).toFixed(1)}K
        </Text>
      ),
    },
  ];

  const maxValue = Math.max(
    data?.input.cgst || 0,
    data?.input.sgst || 0,
    data?.input.igst || 0,
    data?.output.cgst || 0,
    data?.output.sgst || 0,
    data?.output.igst || 0,
    1000
  );

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
          <Text style={[styles.title, { color: colors.text }]}>🧾 GST Summary</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Input vs Output Tax Analysis
          </Text>
        </View>

        {/* Date Range Picker */}
        <View style={{ marginBottom: spacing.lg }}>
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
        </View>

        {/* Net Payable Card */}
        <View
          style={[
            styles.netPayableCard,
            {
              backgroundColor:
                (data?.netPayable || 0) >= 0 ? colors.error + "15" : colors.success + "15",
              borderColor: (data?.netPayable || 0) >= 0 ? colors.error + "40" : colors.success + "40",
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.netPayableLabel, { color: colors.textSecondary }]}>
            {(data?.netPayable || 0) >= 0 ? "GST Payable" : "GST Receivable"}
          </Text>
          <Text
            style={[
              styles.netPayableValue,
              { color: (data?.netPayable || 0) >= 0 ? colors.error : colors.success },
            ]}
          >
            ₹{Math.abs(data?.netPayable || 0).toLocaleString()}
          </Text>
          <Text style={[styles.netPayableHint, { color: colors.textMuted }]}>
            {(data?.netPayable || 0) >= 0 ? "To be paid to government" : "To be claimed from government"}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={[styles.summaryGrid, { gap: spacing.md, marginBottom: spacing.lg }]}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.primary + "15",
                borderColor: colors.primary + "40",
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>Input GST</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{totalInput.toLocaleString()}
            </Text>
            <Text style={[styles.summarySubtext, { color: colors.textMuted }]}>On purchases</Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.warning + "15",
                borderColor: colors.warning + "40",
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.warning }]}>Output GST</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{totalOutput.toLocaleString()}
            </Text>
            <Text style={[styles.summarySubtext, { color: colors.textMuted }]}>On sales</Text>
          </View>
        </View>

        {/* Input GST Breakdown */}
        <View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>📥 Input GST (Credits)</Text>
          <Text style={[styles.breakdownSubtitle, { color: colors.textMuted }]}>
            Tax paid on purchases - can be claimed
          </Text>

          <View style={styles.gstRows}>
            <View style={styles.gstRow}>
              <View style={[styles.gstDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>CGST</Text>
              <View style={{ flex: 1 }}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((data?.input.cgst || 0) / maxValue) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.gstValue, { color: colors.text }]}>
                ₹{(data?.input.cgst || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.gstRow}>
              <View style={[styles.gstDot, { backgroundColor: colors.accentWarm }]} />
              <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>SGST</Text>
              <View style={{ flex: 1 }}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((data?.input.sgst || 0) / maxValue) * 100}%`,
                        backgroundColor: colors.accentWarm,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.gstValue, { color: colors.text }]}>
                ₹{(data?.input.sgst || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.gstRow}>
              <View style={[styles.gstDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>IGST</Text>
              <View style={{ flex: 1 }}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((data?.input.igst || 0) / maxValue) * 100}%`,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.gstValue, { color: colors.text }]}>
                ₹{(data?.input.igst || 0).toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.totalRow,
                { borderTopColor: colors.border, backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Input GST</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                ₹{totalInput.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Output GST Breakdown */}
        <View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>📤 Output GST (Liabilities)</Text>
          <Text style={[styles.breakdownSubtitle, { color: colors.textMuted }]}>
            Tax collected on sales - to be paid
          </Text>

          <View style={styles.gstRows}>
            <View style={styles.gstRow}>
              <View style={[styles.gstDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>CGST</Text>
              <View style={{ flex: 1 }}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((data?.output.cgst || 0) / maxValue) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.gstValue, { color: colors.text }]}>
                ₹{(data?.output.cgst || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.gstRow}>
              <View style={[styles.gstDot, { backgroundColor: colors.accentWarm }]} />
              <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>SGST</Text>
              <View style={{ flex: 1 }}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((data?.output.sgst || 0) / maxValue) * 100}%`,
                        backgroundColor: colors.accentWarm,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.gstValue, { color: colors.text }]}>
                ₹{(data?.output.sgst || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.gstRow}>
              <View style={[styles.gstDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>IGST</Text>
              <View style={{ flex: 1 }}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((data?.output.igst || 0) / maxValue) * 100}%`,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.gstValue, { color: colors.text }]}>
                ₹{(data?.output.igst || 0).toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.totalRow,
                { borderTopColor: colors.border, backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Output GST</Text>
              <Text style={[styles.totalValue, { color: colors.warning }]}>
                ₹{totalOutput.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Calculation Breakdown */}
        <View
          style={[
            styles.calculationCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
            },
          ]}
        >
          <Text style={[styles.calculationTitle, { color: colors.text }]}>📊 Calculation</Text>
          <View style={styles.calculationRows}>
            <View style={styles.calculationRow}>
              <Text style={[styles.calculationLabel, { color: colors.textSecondary }]}>
                Output GST (Collected)
              </Text>
              <Text style={[styles.calculationValue, { color: colors.text }]}>
                ₹{totalOutput.toLocaleString()}
              </Text>
            </View>
            <View style={styles.calculationRow}>
              <Text style={[styles.calculationLabel, { color: colors.textSecondary }]}>
                Input GST (Paid)
              </Text>
              <Text style={[styles.calculationValue, { color: colors.text }]}>
                - ₹{totalInput.toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.calculationRow,
                styles.calculationTotal,
                { borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.calculationTotalLabel, { color: colors.text }]}>
                Net {(data?.netPayable || 0) >= 0 ? "Payable" : "Receivable"}
              </Text>
              <Text
                style={[
                  styles.calculationTotalValue,
                  { color: (data?.netPayable || 0) >= 0 ? colors.error : colors.success },
                ]}
              >
                ₹{Math.abs(data?.netPayable || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
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
  netPayableCard: {
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  netPayableLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  netPayableValue: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 4,
  },
  netPayableHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  summaryGrid: {
    flexDirection: "row",
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 11,
    fontWeight: "500",
  },
  breakdownCard: {
    borderWidth: 1,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  breakdownSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  gstRows: {
    gap: 12,
  },
  gstRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gstDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gstLabel: {
    fontSize: 13,
    fontWeight: "600",
    width: 60,
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
  gstValue: {
    fontSize: 14,
    fontWeight: "700",
    width: 100,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  calculationCard: {
    borderWidth: 1,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  calculationRows: {
    gap: 8,
  },
  calculationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  calculationLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  calculationTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
  },
  calculationTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  calculationTotalValue: {
    fontSize: 18,
    fontWeight: "900",
  },
});
