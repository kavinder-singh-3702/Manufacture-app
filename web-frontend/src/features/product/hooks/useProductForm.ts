"use client";

/**
 * Single source of truth for product form state.
 *
 * Create and edit exist in three places now (the drawer, the full-page
 * `/dashboard/products/mine/new` and `/…/[id]/edit` routes) — this hook is
 * what keeps them from drifting: one FormState shape, one validation pass,
 * one `CreateProductInput` payload builder. Presentation lives in
 * `../components/ProductFormFields`; nothing here renders.
 */

import { useCallback, useState, type FormEvent } from "react";
import type { CreateProductInput, Product, ProductStatus, ProductVisibility } from "@/src/types/product";
import type { PendingImage } from "../components/ProductImageUploader";

/** One row of the free-form spec editor. `id` is a stable React key only — the actual data is the key/value pair. */
export type AttributeRow = { id: string; key: string; value: string };

// Suggested attribute keys — matches the labels utils/specs.ts knows how to
// render on the PDP (Additional Information + spec table), so sellers filling
// these in see them show up correctly on the product page.
export const SPEC_KEY_SUGGESTIONS = [
  "moq",
  "itemCode",
  "productionCapacity",
  "deliveryTime",
  "packagingDetails",
  "material",
  "color",
  "brand",
];

export const attributesToRows = (attributes: Record<string, unknown> | undefined): AttributeRow[] =>
  Object.entries(attributes ?? {}).map(([key, value], i) => ({ id: `${i}-${key}`, key, value: value == null ? "" : String(value) }));

export const rowsToAttributes = (rows: AttributeRow[]): Record<string, string> | undefined => {
  const attributes = rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim();
    if (key) acc[key] = row.value.trim();
    return acc;
  }, {});
  return Object.keys(attributes).length > 0 ? attributes : undefined;
};

export type ProductFormState = {
  name: string;
  description: string;
  sku: string;
  category: string;
  subCategory: string;
  priceAmount: string;
  priceUnit: string;
  unit: string;
  availableQuantity: string;
  minStockQuantity: string;
  visibility: ProductVisibility;
  status: ProductStatus;
  attributes: AttributeRow[];
};

export const emptyProductFormState = (): ProductFormState => ({
  name: "",
  description: "",
  sku: "",
  category: "",
  subCategory: "",
  priceAmount: "",
  priceUnit: "piece",
  unit: "piece",
  availableQuantity: "0",
  minStockQuantity: "0",
  visibility: "private",
  status: "draft",
  attributes: [],
});

export const productFormStateFrom = (product: Product): ProductFormState => ({
  name: product.name,
  description: product.description ?? "",
  sku: product.sku ?? "",
  category: product.category,
  subCategory: product.subCategory ?? "",
  priceAmount: String(product.price.amount),
  priceUnit: product.price.unit ?? "piece",
  unit: product.unit ?? "piece",
  availableQuantity: String(product.availableQuantity),
  minStockQuantity: String(product.minStockQuantity),
  visibility: product.visibility,
  status: product.status,
  attributes: attributesToRows(product.attributes),
});

export type ProductFormSubmit = (data: CreateProductInput, pendingImages: PendingImage[]) => Promise<void>;

/**
 * @param product Pre-fills the form (edit mode). Read once on mount — callers
 * that swap the product afterwards (the drawer, which stays mounted between
 * openings) must call `reset` explicitly.
 */
export const useProductForm = (product?: Product | null) => {
  const [form, setForm] = useState<ProductFormState>(() =>
    product ? productFormStateFrom(product) : emptyProductFormState()
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = useCallback((next?: Product | null) => {
    setForm(next ? productFormStateFrom(next) : emptyProductFormState());
    setPendingImages([]);
    setError(null);
    setSaving(false);
  }, []);

  const setField = useCallback(<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addAttributeRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { id: `new-${Date.now()}-${prev.attributes.length}`, key: "", value: "" }],
    }));
  }, []);

  const updateAttributeRow = useCallback((id: string, field: "key" | "value", value: string) => {
    setForm((prev) => ({
      ...prev,
      attributes: prev.attributes.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
  }, []);

  const removeAttributeRow = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, attributes: prev.attributes.filter((row) => row.id !== id) }));
  }, []);

  const addPendingImages = useCallback((images: PendingImage[]) => {
    setPendingImages((prev) => [...prev, ...images]);
  }, []);

  const removePendingImage = useCallback((id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  /** Validates and returns the API payload, or null after setting `error`. */
  const buildPayload = useCallback((): CreateProductInput | null => {
    if (!form.name.trim()) {
      setError("Product name is required.");
      return null;
    }
    if (!form.category) {
      setError("Please pick a category.");
      return null;
    }
    const amount = parseFloat(form.priceAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setError("Enter a valid price.");
      return null;
    }

    return {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      sku: form.sku.trim() || undefined,
      category: form.category,
      subCategory: form.subCategory.trim() || undefined,
      price: { amount, currency: "INR", unit: form.priceUnit.trim() || undefined },
      availableQuantity: form.availableQuantity ? parseInt(form.availableQuantity, 10) : 0,
      minStockQuantity: form.minStockQuantity ? parseInt(form.minStockQuantity, 10) : 0,
      unit: form.unit.trim() || undefined,
      visibility: form.visibility,
      status: form.status,
      attributes: rowsToAttributes(form.attributes),
    };
  }, [form]);

  /**
   * Wraps a submit handler with the validate → saving → surface-error cycle so
   * no caller re-implements it. Use as `onSubmit={api.handleSubmit(save)}`.
   */
  const handleSubmit = useCallback(
    (onSubmit: ProductFormSubmit) => async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const payload = buildPayload();
      if (!payload) return;
      try {
        setSaving(true);
        await onSubmit(payload, pendingImages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save product");
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, pendingImages]
  );

  return {
    form,
    pendingImages,
    error,
    saving,
    setError,
    setField,
    addAttributeRow,
    updateAttributeRow,
    removeAttributeRow,
    addPendingImages,
    removePendingImage,
    reset,
    buildPayload,
    handleSubmit,
  };
};

export type ProductFormApi = ReturnType<typeof useProductForm>;
