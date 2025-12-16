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
import { productService, CreateProductInput } from "../../services/product.service";
import { RootStackParamList } from "../../navigation/types";

const CATEGORIES = [
  { id: "finished-goods", title: "Finished Goods", icon: "📦" },
  { id: "components", title: "Components & Parts", icon: "🧩" },
  { id: "raw-materials", title: "Raw Materials", icon: "🧱" },
  { id: "machinery", title: "Machinery & Equipment", icon: "⚙️" },
  { id: "packaging", title: "Packaging", icon: "🎁" },
  { id: "services", title: "Services", icon: "🛠️" },
  { id: "other", title: "Other", icon: "🗂️" },
];

const UNITS = ["units", "pieces", "kg", "liters", "meters", "boxes", "pallets"];

export const AddProductScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductInput>({
    name: "",
    description: "",
    sku: "",
    category: "",
    price: { amount: 0, currency: "INR", unit: "unit" },
    availableQuantity: 0,
    minStockQuantity: 0,
    unit: "units",
    visibility: "public",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback((field: keyof CreateProductInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const updatePriceField = useCallback((field: "amount" | "currency" | "unit", value: any) => {
    setFormData((prev) => ({
      ...prev,
      price: { ...prev.price, [field]: value },
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (formData.price.amount <= 0) {
      newErrors.price = "Price is required and must be greater than 0";
    }
    if (formData.availableQuantity === undefined || formData.availableQuantity <= 0) {
      newErrors.availableQuantity = "At least 1 item is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await productService.create(formData);
      Alert.alert("Success", "Product added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add product. Please try again.");
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Product</Text>
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
            label="Product Name"
            placeholder="Enter product name"
            value={formData.name}
            onChangeText={(text) => updateField("name", text)}
            errorText={errors.name}
          />

          <InputField
            label="Description"
            placeholder="Describe your product (optional)"
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
                label="Current Stock"
                placeholder="0"
                value={formData.availableQuantity === 0 ? "" : formData.availableQuantity?.toString() || ""}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  updateField("availableQuantity", cleaned === "" ? 0 : parseInt(cleaned, 10));
                }}
                keyboardType="numeric"
                errorText={errors.availableQuantity}
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

          {/* Pricing Section */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
            Pricing
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <InputField
                label="Price Amount"
                placeholder="0.00"
                value={formData.price.amount === 0 ? "" : formData.price.amount.toString()}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  updatePriceField("amount", cleaned === "" ? 0 : parseFloat(cleaned) || 0);
                }}
                keyboardType="decimal-pad"
                errorText={errors.price}
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <InputField
                label="Currency"
                placeholder="INR"
                value={formData.price.currency || "INR"}
                onChangeText={(text) => updatePriceField("currency", text.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={{ marginTop: spacing.xl }}>
            <Button
              label={loading ? "Adding..." : "Add Product"}
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
