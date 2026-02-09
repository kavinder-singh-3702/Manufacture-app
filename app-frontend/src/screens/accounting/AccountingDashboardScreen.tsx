import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { accountingService, DashboardData } from "../../services/accounting.service";
import { tallyService, type Voucher } from "../../services/tally.service";
import type { RootStackParamList } from "../../navigation/types";
import { DateRangePicker, type DateRange } from "../../components/accounting/DateRangePicker";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const formatMoney = (value: number) => {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
};

const formatMoneyCompact = (value: number) => {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  if (Math.abs(safe) >= 10000000) return `₹${(safe / 10000000).toFixed(2)}Cr`;
  if (Math.abs(safe) >= 100000) return `₹${(safe / 100000).toFixed(2)}L`;
  if (Math.abs(safe) >= 1000) return `₹${(safe / 1000).toFixed(1)}K`;
  return `₹${safe.toLocaleString("en-IN")}`;
};

const formatPeriodLabel = (range: DateRange) => {
  if (!range.from && !range.to) return "All time";
  const toLabel = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  if (range.from && range.from === range.to) return toLabel(range.from);
  return `${toLabel(range.from)} - ${toLabel(range.to)}`;
};

const getVoucherLabel = (voucherType: string) => {
  switch (voucherType) {
    case "sales_invoice":
      return "Sales Invoice";
    case "purchase_bill":
      return "Purchase Bill";
    case "receipt":
      return "Receipt";
    case "payment":
      return "Payment";
    case "journal":
      return "Journal";
    case "contra":
      return "Contra";
    case "credit_note":
      return "Credit Note";
    case "debit_note":
      return "Debit Note";
    case "stock_adjustment":
      return "Stock Adjustment";
    default:
      return voucherType?.replace(/_/g, " ") || "Voucher";
  }
};

const getStatusTone = (status?: string) => {
  if (status === "posted") return "posted";
  if (status === "draft") return "draft";
  if (status === "voided") return "voided";
  return "neutral";
};

