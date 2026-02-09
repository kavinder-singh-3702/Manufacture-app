import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { tallyService, VoucherItemLine } from '../../services/tally.service';
import { productService, type Product } from '../../services/product.service';

export const SalesInvoiceScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();

  type LineItem = VoucherItemLine & { productName?: string };

  const [loading, setLoading] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    {
      product: '',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      tax: { gstRate: 18, gstType: 'cgst_sgst' },
    },
  ]);

  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

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

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate amount
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setItems(newItems);
  };

  const loadProducts = useCallback(async (searchText: string) => {
    try {
      setProductsLoading(true);
      const resp = await productService.getAll({
        scope: 'company',
        search: searchText.trim() ? searchText.trim() : undefined,
        limit: 50,
      });
      setProductResults(resp.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProductResults([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!productPickerVisible) return;
    const t = setTimeout(() => {
      loadProducts(productSearch);
    }, 250);
    return () => clearTimeout(t);
  }, [loadProducts, productPickerVisible, productSearch]);

  const openProductPicker = (lineIndex: number) => {
    setActiveLineIndex(lineIndex);
    setProductSearch('');
    setProductPickerVisible(true);
    loadProducts('');
  };

  const selectProductForLine = (product: Product) => {
    if (activeLineIndex === null) return;
    const next = [...items];
    const current = next[activeLineIndex];
    const rate = product.price?.amount || 0;
    next[activeLineIndex] = {
      ...current,
      product: product._id,
      productName: product.name,
      description: current.description?.trim() ? current.description : product.name,
      rate,
      amount: (current.quantity || 0) * rate,
    };
    setItems(next);
    setProductPickerVisible(false);
    setActiveLineIndex(null);
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
    if (!partyName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    if (items.some((item) => !item.product || item.product.length !== 24 || item.quantity <= 0 || item.rate <= 0)) {
      Alert.alert('Error', 'Please select a product and fill quantity/rate for all items');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create or get customer party
      let customerPartyId = partyId;
      if (!customerPartyId || customerPartyId.length !== 24) {
        // Auto-create customer party
        const party = await tallyService.createParty({
          name: partyName,
          type: 'customer',
        });
        customerPartyId = party._id;
      }

      // Step 2: Create sales invoice voucher
      await tallyService.createSalesInvoice({
        partyId: customerPartyId,
        date,
        items: items.map((item) => ({
          product: item.product,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          discountAmount: item.discountAmount,
          amount: item.amount,
          tax: item.tax,
        })),
        narration: narration || `Invoice for ${partyName}`,
      });

      Alert.alert('Success', 'Sales Invoice created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      Alert.alert('Error', error.message || 'Failed to create invoice');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>📄 Sales Invoice</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl }]}>
        {/* Customer Details */}
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
            Customer Details
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Customer Name *</Text>
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
            placeholder="Enter customer name"
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
              style={[styles.addButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}
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

              <Text style={[styles.label, { color: colors.textSecondary }]}>Product *</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => openProductPicker(index)}
              >
                <Text style={{ color: item.productName ? colors.text : colors.textMuted, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                  {item.productName || 'Select product'}
                </Text>
                <Text style={{ color: colors.textMuted, fontWeight: '700', marginLeft: 10 }}>›</Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
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
                placeholder="Item description (optional)"
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
                <Text style={[styles.amountValue, { color: colors.primary }]}>
                  ₹{item.amount.toFixed(2)}
                </Text>
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
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '40',
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
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
              ₹{totals.total.toFixed(2)}
            </Text>
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
          style={[styles.saveButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Invoice</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Picker */}
      <Modal
        visible={productPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProductPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select product</Text>
              <TouchableOpacity onPress={() => setProductPickerVisible(false)} activeOpacity={0.8}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalSearch,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: radius.md,
                },
              ]}
              value={productSearch}
              onChangeText={setProductSearch}
              placeholder="Search products..."
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            {productsLoading ? (
              <View style={styles.modalCentered}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.modalMutedText, { color: colors.textMuted, marginTop: spacing.sm }]}>Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={productResults}
                keyExtractor={(p) => p._id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: p }) => (
                  <TouchableOpacity
                    onPress={() => selectProductForLine(p)}
                    activeOpacity={0.8}
                    style={[styles.productRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={[styles.productMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        {p.category?.replace(/-/g, " ")}  ·  {p.price?.amount ? `₹${p.price.amount.toLocaleString("en-IN")}` : "No price"}
                      </Text>
                    </View>
                    <Text style={[styles.productChevron, { color: colors.textMuted }]}>›</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.modalCentered}>
                    <Text style={[styles.modalMutedText, { color: colors.textMuted }]}>No products found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 20,
    justifyContent: 'center',
  },
  modalCard: {
    borderWidth: 1,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalClose: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSearch: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    margin: 14,
  },
  modalCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  modalMutedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
  },
  productMeta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  productChevron: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 10,
  },
});
