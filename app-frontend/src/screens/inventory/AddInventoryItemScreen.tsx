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
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../hooks/useTheme";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { productService, CreateProductInput, ProductCategory, Product } from "../../services/product.service";
import { ProductVariant, ProductVariantUpsertInput, productVariantService } from "../../services/productVariant.service";
import { RootStackParamList } from "../../navigation/types";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../services/http";
import { VariantFormSheet } from "./components/VariantFormSheet";
import { FormStepIndicator } from "./components/FormStepIndicator";
import { syncProductFromVariants, variantDisplayLabel } from "./components/variantDomain";

const UNITS = ["units", "pieces", "kg", "liters", "meters", "boxes", "pallets"];

type LocalImage = { uri: string; base64: string; fileName: string; mimeType: string };
type DraftVariant = ProductVariantUpsertInput & { tempId: string };

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const createDraftId = () => `draft-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const toVariantEntity = (draft: DraftVariant): ProductVariant => ({
  _id: draft.tempId,
  product: "",
  company: "",
  title: draft.title,
  sku: draft.sku,
  barcode: draft.barcode,
  options: (draft.options || {}) as Record<string, unknown>,
  price: draft.price || null,
  minStockQuantity: Number(draft.minStockQuantity || 0),
  availableQuantity: Number(draft.availableQuantity || 0),
  unit: draft.unit,
  status: draft.status || "active",
  attributes: draft.attributes,
  metadata: draft.metadata,
  createdAt: "",
  updatedAt: "",
});

const draftPriceLabel = (variant: DraftVariant) => {
  const amount = Number(variant.price?.amount || 0);
  const currency = variant.price?.currency || "INR";
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${amount.toLocaleString("en-IN")}`;
};

