import { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { inventoryService, CreateInventoryItemInput } from "../../services/inventory.service";
import { RootStackParamList } from "../../navigation/types";

// Category options matching backend
const CATEGORIES = [
  { id: "raw-materials", title: "Raw Materials", icon: "🧱" },
  { id: "packaging", title: "Packaging & Supplies", icon: "📦" },
  { id: "machinery", title: "Machinery Parts", icon: "⚙️" },
  { id: "safety", title: "Safety Equipment", icon: "🦺" },
  { id: "chemicals", title: "Chemicals & Solvents", icon: "🧪" },
  { id: "tools", title: "Tools & Hardware", icon: "🔧" },
];

const UNITS = ["pieces", "kg", "liters", "meters", "boxes", "pallets", "units"];

export const AddInventoryItemScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateInventoryItemInput>({
    name: "",
    description: "",
    sku: "",
    category: "",
    quantity: 0,
    unit: "pieces",
    minStockLevel: 10,
    costPrice: 0,
    sellingPrice: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback((field: keyof CreateInventoryItemInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Item name is required";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (formData.quantity < 0) {
      newErrors.quantity = "Quantity cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await inventoryService.createItem(formData);
      Alert.alert("Success", "Inventory item added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [formData, navigation, validate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, padding: spacing.lg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Inventory Item</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Basic Info Section */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
            Basic Information
          </Text>

          <InputField
            label="Item Name"
            placeholder="Enter item name"
            value={formData.name}
            onChangeText={(text) => updateField("name", text)}
            errorText={errors.name}
          />

          <InputField
            label="Description"
            placeholder="Enter item description (optional)"
            value={formData.description}
            onChangeText={(text) => updateField("description", text)}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          <InputField
            label="SKU / Item Code"
            placeholder="Enter SKU (optional)"
            value={formData.sku}
            onChangeText={(text) => updateField("sku", text.toUpperCase())}
            autoCapitalize="characters"
          />

          {/* Category Selection */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
            Category
          </Text>
          {errors.category && (
            <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}>
              {errors.category}
            </Text>
          )}
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = formData.category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => updateField("category", cat.id)}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: isSelected ? colors.primary + "20" : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: radius.md,
                      padding: spacing.md,
                    },
                  ]}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryTitle,
                      { color: isSelected ? colors.primary : colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quantity Section */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
            Stock Details
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <InputField
                label="Quantity"
                placeholder="0"
                value={formData.quantity === 0 ? "" : formData.quantity.toString()}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  updateField("quantity", cleaned === "" ? 0 : parseInt(cleaned, 10));
                }}
                keyboardType="numeric"
                errorText={errors.quantity}
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Unit</Text>
              <View style={[styles.unitSelector, { borderRadius: radius.md, marginTop: 8 }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {UNITS.map((unit) => {
                    const isSelected = formData.unit === unit;
                    return (
                      <TouchableOpacity
                        key={unit}
                        onPress={() => updateField("unit", unit)}
                        style={[
                          styles.unitChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderRadius: radius.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitText,
                            { color: isSelected ? "#fff" : colors.textSecondary },
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>

          <InputField
            label="Minimum Stock Level"
            placeholder="10"
            value={formData.minStockLevel === 0 ? "" : formData.minStockLevel?.toString() || ""}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "");
              updateField("minStockLevel", cleaned === "" ? 0 : parseInt(cleaned, 10));
            }}
            keyboardType="numeric"
            helperText="Alert when stock falls below this level"
          />

          {/* Pricing Section */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
            Pricing (Optional)
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <InputField
                label="Cost Price (₹)"
                placeholder="0.00"
                value={formData.costPrice === 0 ? "" : formData.costPrice?.toString() || ""}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  updateField("costPrice", cleaned === "" ? 0 : parseFloat(cleaned) || 0);
                }}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <InputField
                label="Selling Price (₹)"
                placeholder="0.00"
                value={formData.sellingPrice === 0 ? "" : formData.sellingPrice?.toString() || ""}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  updateField("sellingPrice", cleaned === "" ? 0 : parseFloat(cleaned) || 0);
                }}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={{ marginTop: spacing.xl }}>
            <Button
              label={loading ? "Adding..." : "Add Item"}
              onPress={handleSubmit}
              disabled={loading}
              variant="primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "30%",
    alignItems: "center",
    borderWidth: 1.5,
    minHeight: 90,
    justifyContent: "center",
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  unitSelector: {
    marginBottom: 16,
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
  },
  unitText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
