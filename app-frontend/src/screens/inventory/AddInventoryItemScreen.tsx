import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../hooks/useTheme";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { productService, CreateProductInput, ProductCategory, Product } from "../../services/product.service";
import { RootStackParamList } from "../../navigation/types";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../services/http";

const UNITS = ["units", "pieces", "kg", "liters", "meters", "boxes", "pallets"];
type LocalImage = { uri: string; base64: string; fileName: string; mimeType: string };

export const AddProductScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [coverImage, setCoverImage] = useState<LocalImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<LocalImage[]>([]);

  const [formData, setFormData] = useState<CreateProductInput>({
    name: "",
    description: "",
    sku: "",
    category: "",
    subCategory: "",
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

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await productService.getCategoryStats();
      setCategories(res.categories || []);
    } catch (err) {
      console.warn("Failed to load categories", err?.message || err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (!formData.subCategory?.trim()) {
      newErrors.subCategory = "Add a sub-category to help browsing";
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

  const pickImage = useCallback(async (): Promise<LocalImage | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo library access to add product images.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];
    if (!asset.base64) {
      toastError("Add image failed", "Could not read image data");
      return null;
    }

    const fileName = asset.fileName || `image-${Date.now()}.jpg`;
    const mimeType = asset.mimeType || "image/jpeg";

    return {
      uri: asset.uri,
      base64: asset.base64,
      fileName,
      mimeType,
    };
  }, [toastError]);

  const handlePickCover = useCallback(async () => {
    const img = await pickImage();
    if (img) setCoverImage(img);
  }, [pickImage]);

  const handleAddGalleryImage = useCallback(async () => {
    const img = await pickImage();
    if (img) setGalleryImages((prev) => [...prev, img]);
  }, [pickImage]);

  const removeGalleryImage = useCallback((index: number) => {
    setGalleryImages((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const created: Product = await productService.create(formData);

      let uploadIssue: string | null = null;
      try {
        // Upload cover first, then gallery to preserve order
        if (coverImage) {
          await productService.uploadImage(created._id, {
            fileName: coverImage.fileName,
            mimeType: coverImage.mimeType,
            content: coverImage.base64,
          });
        }
        if (galleryImages.length) {
          for (const img of galleryImages) {
            await productService.uploadImage(created._id, {
              fileName: img.fileName,
              mimeType: img.mimeType,
              content: img.base64,
            });
          }
        }
      } catch (uploadErr: any) {
        uploadIssue = uploadErr?.message || "Product saved, but images failed to upload";
      }

      if (uploadIssue) {
        toastError("Image upload issue", uploadIssue);
      } else {
        toastSuccess("Product added", String(formData.name || "Created successfully"));
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error: any) {
      const apiMessage =
        (error instanceof ApiError && (error.data as any)?.error) ||
        (error instanceof ApiError && (error.data as any)?.message) ||
        error?.message ||
        "Failed to add product. Please try again.";
      toastError("Add product failed", String(apiMessage));
    } finally {
      setLoading(false);
    }
  }, [formData, navigation, toastError, toastSuccess, validate]);

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

          {/* Images */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
            Photos
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Text style={[styles.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>Cover photo</Text>
            <TouchableOpacity
              onPress={handlePickCover}
              activeOpacity={0.9}
              style={[
                styles.coverPicker,
                { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md },
              ]}
            >
              {coverImage ? (
                <Image source={{ uri: coverImage.uri }} style={[styles.coverImage, { borderRadius: radius.md }]} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Text style={{ fontSize: 18, color: colors.textMuted }}>Add cover photo</Text>
                  <Text style={{ color: colors.textMuted }}>Recommended: clear pack shot</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.sm }]}>More photos</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {galleryImages.map((img, idx) => (
                <View key={idx} style={[styles.thumbWrap, { borderColor: colors.border, borderRadius: radius.sm }]}>
                  <Image source={{ uri: img.uri }} style={[styles.thumb, { borderRadius: radius.sm }]} />
                  <TouchableOpacity
                    onPress={() => removeGalleryImage(idx)}
                    style={styles.removeThumb}
                    hitSlop={8}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={handleAddGalleryImage}
                activeOpacity={0.85}
                style={[
                  styles.thumbAdd,
                  { borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface },
                ]}
              >
                <Text style={{ fontSize: 20, color: colors.textMuted }}>＋</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>Max size 5 MB each. First image becomes cover.</Text>
          </View>

          {/* Category Selection */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
            Category
          </Text>
          {errors.category && (
            <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.xs }]}>
              {errors.category}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => setShowCategoryDropdown((prev) => !prev)}
            activeOpacity={0.8}
            style={[
              styles.categorySelector,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            <Text style={{ color: formData.category ? colors.text : colors.textMuted, fontWeight: "700" }}>
              {formData.category ? categories.find((c) => c.id === formData.category)?.title || formData.category : "Select category"}
            </Text>
            <Text style={{ color: colors.textMuted }}>▾</Text>
          </TouchableOpacity>
          {showCategoryDropdown && (
            <View
              style={[
                styles.dropdown,
                { borderColor: colors.border, backgroundColor: colors.surfaceElevated || colors.surface, borderRadius: radius.md },
              ]}
            >
              <TextInput
                placeholder="Search categories"
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.categorySearch,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    borderRadius: radius.sm,
                    marginBottom: spacing.sm,
                    backgroundColor: colors.surface,
                  },
                ]}
              />
              {loadingCategories ? (
                <ActivityIndicator color={colors.primary} />
              ) : filteredCategories.length === 0 ? (
                <Text style={[styles.errorText, { color: colors.textMuted }]}>No categories match your search</Text>
              ) : (
                <ScrollView style={{ maxHeight: 220 }}>
                  {filteredCategories.map((cat) => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          updateField("category", cat.id);
                          setShowCategoryDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          {
                            backgroundColor: isSelected ? colors.primary + "20" : "transparent",
                          },
                        ]}
                      >
                        <Text style={{ color: colors.text, fontWeight: isSelected ? "800" : "600" }}>{cat.title}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          <InputField
            label="Sub-category"
            placeholder="e.g., Carrots, Fasteners, Polybags"
            value={formData.subCategory || ""}
            onChangeText={(text) => updateField("subCategory", text)}
            errorText={errors.subCategory}
          />

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
  categorySelector: { borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dropdown: { marginTop: 8, borderWidth: 1, padding: 10 },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8 },
  categoryTitle: { fontSize: 14, fontWeight: "700" },
  categorySearch: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
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
  coverPicker: {
    borderWidth: 1,
    overflow: "hidden",
    height: 180,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbAdd: {
    width: 72,
    height: 72,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  removeThumb: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
