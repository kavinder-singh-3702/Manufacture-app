import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { tallyService, TallyStats } from '../../services/tally.service';

const { width } = Dimensions.get('window');

export const TallyStatsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<TallyStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await tallyService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load Tally stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted, marginTop: 12 }]}>
            Loading Tally Stats...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Note: Don't return early on error - show action buttons even if stats fail

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <LinearGradient
        colors={['rgba(108, 99, 255, 0.06)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <Text style={[styles.title, { color: colors.text }]}>📊 Tally Stats</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Accounting Overview & Quick Entry
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.error + '15',
                borderColor: colors.error + '40',
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.xs }]}>
              ⚠️ Stats unavailable
            </Text>
            <Text style={[styles.errorSubtext, { color: colors.textSecondary, fontSize: 13 }]}>
              {error}. You can still create entries below.
            </Text>
          </View>
        )}

        {/* Financial Overview Cards - Only show if stats loaded successfully */}
        {stats && (
          <View style={[styles.section, { marginBottom: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
              💰 Financial Overview
            </Text>

            <View style={styles.statsGrid}>
            {/* Sales Card */}
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.success + '15',
                  borderColor: colors.success + '40',
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Sales</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                ₹{(stats?.totalSales || 0).toLocaleString()}
              </Text>
              <Text style={[styles.statHint, { color: colors.textMuted }]}>Revenue</Text>
            </View>

            {/* Purchases Card */}
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.error + '15',
                  borderColor: colors.error + '40',
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Purchases</Text>
              <Text style={[styles.statValue, { color: colors.error }]}>
                ₹{(stats?.totalPurchases || 0).toLocaleString()}
              </Text>
              <Text style={[styles.statHint, { color: colors.textMuted }]}>Expenses</Text>
            </View>

            {/* Profit Card */}
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary + '40',
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Net Profit</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                ₹{(stats?.netProfit || 0).toLocaleString()}
              </Text>
              <Text style={[styles.statHint, { color: colors.textMuted }]}>Margin</Text>
            </View>

            {/* Receivables Card */}
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.warning + '15',
                  borderColor: colors.warning + '40',
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Receivables</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                ₹{(stats?.receivables || 0).toLocaleString()}
              </Text>
              <Text style={[styles.statHint, { color: colors.textMuted }]}>To Collect</Text>
            </View>
          </View>
        </View>
        )}

        {/* Financial Chart */}
        {stats && (stats.totalSales > 0 || stats.totalPurchases > 0) && (
          <View style={[styles.section, { marginBottom: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
              📈 Financial Overview
            </Text>

            <View
              style={[
                styles.chartCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  alignItems: 'center',
                },
              ]}
            >
              <PieChart
                data={[
                  {
                    value: stats.totalSales,
                    color: colors.success,
                    text: '₹' + (stats.totalSales / 1000).toFixed(0) + 'K',
                  },
                  {
                    value: stats.totalPurchases,
                    color: colors.error,
                    text: '₹' + (stats.totalPurchases / 1000).toFixed(0) + 'K',
                  },
                ]}
                donut
                radius={80}
                innerRadius={50}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                      ₹{((stats.totalSales - stats.totalPurchases) / 1000).toFixed(0)}K
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>Profit</Text>
                  </View>
                )}
              />

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>Sales</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>Purchases</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.section, { marginBottom: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
            ⚡ Quick Entry
          </Text>

          <View style={styles.actionsGrid}>
            {/* Sales Invoice */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                (navigation as any).navigate('SalesInvoice');
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
                <Text style={styles.actionIconText}>📄</Text>
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Sales Invoice</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                Create new sale
              </Text>
            </TouchableOpacity>

            {/* Purchase Bill */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                (navigation as any).navigate('PurchaseBill');
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.error + '20' }]}>
                <Text style={styles.actionIconText}>📥</Text>
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Purchase Bill</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                Record purchase
              </Text>
            </TouchableOpacity>

            {/* Receipt */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                (navigation as any).navigate('ReceiptPayment', { type: 'receipt' });
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Text style={styles.actionIconText}>💰</Text>
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Receipt</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                Payment received
              </Text>
            </TouchableOpacity>

            {/* Payment */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                (navigation as any).navigate('ReceiptPayment', { type: 'payment' });
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
                <Text style={styles.actionIconText}>💸</Text>
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Payment</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                Payment made
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Recent Transactions</Text>
            <TouchableOpacity onPress={() => {
              (navigation as any).navigate('TransactionList');
            }}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
            </TouchableOpacity>
          </View>

          {stats?.recentVouchers && stats.recentVouchers.length > 0 ? (
            <View style={[styles.transactionsList, { marginTop: spacing.md }]}>
              {stats.recentVouchers.map((voucher, index) => (
                <View
                  key={voucher.id}
                  style={[
                    styles.transactionCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <View style={styles.transactionHeader}>
                    <Text style={[styles.transactionType, { color: colors.text }]}>
                      {voucher.voucherType.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={[styles.transactionAmount, { color: colors.primary }]}>
                      ₹{voucher.totals.net.toLocaleString()}
                    </Text>
                  </View>
                  {voucher.party && (
                    <Text style={[styles.transactionParty, { color: colors.textMuted }]}>
                      {voucher.party.name}
                    </Text>
                  )}
                  <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
                    {new Date(voucher.date).toLocaleDateString()}
                  </Text>
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
                  marginTop: spacing.md,
                },
              ]}
            >
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Use Quick Entry above to create your first transaction
              </Text>
            </View>
          )}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  errorBanner: {
    borderWidth: 1,
  },
  errorSubtext: {
    fontSize: 13,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionIconText: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  transactionsList: {},
  transactionCard: {
    padding: 16,
    borderWidth: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  transactionParty: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 40,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartCard: {
    borderWidth: 1,
  },
  legend: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