export const AccountingDashboardScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [recentVouchers, setRecentVouchers] = useState<Voucher[]>([]);

  const periodLabel = useMemo(() => formatPeriodLabel(dateRange), [dateRange]);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [dashboardResult, vouchersResult] = await Promise.all([
        accountingService.getDashboard(dateRange),
        tallyService
          .listVouchers({
            status: "posted",
            limit: 5,
            offset: 0,
            from: dateRange.from,
            to: dateRange.to,
          })
          .catch((err) => {
            console.warn("Failed to fetch recent vouchers:", err);
            return null;
          }),
      ]);

      setDashboard(dashboardResult);
      setRecentVouchers(vouchersResult?.vouchers || []);
    } catch (err: any) {
      console.error("Failed to fetch accounting dashboard:", err);
      setError(err?.message || "Failed to load accounting dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  useEffect(() => {
    // If date range changes while screen is visible, refresh.
    if (!loading) {
      setLoading(true);
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const workingCapital = useMemo(() => {
    const receivables = dashboard?.receivables || 0;
    const payables = dashboard?.payables || 0;
    return {
      receivables,
      payables,
      net: receivables - payables,
      max: Math.max(receivables, payables, 1),
    };
  }, [dashboard?.payables, dashboard?.receivables]);

  if (loading) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient colors={["rgba(108,99,255,0.10)", "transparent"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted, marginTop: 12 }]}>
            Loading accounting dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["rgba(108,99,255,0.10)", "transparent"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.title, { color: colors.text }]}>Accounting</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {periodLabel}
          </Text>
        </View>

        {/* Error Banner */}
        {error ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.error + "18",
                borderColor: colors.error + "30",
                borderRadius: radius.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]} numberOfLines={2}>
              {error}
            </Text>
            <TouchableOpacity onPress={() => { setLoading(true); fetchAll(); }} activeOpacity={0.8}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Period Picker */}
        <View style={{ marginBottom: spacing.lg }}>
          <DateRangePicker label="Period" value={dateRange} onChange={setDateRange} />
        </View>

        {/* KPI Grid */}
        <SectionHeader title="Overview" subtitle="Key financial metrics" />
        <View style={[styles.grid, { marginBottom: spacing.lg }]}>
          <MetricCard
            label="Sales"
            value={formatMoneyCompact(dashboard?.sales || 0)}
            iconName="trending-up-outline"
            accent={colors.success}
          />
          <MetricCard
            label="Purchases"
            value={formatMoneyCompact(dashboard?.purchases || 0)}
            iconName="cart-outline"
            accent={colors.primary}
          />
          <MetricCard
            label="Gross Profit"
            value={formatMoneyCompact(dashboard?.grossProfit || 0)}
            iconName="stats-chart-outline"
            accent={(dashboard?.grossProfit || 0) >= 0 ? colors.success : colors.error}
          />
          <MetricCard
            label="Cash Balance"
            value={formatMoneyCompact(dashboard?.cashBalance || 0)}
            iconName="cash-outline"
            accent={colors.accentWarm}
          />
          <MetricCard
            label="Receivables"
            value={formatMoneyCompact(dashboard?.receivables || 0)}
            iconName="arrow-down-circle-outline"
            accent={colors.warning}
          />
          <MetricCard
            label="Payables"
            value={formatMoneyCompact(dashboard?.payables || 0)}
            iconName="arrow-up-circle-outline"
            accent={colors.error}
          />
        </View>

        {/* Quick Entry */}
        <SectionHeader title="Quick Entry" subtitle="Create transactions fast" />
        <View style={[styles.grid, { marginBottom: spacing.lg }]}>
          <ActionCard
            label="Sales Invoice"
            subtitle="Record a sale"
            iconName="document-text-outline"
            accent={colors.success}
            onPress={() => navigation.navigate("SalesInvoice")}
          />
          <ActionCard
            label="Purchase Bill"
            subtitle="Record a purchase"
            iconName="bag-handle-outline"
            accent={colors.primary}
            onPress={() => navigation.navigate("PurchaseBill")}
          />
          <ActionCard
            label="Receipt"
            subtitle="Money received"
            iconName="download-outline"
            accent={colors.success}
            onPress={() => navigation.navigate("ReceiptPayment", { type: "receipt" })}
          />
          <ActionCard
            label="Payment"
            subtitle="Money paid"
            iconName="send-outline"
            accent={colors.error}
            onPress={() => navigation.navigate("ReceiptPayment", { type: "payment" })}
          />
        </View>

        {/* Recent Transactions */}
        <SectionHeader
          title="Recent Transactions"
          subtitle="Latest posted vouchers"
          rightActionLabel="View all"
          onRightAction={() => navigation.navigate("TransactionList")}
        />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.lg },
          ]}
        >
          {recentVouchers.length ? (
            recentVouchers.map((voucher, index) => (
              <VoucherRow
                key={voucher._id}
                voucher={voucher}
                isLast={index === recentVouchers.length - 1}
              />
            ))
          ) : (
            <View style={{ padding: spacing.lg, alignItems: "center" }}>
              <Ionicons name="time-outline" size={22} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text, marginTop: spacing.sm }]}>No transactions yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Use Quick Entry to create your first voucher
              </Text>
            </View>
          )}
        </View>

        {/* Reports */}
        <SectionHeader title="Reports" subtitle="Detailed accounting views" />
        <View style={[styles.grid, { marginBottom: spacing.lg }]}>
          <ActionCard
            label="Profit & Loss"
            subtitle="Income vs expense"
            iconName="pie-chart-outline"
            accent={colors.success}
            onPress={() => navigation.navigate("ProfitLoss")}
          />
          <ActionCard
            label="GST Summary"
            subtitle="Input vs output tax"
            iconName="receipt-outline"
            accent={colors.primary}
            onPress={() => navigation.navigate("GSTSummary")}
          />
          <ActionCard
            label="Outstanding"
            subtitle="Receivable / payable aging"
            iconName="people-outline"
            accent={colors.warning}
            onPress={() => navigation.navigate("PartyOutstanding")}
          />
        </View>

        {/* Working Capital */}
        <SectionHeader title="Working Capital" subtitle="Receivables vs payables" />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.lg },
          ]}
        >
          <View style={{ padding: spacing.md, gap: spacing.md }}>
            <WorkingCapitalBar
              label="Receivables"
              value={workingCapital.receivables}
              max={workingCapital.max}
              accent={colors.success}
            />
            <WorkingCapitalBar
              label="Payables"
              value={workingCapital.payables}
              max={workingCapital.max}
              accent={colors.error}
            />
            <View
              style={[
                styles.netPositionCard,
                {
                  borderRadius: radius.md,
                  borderColor: workingCapital.net >= 0 ? colors.success + "35" : colors.error + "35",
                  backgroundColor: workingCapital.net >= 0 ? colors.success + "10" : colors.error + "10",
                },
              ]}
            >
              <Text style={[styles.netPositionLabel, { color: colors.textMuted }]}>Net Position</Text>
              <Text
                style={[
                  styles.netPositionValue,
                  { color: workingCapital.net >= 0 ? colors.success : colors.error },
                ]}
              >
                {workingCapital.net >= 0 ? "+" : ""}
                {formatMoney(workingCapital.net)}
              </Text>
            </View>
          </View>
        </View>

        {/* Inventory Snapshot */}
        <SectionHeader title="Inventory Snapshot" subtitle="Low stock and top movement" />

        {dashboard?.lowStockProducts?.length ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.lg },
            ]}
          >
            <View style={[styles.cardHeaderRow, { padding: spacing.md, paddingBottom: spacing.sm }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Low stock</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("FilteredProducts", { filter: "low_stock", title: "Low Stock Products" })}
                activeOpacity={0.8}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>View</Text>
              </TouchableOpacity>
            </View>
            {dashboard.lowStockProducts.slice(0, 5).map((p, idx) => (
              <View
                key={p._id}
                style={[
                  styles.snapshotRow,
                  {
                    borderTopColor: colors.border,
                    borderTopWidth: idx === 0 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border,
                    borderBottomWidth: idx < Math.min(4, dashboard.lowStockProducts.length - 1) ? StyleSheet.hairlineWidth : 0,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.snapshotName, { color: colors.text }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.snapshotMeta, { color: colors.textMuted }]}>
                    On hand: {p.availableQuantity}  Min: {p.minStockQuantity}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.warning + "18", borderColor: colors.warning + "40" }]}>
                  <Text style={[styles.badgeText, { color: colors.warning }]}>Low</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {dashboard?.topItems?.length ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.lg },
            ]}
          >
            <View style={[styles.cardHeaderRow, { padding: spacing.md, paddingBottom: spacing.sm }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Top items</Text>
              <Text style={[styles.cardHint, { color: colors.textMuted }]}>By quantity sold</Text>
            </View>
            {dashboard.topItems.slice(0, 5).map((item, idx) => {
              const productId = typeof item._id?.product === "string" ? item._id.product : String(item._id?.product || "");
              const displayName = item.productName || (productId ? `Product ${productId.slice(0, 8)}` : "Product");
              return (
                <View
                  key={`${productId}-${idx}`}
                  style={[
                    styles.snapshotRow,
                    {
                      borderTopColor: colors.border,
                      borderTopWidth: idx === 0 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: colors.border,
                      borderBottomWidth: idx < Math.min(4, dashboard.topItems.length - 1) ? StyleSheet.hairlineWidth : 0,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                >
                  <View style={[styles.rankBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
                    <Text style={[styles.rankText, { color: colors.primary }]}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.snapshotName, { color: colors.text }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[styles.snapshotMeta, { color: colors.textMuted }]}>
                      Qty: {Number(item.qtyOut || 0).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={[styles.snapshotValue, { color: colors.success }]}>{formatMoneyCompact(item.costValue || 0)}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const SectionHeader = ({
  title,
  subtitle,
  rightActionLabel,
  onRightAction,
}: {
  title: string;
  subtitle?: string;
  rightActionLabel?: string;
  onRightAction?: () => void;
}) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
        {rightActionLabel && onRightAction ? (
          <TouchableOpacity onPress={onRightAction} activeOpacity={0.8}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{rightActionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const MetricCard = ({
  label,
  value,
  iconName,
  accent,
}: {
  label: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accent: string;
}) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ width: "48%" }}>
      <View
        style={[
          styles.metricCard,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: accent + "35",
            borderRadius: radius.lg,
            padding: spacing.md,
            shadowColor: accent,
          },
        ]}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: accent + "18", borderColor: accent + "30" }]}>
            <Ionicons name={iconName} size={18} color={accent} />
          </View>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const ActionCard = ({
  label,
  subtitle,
  iconName,
  accent,
  onPress,
}: {
  label: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accent: string;
  onPress: () => void;
}) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ width: "48%" }}>
      <View
        style={[
          styles.actionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.md,
          },
        ]}
      >
        <View style={[styles.actionIcon, { backgroundColor: accent + "18", borderColor: accent + "35" }]}>
          <Ionicons name={iconName} size={20} color={accent} />
        </View>
        <Text style={[styles.actionTitle, { color: colors.text }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.actionSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const VoucherRow = ({ voucher, isLast }: { voucher: Voucher; isLast: boolean }) => {
  const { colors, spacing } = useTheme();
  const partyName =
    typeof voucher.party === "object" && voucher.party
      ? (voucher.party as any).name
      : undefined;
  const statusTone = getStatusTone(voucher.status);
  const statusColor =
    statusTone === "posted" ? colors.success : statusTone === "draft" ? colors.warning : statusTone === "voided" ? colors.error : colors.textMuted;
  const topLine = getVoucherLabel(voucher.voucherType);
  const voucherNumber = voucher.voucherNumber ? `#${voucher.voucherNumber}` : undefined;

  return (
    <View
      style={[
        styles.voucherRow,
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.voucherTopRow}>
          <Text style={[styles.voucherType, { color: colors.text }]} numberOfLines={1}>
            {topLine}
          </Text>
          {voucherNumber ? (
            <Text style={[styles.voucherNumber, { color: colors.textMuted }]} numberOfLines={1}>
              {voucherNumber}
            </Text>
          ) : null}
        </View>
        {partyName ? (
          <Text style={[styles.voucherParty, { color: colors.textSecondary }]} numberOfLines={1}>
            {partyName}
          </Text>
        ) : null}
        <Text style={[styles.voucherDate, { color: colors.textMuted }]}>
          {new Date(voucher.date).toLocaleDateString("en-IN")}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 8 }}>
        <View style={[styles.badge, { backgroundColor: statusColor + "18", borderColor: statusColor + "40" }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{String(voucher.status || "posted").toUpperCase()}</Text>
        </View>
        <Text style={[styles.voucherAmount, { color: colors.text }]}>{formatMoneyCompact(voucher.totals?.net || 0)}</Text>
      </View>
    </View>
  );
};

const WorkingCapitalBar = ({
  label,
  value,
  max,
  accent,
}: {
  label: string;
  value: number;
  max: number;
  accent: string;
}) => {
  const { colors, spacing, radius } = useTheme();
  const widthPctValue = Math.min(100, (Number(value || 0) / Math.max(Number(max || 1), 1)) * 100);
  const widthPct = `${widthPctValue}%` as `${number}%`;

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.cashFlowHeader}>
        <View style={[styles.legendDot, { backgroundColor: accent }]} />
        <Text style={[styles.cashFlowLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.cashFlowValue, { color: colors.text }]}>{formatMoney(value || 0)}</Text>
      <View style={[styles.cashFlowBar, { backgroundColor: colors.border, borderRadius: radius.sm, marginTop: spacing.xs }]}>
        <View style={[styles.cashFlowBarFill, { width: widthPct, backgroundColor: accent }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 14, fontWeight: "600" },

  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.6 },
  subtitle: { fontSize: 13, fontWeight: "700", marginTop: 4 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "600" },
  retryText: { fontSize: 13, fontWeight: "800" },

  sectionHeader: {},
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: "800" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },

  metricCard: { borderWidth: 1, overflow: "hidden" },
  metricHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: { fontSize: 12, fontWeight: "700", flex: 1 },
  metricValue: { fontSize: 20, fontWeight: "900", marginTop: 10, letterSpacing: -0.2 },

  actionCard: { borderWidth: 1 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: { fontSize: 15, fontWeight: "800" },
  actionSubtitle: { fontSize: 12, fontWeight: "600", marginTop: 4 },

  card: { borderWidth: 1, overflow: "hidden" },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  cardHint: { fontSize: 12, fontWeight: "700" },

  voucherRow: { flexDirection: "row", alignItems: "center" },
  voucherTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  voucherType: { fontSize: 14, fontWeight: "800", maxWidth: 160 },
  voucherNumber: { fontSize: 12, fontWeight: "700" },
  voucherParty: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  voucherDate: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  voucherAmount: { fontSize: 13, fontWeight: "900" },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },

  emptyTitle: { fontSize: 15, fontWeight: "800" },
  emptySubtitle: { fontSize: 12, fontWeight: "600", marginTop: 6, textAlign: "center" },

  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: { fontSize: 12, fontWeight: "900" },

  snapshotRow: { flexDirection: "row", alignItems: "center" },
  snapshotName: { fontSize: 13, fontWeight: "700" },
  snapshotMeta: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  snapshotValue: { fontSize: 13, fontWeight: "900" },

  legendDot: { width: 10, height: 10, borderRadius: 5 },
  cashFlowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cashFlowLabel: { fontSize: 13, fontWeight: "600" },
  cashFlowValue: { fontSize: 18, fontWeight: "900", marginTop: 2 },
  cashFlowBar: { height: 12, overflow: "hidden" },
  cashFlowBarFill: { height: "100%", borderRadius: 6 },

  netPositionCard: { padding: 12, borderWidth: 1, alignItems: "center" },
  netPositionLabel: { fontSize: 12, fontWeight: "700" },
  netPositionValue: { fontSize: 22, fontWeight: "900", marginTop: 6 },
});
