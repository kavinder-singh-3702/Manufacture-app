"use client";

/**
 * Every product form field, in one place. Pure presentation driven by
 * `useProductForm` — the drawer and the full-page create/edit routes all
 * render this, so a field added here shows up everywhere at once.
 */

import { motion } from "framer-motion";
import type { ProductImage, ProductStatus } from "@/src/types/product";
import { PRODUCT_CATEGORIES } from "../utils/categories";
import { SPEC_KEY_SUGGESTIONS, type ProductFormApi } from "../hooks/useProductForm";
import { ProductImageUploader } from "./ProductImageUploader";

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

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
    {children}
  </p>
);

const baseInputStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
};

const inputClass = "mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none";

export const ProductFormFields = ({
  api,
  existingImages,
}: {
  api: ProductFormApi;
  /** Already-uploaded images (edit mode) — shown alongside the pending ones. */
  existingImages?: ProductImage[];
}) => {
  const { form, pendingImages, saving, setField, addAttributeRow, updateAttributeRow, removeAttributeRow, addPendingImages, removePendingImage } = api;

  // Suggestions come from the picked industry's own sub-verticals (the same
  // list the /industries landing pages use) — free text is still allowed.
  const subCategories = PRODUCT_CATEGORIES.find((c) => c.id === form.category)?.subCategories ?? [];

  return (
    <div className="space-y-6">
      {/* Section: Images */}
      <section className="space-y-3">
        <SectionLabel>Photos</SectionLabel>
        <ProductImageUploader
          existing={existingImages}
          pending={pendingImages}
          onAdd={addPendingImages}
          onRemovePending={removePendingImage}
          disabled={saving}
        />
      </section>

      {/* Section: Basics */}
      <section className="space-y-4">
        <SectionLabel>Basics</SectionLabel>
        <Field label="Product name" required>
          <input
            className={inputClass}
            style={baseInputStyle}
            placeholder="e.g. Premium Cotton Yarn"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </Field>
        <Field label="Description" hint="Up to 2000 characters. Supports plain text.">
          <textarea
            rows={3}
            className={inputClass}
            style={baseInputStyle}
            placeholder="What does this product do? Materials, dimensions, certifications…"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" hint="Optional internal code">
            <input
              className={`${inputClass} font-mono`}
              style={baseInputStyle}
              placeholder="ACME-001"
              value={form.sku}
              onChange={(e) => setField("sku", e.target.value)}
            />
          </Field>
          <Field label="Unit" hint="e.g. piece, kg, meter">
            <input
              className={inputClass}
              style={baseInputStyle}
              placeholder="piece"
              value={form.unit}
              onChange={(e) => setField("unit", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* Section: Category */}
      <section className="space-y-4">
        <SectionLabel>Category</SectionLabel>
        <Field label="Industry" required>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRODUCT_CATEGORIES.map((cat) => {
              const active = form.category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setField("category", cat.id)}
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
              className={inputClass}
              style={baseInputStyle}
              placeholder="e.g. Cotton, Bakery"
              value={form.subCategory}
              onChange={(e) => setField("subCategory", e.target.value)}
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
        <SectionLabel>Pricing &amp; stock</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (₹)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              style={baseInputStyle}
              placeholder="0.00"
              value={form.priceAmount}
              onChange={(e) => setField("priceAmount", e.target.value)}
            />
          </Field>
          <Field label="Per unit">
            <input
              className={inputClass}
              style={baseInputStyle}
              placeholder="piece"
              value={form.priceUnit}
              onChange={(e) => setField("priceUnit", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Available quantity">
            <input
              type="number"
              min="0"
              className={inputClass}
              style={baseInputStyle}
              value={form.availableQuantity}
              onChange={(e) => setField("availableQuantity", e.target.value)}
            />
          </Field>
          <Field label="Min stock alert" hint="Low-stock badge below this">
            <input
              type="number"
              min="0"
              className={inputClass}
              style={baseInputStyle}
              value={form.minStockQuantity}
              onChange={(e) => setField("minStockQuantity", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* Section: Specifications — free-form attributes shown on the buyer-facing PDP */}
      <section className="space-y-3">
        <SectionLabel>Specifications</SectionLabel>
        <p className="-mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>
          Trade details buyers look for — MOQ, item code, delivery time, packaging — plus any product specs (material, color, brand…).
        </p>
        <div className="space-y-2">
          {form.attributes.map((row) => (
            <div key={row.id} className="flex gap-2">
              <input
                list="spec-key-suggestions"
                placeholder="Spec (e.g. moq)"
                className="w-2/5 rounded-xl px-3 py-2 text-xs focus:outline-none"
                style={baseInputStyle}
                value={row.key}
                onChange={(e) => updateAttributeRow(row.id, "key", e.target.value)}
              />
              <input
                placeholder="Value (e.g. 100 pieces)"
                className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none"
                style={baseInputStyle}
                value={row.value}
                onChange={(e) => updateAttributeRow(row.id, "value", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeAttributeRow(row.id)}
                aria-label="Remove specification"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--accent)" }}
              >
                ×
              </button>
            </div>
          ))}
          <datalist id="spec-key-suggestions">
            {SPEC_KEY_SUGGESTIONS.map((key) => <option key={key} value={key} />)}
          </datalist>
          <button
            type="button"
            onClick={addAttributeRow}
            className="text-xs font-bold transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            + Add specification
          </button>
        </div>
      </section>

      {/* Section: Visibility & Status */}
      <section className="space-y-4">
        <SectionLabel>Visibility</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["public", "private"] as const).map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setField("visibility", v)}
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
                  onClick={() => setField("status", s)}
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
    </div>
  );
};

/** Shared error banner — the drawer and the full-page forms surface failures identically. */
export const ProductFormError = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-xl px-4 py-3 text-sm font-medium"
    style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
  >
    {message}
  </motion.div>
);
