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
import { PieChart, BarChart } from "react-native-gifted-charts";
import { useTheme } from "../../hooks/useTheme";
import { accountingService, ProfitAndLossData } from "../../services/accounting.service";
import { DateRangePicker, DateRange } from "../../components/accounting/DateRangePicker";

export const ProfitLossScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ProfitAndLossData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await accountingService.getProfitAndLoss(dateRange);
      setData(result);
    } catch (err: any) {
      console.error("Failed to fetch P&L:", err);
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
            Loading P&L Report...
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

  const netProfitColor = data && data.netProfit >= 0 ? colors.success : colors.error;
  const profitMargin = data && data.totalIncome > 0
    ? ((data.netProfit / data.totalIncome) * 100).toFixed(1)
    : "0.0";

  // Prepare pie chart data
  const pieData = [
    {
      value: data?.totalIncome || 0,
      color: colors.success,
      text: `₹${((data?.totalIncome || 0) / 1000).toFixed(1)}K`,
      label: "Income",
    },
    {
      value: data?.totalExpense || 0,
      color: colors.error,
      text: `₹${((data?.totalExpense || 0) / 1000).toFixed(1)}K`,
      label: "Expenses",
    },
  ].filter((item) => item.value > 0);

  // Prepare bar chart data (top 10 items)
  const topIncomeItems = (data?.income || [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const topExpenseItems = (data?.expenses || [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const maxValue = Math.max(
    ...topIncomeItems.map((i) => i.value),
    ...topExpenseItems.map((i) => i.value),
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
          <Text style={[styles.title, { color: colors.text }]}>📊 Profit & Loss</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Income vs Expenses Analysis
          </Text>
        </View>

        {/* Date Range Picker */}
        <View style={{ marginBottom: spacing.lg }}>
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
        </View>

        {/* Summary Cards */}
        <View style={[styles.summaryGrid, { gap: spacing.md, marginBottom: spacing.lg }]}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.success + "15",
                borderColor: colors.success + "40",
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.success }]}>Total Income</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{(data?.totalIncome || 0).toLocaleString()}
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.error + "15",
                borderColor: colors.error + "40",
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.error }]}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{(data?.totalExpense || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Net Profit Card */}
        <View
          style={[
            styles.netProfitCard,
            {
              backgroundColor: netProfitColor + "15",
              borderColor: netProfitColor + "40",
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.netProfitLabel, { color: colors.textSecondary }]}>Net Profit</Text>
          <Text style={[styles.netProfitValue, { color: netProfitColor }]}>
            ₹{(data?.netProfit || 0).toLocaleString()}
          </Text>
          <Text style={[styles.netProfitMargin, { color: colors.textMuted }]}>
            {profitMargin}% profit margin
          </Text>
        </View>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <View
            style={[
              styles.chartCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text style={[styles.chartTitle, { color: colors.text }]}>Income vs Expenses</Text>
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={55}
                innerCircleColor={colors.surface}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={[styles.pieCenterValue, { color: netProfitColor }]}>
                      {data && data.totalIncome > 0
                        ? Math.abs((data.netProfit / data.totalIncome) * 100).toFixed(0)
                        : "0"}
                      %
                    </Text>
                    <Text style={[styles.pieCenterLabel, { color: colors.textMuted }]}>
                      {data && data.netProfit >= 0 ? "Profit" : "Loss"}
                    </Text>
                  </View>
                )}
              />
              <View style={[styles.legend, { marginLeft: spacing.lg }]}>
                {pieData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.legendValue, { color: colors.text }]}>{item.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Income Breakdown */}
        {topIncomeItems.length > 0 && (
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
            <Text style={[styles.breakdownTitle, { color: colors.text }]}>
              💰 Top Income Accounts
            </Text>
            {topIncomeItems.map((item, index) => (
              <View
                key={item.accountId}
                style={[
                  styles.breakdownItem,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < topIncomeItems.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                    {item.accountName}
                  </Text>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(item.value / maxValue) * 100}%`,
                          backgroundColor: colors.success,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.accountValue, { color: colors.success }]}>
                  ₹{(item.value / 1000).toFixed(1)}K
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Expense Breakdown */}
        {topExpenseItems.length > 0 && (
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
            <Text style={[styles.breakdownTitle, { color: colors.text }]}>
              💸 Top Expense Accounts
            </Text>
            {topExpenseItems.map((item, index) => (
              <View
                key={item.accountId}
                style={[
                  styles.breakdownItem,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < topExpenseItems.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                    {item.accountName}
                  </Text>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(item.value / maxValue) * 100}%`,
                          backgroundColor: colors.error,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.accountValue, { color: colors.error }]}>
                  ₹{(item.value / 1000).toFixed(1)}K
                </Text>
              </View>
            ))}
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
    fontSize: 20,
    fontWeight: "800",
  },
  netProfitCard: {
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  netProfitLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  netProfitValue: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 4,
  },
  netProfitMargin: {
    fontSize: 13,
    fontWeight: "600",
  },
  chartCard: {
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  pieContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  pieCenter: {
    alignItems: "center",
  },
  pieCenterValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  pieCenterLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  legend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  legendValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  breakdownCard: {
    borderWidth: 1,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  accountValue: {
    fontSize: 15,
    fontWeight: "800",
  },
});
