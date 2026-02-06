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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { tallyService, VoucherItemLine } from '../../services/tally.service';

export const PurchaseBillScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [items, setItems] = useState<VoucherItemLine[]>([
    {
      product: '',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      tax: { gstRate: 18, gstType: 'cgst_sgst' },
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        product: '',
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
        tax: { gstRate: 18, gstType: 'cgst_sgst' },
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof VoucherItemLine, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate amount
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    items.forEach((item) => {
      const itemAmount = item.quantity * item.rate;
      subtotal += itemAmount;
      if (item.tax?.gstRate) {
        taxTotal += (itemAmount * item.tax.gstRate) / 100;
      }
    });

    return {
      subtotal,
      taxTotal,
      total: subtotal + taxTotal,
    };
  };

  const handleSave = async () => {
    // Validation
    if (!supplierName.trim()) {
      Alert.alert('Error', 'Please enter supplier name');
      return;
    }

    if (items.some((item) => !item.description || item.quantity <= 0 || item.rate <= 0)) {
      Alert.alert('Error', 'Please fill all item details correctly');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create or get supplier party
      let partyId = supplierId;
      if (!partyId || partyId.length !== 24) {
        // Auto-create supplier party
        const party = await tallyService.createParty({
          name: supplierName,
          type: 'supplier',
        });
        partyId = party._id || party.id;
      }

      // Step 2: Create purchase bill voucher
      await tallyService.createPurchaseBill({
        partyId,
        date,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          tax: item.tax,
        })),
        narration: narration || `Purchase from ${supplierName}`,
      });

      Alert.alert('Success', 'Purchase Bill created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to create purchase bill:', error);
      Alert.alert('Error', error.message || 'Failed to create purchase bill');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>📥 Purchase Bill</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl }]}>
        {/* Supplier Details */}
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
            Supplier Details
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Supplier Name *</Text>
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
            value={supplierName}
            onChangeText={setSupplierName}
            placeholder="Enter supplier name"
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

        {/* Items */}
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
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.error, borderRadius: radius.md }]}
              onPress={addItem}
            >
              <Text style={styles.addButtonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemNumber, { color: colors.textMuted }]}>Item {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Text style={[styles.removeButton, { color: colors.error }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Description *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                    borderRadius: radius.md,
                  },
                ]}
                value={item.description}
                onChangeText={(text) => updateItem(index, 'description', text)}
                placeholder="Item description"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                        borderRadius: radius.md,
                      },
                    ]}
                    value={String(item.quantity)}
                    onChangeText={(text) => updateItem(index, 'quantity', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Rate *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                        borderRadius: radius.md,
                      },
                    ]}
                    value={String(item.rate)}
                    onChangeText={(text) => updateItem(index, 'rate', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.amountRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Amount:</Text>
                <Text style={[styles.amountValue, { color: colors.error }]}>₹{item.amount.toFixed(2)}</Text>
              </View>
            </View>
          ))}
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
            placeholder="Additional notes..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Totals */}
        <View
          style={[
            styles.totalsCard,
            {
              backgroundColor: colors.error + '15',
              borderColor: colors.error + '40',
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Subtotal:</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>₹{totals.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>GST (18%):</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>₹{totals.taxTotal.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Grand Total:</Text>
            <Text style={[styles.grandTotalValue, { color: colors.error }]}>₹{totals.total.toFixed(2)}</Text>
          </View>
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
          style={[styles.saveButton, { backgroundColor: colors.error, borderRadius: radius.md }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Purchase Bill</Text>
          )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  itemCard: {
    borderWidth: 1,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNumber: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalsCard: {
    borderWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.2)',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '900',
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
