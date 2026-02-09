/**
 * DEBUG VERSION OF STATS SCREEN
 *
 * Use this to test if the accounting service is working.
 * Replace StatsScreen with this temporarily to see debug info.
 *
 * To use:
 * 1. In your navigator, import this instead of StatsScreen
 * 2. Navigate to the Stats screen
 * 3. You'll see debug info about the API calls
 */

import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { accountingService, DashboardData } from "../services/accounting.service";
import { useTheme } from "../hooks/useTheme";

export const StatsScreenDebug = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [accountingData, setAccountingData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔍 DEBUG: Starting to fetch accounting data...");
      try {
        const data = await accountingService.getDashboard();
        console.log("✅ DEBUG: Accounting data received:", data);
        setAccountingData(data);
        setError(null);
      } catch (err: any) {
        console.error("❌ DEBUG: Error fetching accounting data:", err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.text, marginTop: 16 }]}>
            Fetching accounting data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          🔍 Stats Screen Debug
        </Text>

        {error && (
          <View style={[styles.card, { backgroundColor: colors.error + "20", borderColor: colors.error }]}>
            <Text style={[styles.cardTitle, { color: colors.error }]}>❌ Error</Text>
            <Text style={[styles.text, { color: colors.text }]}>{error}</Text>
            <Text style={[styles.hint, { color: colors.textMuted, marginTop: 8 }]}>
              This is expected if:
              {"\n"}- You're not logged in
              {"\n"}- No active company selected
              {"\n"}- Accounting books not set up
            </Text>
          </View>
        )}

        {accountingData && (
          <>
            <View style={[styles.card, { backgroundColor: colors.success + "20", borderColor: colors.success }]}>
              <Text style={[styles.cardTitle, { color: colors.success }]}>✅ Success!</Text>
              <Text style={[styles.text, { color: colors.text }]}>
                Accounting data loaded successfully!
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>📊 Financial Data</Text>
              <View style={styles.dataRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Sales:</Text>
                <Text style={[styles.value, { color: colors.text }]}>₹{accountingData.sales.toLocaleString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Purchases:</Text>
                <Text style={[styles.value, { color: colors.text }]}>₹{accountingData.purchases.toLocaleString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Gross Profit:</Text>
                <Text style={[styles.value, { color: colors.text }]}>₹{accountingData.grossProfit.toLocaleString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Cash Balance:</Text>
                <Text style={[styles.value, { color: colors.text }]}>₹{accountingData.cashBalance.toLocaleString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Receivables:</Text>
                <Text style={[styles.value, { color: colors.text }]}>₹{accountingData.receivables.toLocaleString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Payables:</Text>
                <Text style={[styles.value, { color: colors.text }]}>₹{accountingData.payables.toLocaleString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Stock Value:</Text>
                <Text style={[styles.value, { color: colors.text }]}>₹{accountingData.stockValue.toLocaleString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Stock Quantity:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {accountingData.stockQuantity.toLocaleString()} units
                </Text>
              </View>
            </View>

            {accountingData.lowStockProducts && accountingData.lowStockProducts.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  ⚠️ Low Stock Products ({accountingData.lowStockProducts.length})
                </Text>
                {accountingData.lowStockProducts.slice(0, 3).map((product, index) => (
                  <Text key={product._id} style={[styles.text, { color: colors.text, marginTop: 4 }]}>
                    {index + 1}. {product.name} ({product.availableQuantity}/{product.minStockQuantity})
                  </Text>
                ))}
              </View>
            )}

            {accountingData.topItems && accountingData.topItems.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  🏆 Top Items ({accountingData.topItems.length})
                </Text>
                {accountingData.topItems.slice(0, 3).map((item, index) => (
                  <Text key={index} style={[styles.text, { color: colors.text, marginTop: 4 }]}>
                    {index + 1}. Qty: {item.qtyOut.toFixed(2)} - Value: ₹{item.costValue.toLocaleString()}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}

        {!error && !accountingData && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>ℹ️ No Data</Text>
            <Text style={[styles.text, { color: colors.text }]}>
              No accounting data returned (but no error either).
              {"\n\n"}This might mean the accounting module is set up but has no transactions yet.
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>📝 Next Steps</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            {accountingData
              ? "✅ Integration working! Now go back to the regular Stats screen to see the UI."
              : "❌ Fix the error above, then try again."}
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted, marginTop: 8 }]}>
            Check the console/terminal for detailed logs
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
  },
});
