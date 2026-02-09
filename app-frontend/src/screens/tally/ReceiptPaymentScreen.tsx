import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { tallyService } from '../../services/tally.service';

type ReceiptPaymentType = 'receipt' | 'payment';

type RouteParams = {
  params: {
    type: ReceiptPaymentType;
  };
};

export const ReceiptPaymentScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: { type: ReceiptPaymentType } }, 'params'>>();

  const type: ReceiptPaymentType = route.params?.type || 'receipt';
  const isReceipt = type === 'receipt';

  const [loading, setLoading] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank'>('cash');

  const handleSave = async () => {
    // Validation
    if (!partyName.trim()) {
      Alert.alert('Error', `Please enter ${isReceipt ? 'customer' : 'supplier'} name`);
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create or get party
      let actualPartyId = partyId;
      if (!actualPartyId || actualPartyId.length !== 24) {
        // Auto-create party (customer for receipt, supplier for payment)
        const party = await tallyService.createParty({
          name: partyName,
          type: isReceipt ? 'customer' : 'supplier',
        });
        actualPartyId = party._id;
      }

      // Step 2: Create receipt/payment voucher
      const voucherData: any = {
        partyId: actualPartyId,
        amount: amountNum,
        date,
        paymentMode,
        narration: narration || `${isReceipt ? 'Receipt from' : 'Payment to'} ${partyName}`,
      };

      if (isReceipt) {
        await tallyService.createReceipt(voucherData);
      } else {
        await tallyService.createPayment(voucherData);
      }

      Alert.alert('Success', `${isReceipt ? 'Receipt' : 'Payment'} created successfully!`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error(`Failed to create ${type}:`, error);
      Alert.alert('Error', error.message || `Failed to create ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const config = isReceipt
    ? {
        title: '💰 Receipt',
        partyLabel: 'Customer Name',
        partyPlaceholder: 'Enter customer name',
        amountLabel: 'Amount Received',
        narrationPlaceholder: 'Payment received for...',
        color: colors.success,
        colorLight: colors.success + '15',
        colorBorder: colors.success + '40',
        buttonText: 'Save Receipt',
      }
    : {
        title: '💸 Payment',
        partyLabel: 'Supplier Name',
        partyPlaceholder: 'Enter supplier name',
        amountLabel: 'Amount Paid',
        narrationPlaceholder: 'Payment made for...',
        color: colors.error,
        colorLight: colors.error + '15',
        colorBorder: colors.error + '40',
        buttonText: 'Save Payment',
      };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{config.title}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl }]}>
        {/* Party Details */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
            {isReceipt ? 'From' : 'To'}
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>{config.partyLabel} *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radius.md,
              },
            ]}
            value={partyName}
            onChangeText={setPartyName}
            placeholder={config.partyPlaceholder}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radius.md,
              },
            ]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Payment Mode */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
            Payment Mode
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: paymentMode === 'cash' ? config.colorLight : colors.background,
                  borderColor: paymentMode === 'cash' ? config.colorBorder : colors.border,
                  borderRadius: radius.md,
                },
              ]}
              onPress={() => setPaymentMode('cash')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: paymentMode === 'cash' ? config.color : colors.textSecondary },
                ]}
              >
                💵 Cash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: paymentMode === 'bank' ? config.colorLight : colors.background,
                  borderColor: paymentMode === 'bank' ? config.colorBorder : colors.border,
                  borderRadius: radius.md,
                },
              ]}
              onPress={() => setPaymentMode('bank')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: paymentMode === 'bank' ? config.color : colors.textSecondary },
                ]}
              >
                🏦 Bank
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: config.colorLight,
              borderColor: config.colorBorder,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
            {config.amountLabel} *
          </Text>

          <View style={styles.amountInputContainer}>
            <Text style={[styles.currencySymbol, { color: config.color }]}>₹</Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  color: config.color,
                },
              ]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Narration */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Narration (Optional)</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radius.md,
              },
            ]}
            value={narration}
            onChangeText={setNarration}
            placeholder={config.narrationPlaceholder}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            padding: spacing.md,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: config.color, borderRadius: radius.md }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{config.buttonText}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '900',
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '900',
    padding: 0,
  },
  footer: {
    borderTopWidth: 1,
  },
  saveButton: {
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
