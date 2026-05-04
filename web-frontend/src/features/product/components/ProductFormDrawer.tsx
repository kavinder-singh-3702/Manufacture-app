"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CreateProductInput, Product, ProductStatus, ProductVisibility } from "@/src/types/product";
import { PRODUCT_CATEGORIES } from "../utils/categories";

type FormState = {
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
};

const emptyState = (): FormState => ({
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
});

const stateFromProduct = (product: Product): FormState => ({
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
});

const Field = ({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
        {label}{required && <span style={{ color: "var(--accent)" }}> *</span>}
      </span>
    </div>
    {children}
    {hint && <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>{hint}</p>}
  </label>
);

const baseInputStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
};

export const ProductFormDrawer = ({
  open,
  product,
  onClose,
  onSubmit,
}: {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSubmit: (data: CreateProductInput) => Promise<void>;
}) => {
  const [form, setForm] = useState<FormState>(emptyState);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(product ? stateFromProduct(product) : emptyState());
      setError(null);
      setSaving(false);
    }
  }, [open, product]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const subCategories =
    PRODUCT_CATEGORIES.find((c) => c.id === form.category)?.id !== form.category
      ? []
      : (() => {
          // Use the keys from backend constants; we don't have subcategories in web yet, so derive from a static list.
          // Mobile pulls subCategories from the same constant — for now we leave free text.
          return [];
        })();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Product name is required.");
    if (!form.category) return setError("Please pick a category.");
    const amount = parseFloat(form.priceAmount);
    if (Number.isNaN(amount) || amount < 0) return setError("Enter a valid price.");

    const payload: CreateProductInput = {
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
    };

    try {
      setSaving(true);
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col"
            style={{ backgroundColor: "var(--surface)", boxShadow: "-8px 0 30px rgba(0,0,0,0.10)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                  {product ? "Edit product" : "New product"}
                </p>
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  {product ? product.name : "Create a product"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6" style={{ overscrollBehavior: "none" }}>
                {/* Section: Basics */}
                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Basics
                  </p>
                  <Field label="Product name" required>
                    <input
                      className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                      style={baseInputStyle}
                      placeholder="e.g. Premium Cotton Yarn"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </Field>
                  <Field label="Description" hint="Up to 2000 characters. Supports plain text.">
                    <textarea
                      rows={3}
                      className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                      style={baseInputStyle}
                      placeholder="What does this product do? Materials, dimensions, certifications…"
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="SKU" hint="Optional internal code">
                      <input
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none"
                        style={baseInputStyle}
                        placeholder="ACME-001"
                        value={form.sku}
                        onChange={(e) => update("sku", e.target.value)}
                      />
                    </Field>
                    <Field label="Unit" hint="e.g. piece, kg, meter">
                      <input
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInputStyle}
                        placeholder="piece"
                        value={form.unit}
                        onChange={(e) => update("unit", e.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                {/* Section: Category */}
                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Category
                  </p>
                  <Field label="Industry" required>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {PRODUCT_CATEGORIES.map((cat) => {
                        const active = form.category === cat.id;
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => update("category", cat.id)}
                            className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all hover:-translate-y-0.5"
                            style={{
                              border: active ? `1.5px solid ${cat.text}` : "1px solid var(--border)",
                              backgroundColor: active ? cat.bg : "var(--surface)",
                            }}
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-[11px] font-semibold leading-tight" style={{ color: active ? cat.text : "var(--foreground)" }}>
                              {cat.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  {form.category && (
                    <Field label="Sub-category (optional)" hint="e.g. Cotton yarn, Denim, Bakery">
                      <input
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInputStyle}
                        placeholder="e.g. Cotton, Bakery"
                        value={form.subCategory}
                        onChange={(e) => update("subCategory", e.target.value)}
                        list="sub-cat-options"
                      />
                      <datalist id="sub-cat-options">
                        {subCategories.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    </Field>
                  )}
                </section>

                {/* Section: Pricing & Stock */}
                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Pricing & stock
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Price (₹)" required>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInputStyle}
                        placeholder="0.00"
                        value={form.priceAmount}
                        onChange={(e) => update("priceAmount", e.target.value)}
                      />
                    </Field>
                    <Field label="Per unit">
                      <input
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInputStyle}
                        placeholder="piece"
                        value={form.priceUnit}
                        onChange={(e) => update("priceUnit", e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Available quantity">
                      <input
                        type="number"
                        min="0"
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInputStyle}
                        value={form.availableQuantity}
                        onChange={(e) => update("availableQuantity", e.target.value)}
                      />
                    </Field>
                    <Field label="Min stock alert" hint="Low-stock badge below this">
                      <input
                        type="number"
                        min="0"
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInputStyle}
                        value={form.minStockQuantity}
                        onChange={(e) => update("minStockQuantity", e.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                {/* Section: Visibility & Status */}
                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Visibility
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["public", "private"] as const).map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => update("visibility", v)}
                        className="rounded-xl p-3.5 text-left transition-all"
                        style={{
                          border: form.visibility === v ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: form.visibility === v ? "var(--primary-light)" : "var(--surface)",
                        }}
                      >
                        <p className="text-sm font-semibold capitalize" style={{ color: form.visibility === v ? "var(--primary)" : "var(--foreground)" }}>
                          {v}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>
                          {v === "public" ? "Listed in marketplace search" : "Visible only to your team"}
                        </p>
                      </button>
                    ))}
                  </div>
                  <Field label="Status">
                    <div className="mt-2 flex gap-2">
                      {(["draft", "active", "inactive"] as ProductStatus[]).map((s) => {
                        const isActive = form.status === s;
                        return (
                          <button
                            type="button"
                            key={s}
                            onClick={() => update("status", s)}
                            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold capitalize transition-all"
                            style={{
                              border: isActive ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                              backgroundColor: isActive ? "var(--primary)" : "var(--surface)",
                              color: isActive ? "#fff" : "var(--foreground)",
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </section>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                  >
                    {error}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-2 px-6 py-4"
                style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
                >
                  {saving ? "Saving…" : product ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
