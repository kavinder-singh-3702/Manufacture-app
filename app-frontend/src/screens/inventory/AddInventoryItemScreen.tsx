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
import * as FileSystem from "expo-file-system";
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
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

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
      setCategories((res.categories || []).map((c) => ({
        ...c,
        subCategories: c.subCategories,
      })));
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

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.category),
    [categories, formData.category]
  );

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

  const assetToLocalImage = useCallback(
    async (asset: ImagePicker.ImagePickerAsset): Promise<LocalImage | null> => {
      try {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const fileName = asset.fileName || asset.uri.split("/").pop() || `image-${Date.now()}.jpg`;
        const mimeType = asset.mimeType || "image/jpeg";

        return {
          uri: asset.uri,
          base64,
          fileName,
          mimeType,
        };
      } catch (err: any) {
        console.warn("Image read failed", err?.message || err);
        toastError("Add image failed", "Could not read image data");
        return null;
      }
    },
    [toastError]
  );

  const pickImages = useCallback(
    async (options?: { allowMultiple?: boolean }): Promise<LocalImage[]> => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow photo library access to add product images.");
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsMultipleSelection: options?.allowMultiple || false,
      });

      if (result.canceled || !result.assets?.length) return [];

      const mapped: LocalImage[] = [];
      for (const asset of result.assets) {
        const img = await assetToLocalImage(asset);
        if (img) mapped.push(img);
      }

      return mapped;
    },
    [assetToLocalImage]
  );

  const handlePickCover = useCallback(async () => {
    const imgs = await pickImages({ allowMultiple: false });
    if (imgs[0]) setCoverImage(imgs[0]);
  }, [pickImages]);

  const handleAddGalleryImage = useCallback(async () => {
    const imgs = await pickImages({ allowMultiple: true });
    if (imgs.length) setGalleryImages((prev) => [...prev, ...imgs]);
  }, [pickImages]);

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
                required
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

            <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.sm }]}>
              More photos (multi-select)
            </Text>
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
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              You can pick multiple gallery photos at once. Cover photo is chosen separately.
            </Text>
          </View>

          {/* Category Selection */}
          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginTop: spacing.lg,
              },
            ]}
          >
            <View style={styles.groupHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupTitle, { color: colors.text }]}>Classification</Text>
                <Text style={[styles.groupSubtitle, { color: colors.textMuted }]}>
                  Pick where this item lives so search and filters stay tidy.
                </Text>
              </View>
              <View
                style={[
                  styles.badgePill,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceElevated || colors.surface,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.text }]}>Required</Text>
              </View>
            </View>

            {errors.category ? (
              <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.xs }]}>{errors.category}</Text>
            ) : null}

            <Text style={[styles.label, { color: colors.textMuted }]}>
              Category<Text style={{ color: "#FF6B6B" }}> *</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryDropdown((prev) => !prev)}
              activeOpacity={0.9}
              style={[
                styles.selectInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceElevated || colors.surface,
                  borderRadius: radius.md,
                  marginTop: 8,
                },
              ]}
            >
              <View>
                <Text style={[styles.selectValue, { color: formData.category ? colors.text : colors.textMuted }]}>
                  {formData.category
                    ? categories.find((c) => c.id === formData.category)?.title || formData.category
                    : "Select a category"}
                </Text>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>Drives browsing, alerts, and reporting</Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>▾</Text>
            </TouchableOpacity>

            {showCategoryDropdown && (
              <View
                style={[
                  styles.dropdown,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    marginTop: spacing.sm,
                  },
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
                      backgroundColor: colors.surfaceElevated || colors.surface,
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
                              backgroundColor: isSelected ? colors.primary + "14" : "transparent",
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

            <View style={{ marginTop: spacing.md }}>
              <InputField
                label="Sub-category"
                placeholder="e.g., Carrots, Fasteners, Polybags"
                value={formData.subCategory || ""}
                onChangeText={(text) => updateField("subCategory", text)}
                errorText={errors.subCategory}
                required
                helperText="Add the aisle or variant label customers expect."
              />
            </View>

            {selectedCategory?.subCategories?.length ? (
              <View style={{ marginTop: spacing.xs, marginBottom: spacing.sm, gap: spacing.xs }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Suggested sub-categories</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {selectedCategory.subCategories.map((sub) => {
                    const isActive = formData.subCategory?.toLowerCase() === sub.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => updateField("subCategory", sub)}
                        style={[
                          styles.unitChip,
                          {
                            marginVertical: 4,
                            backgroundColor: isActive ? colors.primary + "15" : colors.surface,
                            borderColor: isActive ? colors.primary : colors.border,
                            borderRadius: radius.sm,
                          },
                        ]}
                      >
                        <Text style={[styles.unitText, { color: isActive ? colors.primary : colors.text }]}>{sub}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}
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
                    required
                  />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Unit<Text style={{ color: "#FF6B6B" }}> *</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowUnitDropdown((prev) => !prev)}
                activeOpacity={0.85}
                style={[
                  styles.selectInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text style={[styles.selectValue, { color: colors.text }]}>{formData.unit || "Select unit"}</Text>
                <Text style={{ color: colors.textMuted }}>▾</Text>
              </TouchableOpacity>
              {showUnitDropdown && (
                <View
                  style={[
                    styles.dropdown,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceElevated || colors.surface,
                      borderRadius: radius.md,
                      marginTop: 6,
                    },
                  ]}
                >
                  {UNITS.map((unit) => {
                    const isSelected = formData.unit === unit;
                    return (
                      <TouchableOpacity
                        key={unit}
                        onPress={() => {
                          updateField("unit", unit);
                          setShowUnitDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          {
                            backgroundColor: isSelected ? colors.primary + "12" : "transparent",
                          },
                        ]}
                      >
                        <Text style={{ color: colors.text, fontWeight: isSelected ? "800" : "600" }}>{unit}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <Text style={[styles.helperText, { color: colors.textMuted }]}>
                Units drive pricing math and inventory insights.
              </Text>
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
                  required
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
  groupCard: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  groupSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  badgePill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  selectInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  selectValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
