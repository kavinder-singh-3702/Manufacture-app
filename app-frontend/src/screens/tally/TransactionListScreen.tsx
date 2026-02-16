import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { tallyService, Voucher, VoucherType, VoucherStatus } from '../../services/tally.service';
import { CompanyRequiredCard } from '../../components/company';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const TransactionListScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<Nav>();
  const { user, requestLogin } = useAuth();
  const isGuest = !user || user.role === 'guest';
  const hasCompany = Boolean(user?.activeCompany);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<VoucherType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<VoucherStatus | 'all'>('all');

  const loadVouchers = useCallback(async () => {
    if (isGuest || !hasCompany) {
      setError(null);
      setVouchers([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const params: any = { limit: 50 };
      if (selectedType !== 'all') params.voucherType = selectedType;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const response = await tallyService.listVouchers(params);
      setVouchers(response.vouchers);
    } catch (err: any) {
      console.error('Failed to load vouchers:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasCompany, isGuest, selectedType, selectedStatus]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVouchers();
  };

  const handleChooseCompany = useCallback(() => {
    navigation.navigate('CompanyContextPicker', {
      redirectTo: { kind: 'stack', screen: 'TransactionList' },
      source: 'Transactions',
    });
  }, [navigation]);

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
          <CompanyRequiredCard
            title="Login to continue"
            description="Sign in to view your company transaction history."
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
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
          <CompanyRequiredCard
            description="Transactions are maintained per company. Choose or create a company to continue."
            onPrimaryPress={handleChooseCompany}
            onSecondaryPress={() =>
              navigation.navigate('CompanyCreate', { redirectTo: { kind: 'stack', screen: 'TransactionList' } })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  const getVoucherIcon = (type: VoucherType) => {
    switch (type) {
      case 'sales_invoice':
        return '📄';
      case 'purchase_bill':
        return '📥';
      case 'receipt':
        return '💰';
      case 'payment':
        return '💸';
      case 'journal':
        return '📝';
      case 'contra':
        return '🔄';
      case 'credit_note':
        return '🔖';
      case 'debit_note':
        return '🔖';
      default:
        return '📋';
    }
  };

  const getVoucherColor = (type: VoucherType) => {
    if (type === 'sales_invoice' || type === 'receipt' || type === 'credit_note') {
      return colors.success;
    }
    if (type === 'purchase_bill' || type === 'payment' || type === 'debit_note') {
      return colors.error;
    }
    return colors.primary;
  };

  const getStatusBadgeColor = (status: VoucherStatus) => {
    switch (status) {
      case 'posted':
        return colors.success;
      case 'draft':
        return colors.warning;
      case 'voided':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const renderVoucher = ({ item }: { item: Voucher }) => {
    const voucherColor = getVoucherColor(item.voucherType);
    const statusColor = getStatusBadgeColor(item.status);
    const partyName = typeof item.party === 'object' && item.party ? (item.party as any).name : undefined;

    return (
      <TouchableOpacity
        style={[
          styles.voucherCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            marginBottom: spacing.sm,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          // Navigate to voucher details
          alert(`Voucher ID: ${item._id}\nType: ${item.voucherType}\nStatus: ${item.status}`);
        }}
      >
        <View style={styles.voucherHeader}>
          <View style={styles.voucherTitleRow}>
            <Text style={styles.voucherIcon}>{getVoucherIcon(item.voucherType)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.voucherType, { color: colors.text }]}>
                {item.voucherType.replace('_', ' ').toUpperCase()}
              </Text>
              {item.voucherNumber && (
                <Text style={[styles.voucherNumber, { color: colors.textMuted }]}>
                  #{item.voucherNumber}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {partyName ? (
          <View style={styles.voucherRow}>
            <Text style={[styles.voucherLabel, { color: colors.textSecondary }]}>Party:</Text>
            <Text style={[styles.voucherValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
              {partyName}
            </Text>
          </View>
        ) : null}

        <View style={styles.voucherRow}>
          <Text style={[styles.voucherLabel, { color: colors.textSecondary }]}>Date:</Text>
          <Text style={[styles.voucherValue, { color: colors.text }]}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>

        <View style={[styles.voucherRow, styles.amountRow]}>
          <Text style={[styles.voucherLabel, { color: colors.textSecondary }]}>Amount:</Text>
          <Text style={[styles.amountValue, { color: voucherColor }]}>
            ₹{item.totals.net.toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted, marginTop: 12 }]}>
            Loading Transactions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            padding: spacing.md,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📋 Transactions</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, padding: spacing.sm }]}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filter:</Text>
        <View style={styles.filterChips}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedType === 'all' ? colors.primary : colors.background,
                borderColor: selectedType === 'all' ? colors.primary : colors.border,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[styles.filterChipText, { color: selectedType === 'all' ? '#FFF' : colors.text }]}>
              All Types
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedType === 'sales_invoice' ? colors.success : colors.background,
                borderColor: selectedType === 'sales_invoice' ? colors.success : colors.border,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setSelectedType('sales_invoice')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedType === 'sales_invoice' ? '#FFF' : colors.text },
              ]}
            >
              Sales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedType === 'purchase_bill' ? colors.error : colors.background,
                borderColor: selectedType === 'purchase_bill' ? colors.error : colors.border,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setSelectedType('purchase_bill')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedType === 'purchase_bill' ? '#FFF' : colors.text },
              ]}
            >
              Purchases
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>❌ {error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}
            onPress={onRefresh}
          >
            <Text style={[styles.retryButtonText, { color: '#fff' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vouchers}
          renderItem={renderVoucher}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, { padding: spacing.md }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Create your first transaction from Tally Stats
              </Text>
            </View>
          }
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  filtersContainer: {
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  voucherCard: {
    borderWidth: 1,
    padding: 12,
  },
  voucherHeader: {},
  voucherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  voucherIcon: {
    fontSize: 24,
  },
  voucherType: {
    fontSize: 14,
    fontWeight: '700',
  },
  voucherNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  voucherLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  voucherValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  amountRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
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
});
