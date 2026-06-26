"use client";

/**
 * RFQ / formal quote request form, shown inline on the product detail page.
 * Unlike inquiries, quotes require an authenticated buyer (backend POST /quotes
 * is auth-gated), so the caller gates this behind a sign-in check.
 *
 * Mirrors the mobile QuoteRequestSheet fields and the backend
 * createQuoteValidation contract (productId, quantity, requirements required).
 */

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { quoteService } from "@/src/services/quotes";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import type { AuthUser } from "@/src/types/auth";
import type { SelectedVariant } from "./VariantSelector";

type Props = {
  product: Product;
  selectedVariant?: SelectedVariant | null;
  user?: AuthUser | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type FormState = {
  quantity: string;
  targetPrice: string;
  requirements: string;
  requiredBy: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

const baseInput: React.CSSProperties = {
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>
      {label}{required && <span style={{ color: "var(--accent)" }}> *</span>}
    </label>
    {children}
  </div>
);

export const QuoteRequestForm = ({ product, selectedVariant, user, onSuccess, onCancel }: Props) => {
  const [form, setForm] = useState<FormState>(() => ({
    quantity: "",
    targetPrice: "",
    requirements: "",
    requiredBy: "",
    contactName: user?.displayName ?? user?.firstName ?? "",
    contactPhone: user?.phone ?? "",
    contactEmail: user?.email ?? "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    const quantity = Number(form.quantity);
    if (!form.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a quantity greater than 0.");
      return;
    }
    if (!form.requirements.trim()) {
      setError("Describe your requirements so the seller can quote accurately.");
      return;
    }
    const targetPrice = form.targetPrice.trim() ? Number(form.targetPrice) : undefined;
    if (targetPrice !== undefined && (!Number.isFinite(targetPrice) || targetPrice < 0)) {
      setError("Target price must be a valid amount.");
      return;
    }

    const buyerContact = {
      name: form.contactName.trim() || undefined,
      phone: form.contactPhone.trim() || undefined,
      email: form.contactEmail.trim() || undefined,
    };
    const hasContact = Boolean(buyerContact.name || buyerContact.phone || buyerContact.email);

    try {
      setSubmitting(true);
      await quoteService.create({
        productId: product._id,
        variantId: selectedVariant?.variant._id,
        quantity,
        targetPrice,
        currency: targetPrice !== undefined ? "INR" : undefined,
        requirements: form.requirements.trim(),
        requiredBy: form.requiredBy || undefined,
        buyerContact: hasContact ? buyerContact : undefined,
      });
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to send quote request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ backgroundColor: "#DCFCE7", border: "2px solid #BBF7D0" }}>
          📩
        </motion.div>
        <div>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>Quote requested</p>
          <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
            The seller will review your RFQ and respond with pricing. Track it under your quotes.
          </p>
        </div>
        <div className="mt-1 flex gap-2">
          <Link href="/dashboard/quotes"
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--primary)" }}>
            View my quotes
          </Link>
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
              Done
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {selectedVariant && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
            style={{ backgroundColor: "var(--primary-light)", border: "1px solid rgba(20,141,178,0.2)" }}>
            <span style={{ color: "var(--primary)" }}>✓</span>
            <span className="font-semibold" style={{ color: "var(--primary)" }}>
              {selectedVariant.variant.name}
              {selectedVariant.price && ` · ₹${selectedVariant.price.amount.toLocaleString("en-IN")}/${selectedVariant.price.unit ?? "unit"}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl px-3 py-2.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity" required>
          <input value={form.quantity} onChange={set("quantity")} inputMode="decimal"
            placeholder={`e.g. 500 ${product.price.unit ?? "units"}`}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={baseInput} />
        </Field>
        <Field label="Target price (₹/unit)">
          <input value={form.targetPrice} onChange={set("targetPrice")} inputMode="decimal"
            placeholder="Optional"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={baseInput} />
        </Field>
      </div>

      <Field label="Requirements" required>
        <textarea value={form.requirements} onChange={set("requirements")} rows={3}
          placeholder="Specs, certifications, packaging, lead time, sample needs…"
          className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none" style={baseInput} />
      </Field>

      <Field label="Required by">
        <input value={form.requiredBy} onChange={set("requiredBy")} type="date"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={baseInput} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact name">
          <input value={form.contactName} onChange={set("contactName")}
            placeholder="Raj Kumar" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={baseInput} />
        </Field>
        <Field label="Phone">
          <input value={form.contactPhone} onChange={set("contactPhone")} type="tel"
            placeholder="+91 98765 43210" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={baseInput} />
        </Field>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: "var(--primary)" }}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
              Sending…
            </span>
          ) : "Send quote request"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting}
            className="rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
            Cancel
          </button>
        )}
      </div>

      <p className="text-[10px] text-center" style={{ color: "var(--medium-gray)" }}>
        Sellers respond with formal pricing you can accept or negotiate from your quotes.
      </p>
    </div>
  );
};