export const AddProductScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { success: toastSuccess, error: toastError } = useToast();
  const surfaceElevated = (colors as any).surfaceElevated || colors.surface;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [coverImage, setCoverImage] = useState<LocalImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<LocalImage[]>([]);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [variantDrafts, setVariantDrafts] = useState<DraftVariant[]>([]);
  const [variantSheetVisible, setVariantSheetVisible] = useState(false);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);
  const [savingDraftVariant, setSavingDraftVariant] = useState(false);

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

  const updateField = useCallback(
    (field: keyof CreateProductInput, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

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
      setCategories(
        (res.categories || []).map((c) => ({
          ...c,
          subCategories: c.subCategories,
        }))
      );
    } catch (err) {
      console.warn("Failed to load categories", (err as any)?.message || err);
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

  const selectedCategory = useMemo(() => categories.find((c) => c.id === formData.category), [categories, formData.category]);

  const validateStepOne = useCallback(() => {
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
    if (Number(formData.price.amount || 0) <= 0) {
      newErrors.price = "Price is required and must be greater than 0";
    }
    if (formData.availableQuantity !== undefined && Number(formData.availableQuantity) < 0) {
      newErrors.availableQuantity = "Quantity cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const assetToLocalImage = useCallback(
    (asset: ImagePicker.ImagePickerAsset): LocalImage | null => {
      if (!asset.base64) {
        toastError("Add image failed", "Could not read image data");
        return null;
      }

      const fileName = asset.fileName || asset.uri.split("/").pop() || `image-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || "image/jpeg";

      return {
        uri: asset.uri,
        base64: asset.base64,
        fileName,
        mimeType,
      };
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
        base64: true,
        exif: false,
      });

      if (result.canceled || !result.assets?.length) return [];

      const mapped: LocalImage[] = [];
      for (const asset of result.assets) {
        const img = assetToLocalImage(asset);
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

  const openCreateVariant = useCallback(() => {
    setEditingDraftIndex(null);
    setVariantSheetVisible(true);
  }, []);

  const openEditVariant = useCallback((index: number) => {
    setEditingDraftIndex(index);
    setVariantSheetVisible(true);
  }, []);

  const closeVariantSheet = useCallback(() => {
    setVariantSheetVisible(false);
    setEditingDraftIndex(null);
  }, []);

  const removeVariantDraft = useCallback((index: number) => {
    Alert.alert("Remove variant", "Delete this draft variant?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setVariantDrafts((prev) => prev.filter((_, idx) => idx !== index));
        },
      },
    ]);
  }, []);

  const saveDraftVariant = useCallback(
    async (payload: ProductVariantUpsertInput) => {
      if (!Object.keys(payload.options || {}).length) {
        toastError("Variant options required", "Add at least one option like Size or Pack.");
        return;
      }
      setSavingDraftVariant(true);
      try {
        setVariantDrafts((prev) => {
          if (editingDraftIndex === null) {
            return [...prev, { tempId: createDraftId(), ...payload }];
          }
          return prev.map((item, idx) => (idx === editingDraftIndex ? { ...item, ...payload } : item));
        });
        closeVariantSheet();
      } finally {
        setSavingDraftVariant(false);
      }
    },
    [closeVariantSheet, editingDraftIndex, toastError]
  );

  const currentEditingVariant = useMemo(
    () =>
      editingDraftIndex === null || !variantDrafts[editingDraftIndex]
        ? null
        : toVariantEntity(variantDrafts[editingDraftIndex]),
    [editingDraftIndex, variantDrafts]
  );

  const variantStats = useMemo(() => {
    const totalStock = variantDrafts.reduce((sum, draft) => sum + Number(draft.availableQuantity || 0), 0);
    const minStock = variantDrafts.reduce((sum, draft) => sum + Number(draft.minStockQuantity || 0), 0);
    const prices = variantDrafts
      .map((draft) => Number(draft.price?.amount))
      .filter((value) => Number.isFinite(value) && value >= 0);

    return {
      totalStock,
      minStock,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
    };
  }, [variantDrafts]);

  const animateToStep = useCallback((nextStep: 1 | 2) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(nextStep);
  }, []);

  const handleContinueToVariants = useCallback(() => {
    if (!validateStepOne()) return;
    animateToStep(2);
  }, [animateToStep, validateStepOne]);

  const handleSubmit = useCallback(async () => {
    if (!validateStepOne()) {
      animateToStep(1);
      return;
    }

    setLoading(true);
    try {
      const created: Product = await productService.create(formData);

      if (variantDrafts.length) {
        for (const draft of variantDrafts) {
          const { tempId: _tempId, ...payload } = draft;
          await productVariantService.create(created._id, payload);
        }
        await syncProductFromVariants(created._id, "company");
      }

      let uploadIssue: string | null = null;
      try {
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
      }

      toastSuccess(
        variantDrafts.length ? "Product and variants added" : "Product added",
        String(formData.name || "Created successfully")
      );

      navigation.replace("ProductDetails", { productId: created._id });
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
  }, [
    animateToStep,
    coverImage,
    formData,
    galleryImages,
    navigation,
    toastError,
    toastSuccess,
    validateStepOne,
    variantDrafts,
  ]);

  const renderStepOne = () => (
    <>
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Basic Information</Text>

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

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>Photos</Text>
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

        <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.sm }]}>More photos (multi-select)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {galleryImages.map((img, idx) => (
            <View key={`${img.fileName}-${idx}`} style={[styles.thumbWrap, { borderColor: colors.border, borderRadius: radius.sm }]}>
              <Image source={{ uri: img.uri }} style={[styles.thumb, { borderRadius: radius.sm }]} />
              <TouchableOpacity onPress={() => removeGalleryImage(idx)} style={styles.removeThumb} hitSlop={8}>
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
      </View>

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
            <Text style={[styles.groupSubtitle, { color: colors.textMuted }]}>Set category and sub-category for clean discovery.</Text>
          </View>
          <View
            style={[
              styles.badgePill,
              {
                borderColor: colors.border,
                backgroundColor: surfaceElevated,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.text }]}>Required</Text>
          </View>
        </View>

        {errors.category ? <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.xs }]}>{errors.category}</Text> : null}

        <Text style={[styles.label, { color: colors.textMuted }]}>Category<Text style={{ color: "#FF6B6B" }}> *</Text></Text>
        <TouchableOpacity
          onPress={() => setShowCategoryDropdown((prev) => !prev)}
          activeOpacity={0.9}
          style={[
            styles.selectInput,
            {
              borderColor: colors.border,
              backgroundColor: surfaceElevated,
              borderRadius: radius.md,
              marginTop: 8,
            },
          ]}
        >
          <View>
            <Text style={[styles.selectValue, { color: formData.category ? colors.text : colors.textMuted }]}>
              {formData.category ? categories.find((c) => c.id === formData.category)?.title || formData.category : "Select a category"}
            </Text>
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
                  backgroundColor: surfaceElevated,
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

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Stock Details</Text>

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
          <Text style={[styles.label, { color: colors.textMuted }]}>Unit<Text style={{ color: "#FF6B6B" }}> *</Text></Text>
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
                  backgroundColor: surfaceElevated,
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
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Pricing</Text>

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
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>Variants</Text>
      <Text style={[styles.stepHint, { color: colors.textMuted, marginBottom: spacing.md }]}>
        Add variants like size, pack, or grade. They will be created with the product and synced automatically.
      </Text>

      <View
        style={[
          styles.variantSummaryCard,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            marginBottom: spacing.md,
          },
        ]}
      >
        <View style={styles.variantStatRow}>
          <Text style={[styles.variantStatLabel, { color: colors.textMuted }]}>Draft variants</Text>
          <Text style={[styles.variantStatValue, { color: colors.text }]}>{variantDrafts.length}</Text>
        </View>
        <View style={styles.variantStatRow}>
          <Text style={[styles.variantStatLabel, { color: colors.textMuted }]}>Total stock from variants</Text>
          <Text style={[styles.variantStatValue, { color: colors.text }]}>{variantStats.totalStock.toLocaleString("en-IN")}</Text>
        </View>
        <View style={styles.variantStatRow}>
          <Text style={[styles.variantStatLabel, { color: colors.textMuted }]}>Price range</Text>
          <Text style={[styles.variantStatValue, { color: colors.text }]}>
            {variantStats.minPrice === null || variantStats.maxPrice === null
              ? "Not set"
              : `₹${variantStats.minPrice.toLocaleString("en-IN")} - ₹${variantStats.maxPrice.toLocaleString("en-IN")}`}
          </Text>
        </View>
      </View>

      {variantDrafts.length === 0 ? (
        <View
          style={[
            styles.emptyVariantCard,
            { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg },
          ]}
        >
          <Text style={[styles.emptyVariantTitle, { color: colors.text }]}>No variants added yet</Text>
          <Text style={[styles.emptyVariantSubtitle, { color: colors.textMuted }]}>You can skip this and create only the base product.</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {variantDrafts.map((draft, index) => {
            const stock = Number(draft.availableQuantity || 0);
            return (
              <View
                key={draft.tempId}
                style={[
                  styles.variantDraftCard,
                  { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md },
                ]}
              >
                <View style={styles.variantDraftHeader}>
                  <Text style={[styles.variantDraftTitle, { color: colors.text }]} numberOfLines={2}>
                    {draft.title?.trim() || variantDisplayLabel(toVariantEntity(draft))}
                  </Text>
                  <View style={styles.variantDraftActions}>
                    <TouchableOpacity onPress={() => openEditVariant(index)}>
                      <Text style={[styles.variantActionText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeVariantDraft(index)}>
                      <Text style={[styles.variantActionText, { color: colors.error }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.variantMeta, { color: colors.textMuted }]} numberOfLines={2}>
                  {Object.keys(draft.options || {}).length
                    ? Object.entries(draft.options || {}).map(([key, value]) => `${key}: ${String(value)}`).join(" • ")
                    : "No options"}
                </Text>

                <View style={styles.variantPillRow}>
                  <View style={[styles.variantPill, { borderColor: colors.border, backgroundColor: surfaceElevated }]}> 
                    <Text style={[styles.variantPillText, { color: colors.text }]}>Price {draftPriceLabel(draft)}</Text>
                  </View>
                  <View style={[styles.variantPill, { borderColor: colors.border, backgroundColor: surfaceElevated }]}> 
                    <Text style={[styles.variantPillText, { color: stock > 0 ? colors.success : colors.error }]}>Stock {stock}</Text>
                  </View>
                  <View style={[styles.variantPill, { borderColor: colors.border, backgroundColor: surfaceElevated }]}> 
                    <Text style={[styles.variantPillText, { color: colors.textMuted }]}>Min {Number(draft.minStockQuantity || 0)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        onPress={openCreateVariant}
        activeOpacity={0.9}
        style={[
          styles.addVariantButton,
          {
            borderColor: colors.primary,
            backgroundColor: colors.primary + "12",
            borderRadius: radius.md,
            marginTop: spacing.md,
          },
        ]}
      >
        <Text style={[styles.addVariantButtonText, { color: colors.primary }]}>+ Add variant</Text>
      </TouchableOpacity>

      <Text style={[styles.helperText, { color: colors.textMuted, marginTop: spacing.sm }]}>Variants are created in order and product stock/price is synced from active variants.</Text>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={[styles.header, { borderBottomColor: colors.border, padding: spacing.lg }]}> 
          <TouchableOpacity onPress={() => (step === 1 ? navigation.goBack() : animateToStep(1))}>
            <Text style={[styles.backButton, { color: colors.primary }]}>{step === 1 ? "← Back" : "← Product info"}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Product</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <FormStepIndicator
            currentStep={step}
            steps={[
              { title: "Product info", subtitle: "Core details" },
              { title: "Variants", subtitle: "Optional" },
            ]}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 170 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {step === 1 ? renderStepOne() : renderStepTwo()}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface, padding: spacing.md }]}> 
          {step === 2 ? (
            <View style={styles.footerRow}>
              <Button label="Back" onPress={() => animateToStep(1)} variant="secondary" style={{ flex: 1 }} />
              <Button
                label={loading ? "Creating..." : "Create product"}
                onPress={handleSubmit}
                disabled={loading}
                loading={loading}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <Button
              label="Continue to variants"
              onPress={handleContinueToVariants}
              disabled={loading}
              variant="primary"
            />
          )}
        </View>

        <VariantFormSheet
          visible={variantSheetVisible}
          variant={currentEditingVariant}
          onClose={closeVariantSheet}
          onSubmit={saveDraftVariant}
          loading={savingDraftVariant}
        />
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
    fontSize: 15,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  stepHint: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  groupCard: {
    borderWidth: 1,
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
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dropdown: { marginTop: 8, borderWidth: 1, padding: 10 },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8 },
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
  variantSummaryCard: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  variantStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  variantStatLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  variantStatValue: {
    fontSize: 13,
    fontWeight: "900",
  },
  emptyVariantCard: {
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  emptyVariantTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  emptyVariantSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  variantDraftCard: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  variantDraftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  variantDraftTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  variantDraftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  variantActionText: {
    fontSize: 12,
    fontWeight: "800",
  },
  variantMeta: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  variantPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  variantPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  variantPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  addVariantButton: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 46,
  },
  addVariantButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  footer: {
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
});

export default AddProductScreen;
