"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CreateVariantInput, ProductStatus, ProductVariant } from "@/src/types/product";

type OptionPair = { key: string; value: string };

type FormState = {
  name: string;
  sku: string;
  priceAmount: string;
  priceUnit: string;
  availableQuantity: string;
  minStockQuantity: string;
  status: ProductStatus;
  options: OptionPair[];
};

const empty = (): FormState => ({
  name: "",
  sku: "",
  priceAmount: "",
  priceUnit: "piece",
  availableQuantity: "0",
  minStockQuantity: "0",
  status: "active",
  options: [{ key: "", value: "" }],
});

const fromVariant = (v: ProductVariant): FormState => ({
  name: v.name,
  sku: v.sku ?? "",
  priceAmount: v.price ? String(v.price.amount) : "",
  priceUnit: v.price?.unit ?? "piece",
  availableQuantity: String(v.availableQuantity),
  minStockQuantity: String(v.minStockQuantity),
  status: v.status,
  options: v.options && Object.keys(v.options).length
    ? Object.entries(v.options).map(([key, value]) => ({ key, value }))
    : [{ key: "", value: "" }],
});

const baseInput: React.CSSProperties = {
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
};

const Field = ({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
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

export const VariantFormDrawer = ({
  open,
  variant,
  productId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  variant?: ProductVariant | null;
  productId: string;
  onClose: () => void;
  onSubmit: (data: CreateVariantInput) => Promise<void>;
}) => {
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(variant ? fromVariant(variant) : empty());
      setError(null);
    }
  }, [open, variant]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const setOption = (i: number, field: "key" | "value", val: string) =>
    setForm((p) => {
      const opts = [...p.options];
      opts[i] = { ...opts[i], [field]: val };
      return { ...p, options: opts };
    });

  const addOption = () =>
    setForm((p) => ({ ...p, options: [...p.options, { key: "", value: "" }] }));

  const removeOption = (i: number) =>
    setForm((p) => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Variant name is required.");

    const payload: CreateVariantInput = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      availableQuantity: form.availableQuantity ? parseInt(form.availableQuantity, 10) : 0,
      minStockQuantity: form.minStockQuantity ? parseInt(form.minStockQuantity, 10) : 0,
      status: form.status,
    };

    if (form.priceAmount) {
      const amt = parseFloat(form.priceAmount);
      if (!Number.isNaN(amt)) {
        payload.price = { amount: amt, currency: "INR", unit: form.priceUnit.trim() || undefined };
      }
    }

    const validOptions = form.options.filter((o) => o.key.trim() && o.value.trim());
    if (validOptions.length) {
      payload.options = Object.fromEntries(validOptions.map((o) => [o.key.trim(), o.value.trim()]));
    }

    try {
      setSaving(true);
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save variant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col"
            style={{ backgroundColor: "var(--surface)", boxShadow: "-8px 0 30px rgba(0,0,0,0.10)" }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            role="dialog" aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                  {variant ? "Edit variant" : "New variant"}
                </p>
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  {variant ? variant.name : "Add a variant"}
                </h2>
              </div>
              <button
                type="button" onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
                aria-label="Close"
              >×</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {/* Basics */}
                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Basics
                  </p>
                  <Field label="Variant name" required>
                    <input
                      className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                      style={baseInput} placeholder="e.g. Red – Large"
                      value={form.name} onChange={(e) => set("name", e.target.value)}
                    />
                  </Field>
                  <Field label="SKU" hint="Optional variant code">
                    <input
                      className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none"
                      style={baseInput} placeholder="VAR-001"
                      value={form.sku} onChange={(e) => set("sku", e.target.value)}
                    />
                  </Field>
                </section>

                {/* Pricing & Stock */}
                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Pricing & stock
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Price (₹)" hint="Leave blank to inherit">
                      <input
                        type="number" min="0" step="0.01"
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInput} placeholder="0.00"
                        value={form.priceAmount} onChange={(e) => set("priceAmount", e.target.value)}
                      />
                    </Field>
                    <Field label="Per unit">
                      <input
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInput} placeholder="piece"
                        value={form.priceUnit} onChange={(e) => set("priceUnit", e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Available qty">
                      <input
                        type="number" min="0"
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInput}
                        value={form.availableQuantity} onChange={(e) => set("availableQuantity", e.target.value)}
                      />
                    </Field>
                    <Field label="Min stock alert">
                      <input
                        type="number" min="0"
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInput}
                        value={form.minStockQuantity} onChange={(e) => set("minStockQuantity", e.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                {/* Status */}
                <section className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Status
                  </p>
                  <div className="flex gap-2">
                    {(["draft", "active", "inactive"] as ProductStatus[]).map((s) => {
                      const isActive = form.status === s;
                      return (
                        <button
                          type="button" key={s}
                          onClick={() => set("status", s)}
                          className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold capitalize transition-all"
                          style={{
                            border: isActive ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                            backgroundColor: isActive ? "var(--primary)" : "var(--surface)",
                            color: isActive ? "#fff" : "var(--foreground)",
                          }}
                        >{s}</button>
                      );
                    })}
                  </div>
                </section>

                {/* Options */}
                <section className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Options (e.g. Color, Size)
                  </p>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          className="w-28 rounded-xl px-3 py-2 text-sm focus:outline-none"
                          style={baseInput} placeholder="Color"
                          value={opt.key} onChange={(e) => setOption(i, "key", e.target.value)}
                        />
                        <span style={{ color: "var(--medium-gray)" }}>:</span>
                        <input
                          className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                          style={baseInput} placeholder="Red"
                          value={opt.value} onChange={(e) => setOption(i, "value", e.target.value)}
                        />
                        {form.options.length > 1 && (
                          <button
                            type="button" onClick={() => removeOption(i)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-opacity hover:opacity-60"
                            style={{ color: "var(--accent)" }}
                            aria-label="Remove option"
                          >×</button>
                        )}
                      </div>
                    ))}
                    {form.options.length < 4 && (
                      <button
                        type="button" onClick={addOption}
                        className="mt-1 text-xs font-semibold transition-opacity hover:opacity-70"
                        style={{ color: "var(--primary)" }}
                      >+ Add option</button>
                    )}
                  </div>
                </section>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                  >{error}</motion.div>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-2 px-6 py-4"
                style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
              >
                <button
                  type="button" onClick={onClose} disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                >Cancel</button>
                <button
                  type="submit" disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
                >{saving ? "Saving…" : variant ? "Save changes" : "Add variant"}</button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
