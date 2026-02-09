/**
 * EXACT API DATA DISPLAY SCREEN
 *
 * This screen fetches and displays EXACTLY what the backend API returns.
 * Use this to verify data structure and ensure frontend types match backend.
 *
 * To use: Temporarily replace StatsScreen with this in your navigator
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { accountingService } from "../services/accounting.service";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

export const StatsScreenExactAPI = () => {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiCallTime, setApiCallTime] = useState<number>(0);

  const fetchData = async () => {
    console.log("━".repeat(80));
    console.log("🚀 FETCHING ACCOUNTING DASHBOARD DATA");
    console.log("━".repeat(80));
    console.log("User:", user?.email);
    console.log("Company:", user?.activeCompany);
    console.log("Timestamp:", new Date().toISOString());
    console.log("");

    const startTime = Date.now();

    try {
      setError(null);

      const data = await accountingService.getDashboard();

      const endTime = Date.now();
      setApiCallTime(endTime - startTime);

      console.log("✅ API RESPONSE RECEIVED");
      console.log("Time taken:", endTime - startTime, "ms");
      console.log("");
      console.log("📦 RAW RESPONSE:");
      console.log(JSON.stringify(data, null, 2));
      console.log("");

      // Analyze the response structure
      console.log("📋 RESPONSE STRUCTURE:");
      console.log("─".repeat(80));
      Object.entries(data).forEach(([key, value]) => {
        const type = Array.isArray(value)
          ? `Array[${value.length}]`
          : value === null
          ? "null"
          : typeof value === "object"
          ? "Object"
          : typeof value;

        console.log(`${key.padEnd(20)} : ${type}`);

        if (Array.isArray(value) && value.length > 0) {
          console.log(`  └─ First item:`, JSON.stringify(value[0], null, 4));
        } else if (typeof value === "object" && value !== null) {
          console.log(`  └─ Keys:`, Object.keys(value).join(", "));
        } else {
          console.log(`  └─ Value:`, value);
        }
      });
      console.log("─".repeat(80));
      console.log("");

      setRawResponse(data);
    } catch (err: any) {
      console.error("❌ API ERROR:");
      console.error(err);
      console.error("");
      setError(err.message || String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderValue = (value: any, indent: number = 0): JSX.Element => {
    const indentSpacing = "  ".repeat(indent);

    if (value === null) {
      return <Text style={[styles.valueNull, { color: colors.textMuted }]}>null</Text>;
    }

    if (value === undefined) {
      return <Text style={[styles.valueNull, { color: colors.textMuted }]}>undefined</Text>;
    }

    if (typeof value === "boolean") {
      return <Text style={[styles.valueBoolean, { color: colors.primary }]}>{String(value)}</Text>;
    }

    if (typeof value === "number") {
      return <Text style={[styles.valueNumber, { color: colors.success }]}>{value.toLocaleString()}</Text>;
    }

    if (typeof value === "string") {
      return <Text style={[styles.valueString, { color: colors.text }]}>"{value}"</Text>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <Text style={[styles.valueArray, { color: colors.textMuted }]}>[ ] (empty)</Text>;
      }

      return (
        <View style={{ marginLeft: indent * 10 }}>
          <Text style={[styles.valueArray, { color: colors.textSecondary }]}>
            Array[{value.length}]:
          </Text>
          {value.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.arrayItem}>
              <Text style={[styles.arrayIndex, { color: colors.textMuted }]}>[{index}]</Text>
              {renderValue(item, indent + 1)}
            </View>
          ))}
          {value.length > 3 && (
            <Text style={[styles.arrayMore, { color: colors.textMuted }]}>
              ... and {value.length - 3} more items
            </Text>
          )}
        </View>
      );
    }

    if (typeof value === "object") {
      return (
        <View style={{ marginLeft: indent * 10 }}>
          <Text style={[styles.valueObject, { color: colors.textSecondary }]}>
            {"{"}
          </Text>
          {Object.entries(value).map(([key, val], index) => (
            <View key={index} style={styles.objectRow}>
              <Text style={[styles.objectKey, { color: colors.primary }]}>{key}: </Text>
              {renderValue(val, indent + 1)}
            </View>
          ))}
          <Text style={[styles.valueObject, { color: colors.textSecondary }]}>
            {"}"}
          </Text>
        </View>
      );
    }

    return <Text style={{ color: colors.text }}>{String(value)}</Text>;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.text, marginTop: 16 }]}>
            Fetching exact API data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>🔍 Exact API Response</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            /api/accounting/reports/dashboard
          </Text>
          {apiCallTime > 0 && (
            <Text style={[styles.timing, { color: colors.textMuted }]}>
              Response time: {apiCallTime}ms
            </Text>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View
            style={[
              styles.errorCard,
              { backgroundColor: colors.error + "20", borderColor: colors.error },
            ]}
          >
            <Text style={[styles.errorTitle, { color: colors.error }]}>❌ Error</Text>
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <View style={styles.errorHelp}>
              <Text style={[styles.errorHelpText, { color: colors.textMuted }]}>
                Common causes:
                {"\n"}• Not logged in or token expired
                {"\n"}• No active company selected
                {"\n"}• Accounting books not initialized
                {"\n"}• Backend server not running
              </Text>
            </View>
          </View>
        )}

        {/* Success Display */}
        {rawResponse && (
          <>
            {/* Summary Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.success + "15", borderColor: colors.success },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.success }]}>✅ API Call Success</Text>
              <Text style={[styles.cardText, { color: colors.text }]}>
                Data structure matches backend response
              </Text>
            </View>

            {/* Field Count */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>📊 Response Overview</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {Object.keys(rawResponse).length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Fields</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {rawResponse.lowStockProducts?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Low Stock</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {rawResponse.topItems?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Top Items</Text>
                </View>
              </View>
            </View>

            {/* Raw Response Display */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>📦 Raw Data Structure</Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Exactly as received from backend API
              </Text>

              <View style={[styles.codeBlock, { backgroundColor: colors.backgroundSecondary }]}>
                {Object.entries(rawResponse).map(([key, value], index) => (
                  <View key={index} style={styles.field}>
                    <Text style={[styles.fieldKey, { color: colors.primary }]}>{key}:</Text>
                    <View style={styles.fieldValue}>{renderValue(value)}</View>
                  </View>
                ))}
              </View>
            </View>

            {/* Type Verification */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>🔍 Type Analysis</Text>
              <View style={styles.typeList}>
                {Object.entries(rawResponse).map(([key, value], index) => {
                  const type = Array.isArray(value)
                    ? `Array[${value.length}]`
                    : value === null
                    ? "null"
                    : typeof value === "object"
                    ? "Object"
                    : typeof value;

                  const typeColor =
                    type.startsWith("Array") || type === "Object"
                      ? colors.warning
                      : type === "number"
                      ? colors.success
                      : type === "string"
                      ? colors.primary
                      : colors.textMuted;

                  return (
                    <View key={index} style={styles.typeRow}>
                      <Text style={[styles.typeName, { color: colors.text }]}>{key}</Text>
                      <Text style={[styles.typeValue, { color: typeColor, backgroundColor: typeColor + "20" }]}>
                        {type}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* JSON Export */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>📋 JSON Export</Text>
              <Text style={[styles.hint, { color: colors.textMuted, marginBottom: 8 }]}>
                Copy this to verify exact structure
              </Text>
              <View style={[styles.jsonBlock, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.jsonText, { color: colors.text }]} selectable>
                  {JSON.stringify(rawResponse, null, 2)}
                </Text>
              </View>
            </View>

            {/* Console Note */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.primary + "15", borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.primary }]}>💡 Check Console</Text>
              <Text style={[styles.cardText, { color: colors.text }]}>
                Detailed logs have been printed to console with full response structure and field analysis.
              </Text>
            </View>
          </>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.primary }]}
          onPress={onRefresh}
          activeOpacity={0.8}
        >
          <Text style={[styles.refreshButtonText, { color: "#fff" }]}>🔄 Refresh Data</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  timing: {
    fontSize: 11,
    fontWeight: "500",
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
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
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    marginBottom: 12,
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  errorHelp: {
    marginTop: 8,
  },
  errorHelpText: {
    fontSize: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  codeBlock: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  field: {
    marginBottom: 12,
  },
  fieldKey: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  fieldValue: {
    marginLeft: 8,
  },
  valueNull: {
    fontSize: 13,
    fontStyle: "italic",
  },
  valueBoolean: {
    fontSize: 13,
    fontWeight: "600",
  },
  valueNumber: {
    fontSize: 13,
    fontWeight: "700",
  },
  valueString: {
    fontSize: 13,
  },
  valueArray: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  arrayItem: {
    flexDirection: "row",
    marginLeft: 12,
    marginBottom: 4,
  },
  arrayIndex: {
    fontSize: 12,
    marginRight: 8,
  },
  arrayMore: {
    fontSize: 12,
    marginLeft: 12,
    marginTop: 4,
  },
  valueObject: {
    fontSize: 13,
    fontWeight: "600",
  },
  objectRow: {
    flexDirection: "row",
    marginLeft: 12,
    marginBottom: 2,
  },
  objectKey: {
    fontSize: 13,
    fontWeight: "600",
  },
  typeList: {
    marginTop: 8,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  typeName: {
    fontSize: 14,
    fontWeight: "600",
  },
  typeValue: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  jsonBlock: {
    padding: 12,
    borderRadius: 8,
    maxHeight: 300,
  },
  jsonText: {
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  refreshButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
