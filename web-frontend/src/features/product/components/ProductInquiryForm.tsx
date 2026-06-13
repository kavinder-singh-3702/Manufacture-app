"use client";

/**
 * Unified inquiry form used in:
 *  - ProductInquiryDrawer (dashboard / authenticated)
 *  - PublicProductDetail  (marketplace / guest or authenticated)
 *
 * Behaviour:
 *  - Authenticated: uses productInquiryService (passes auth cookie automatically)
 *  - Guest: posts to /product-inquiries endpoint directly (public endpoint)
 *  - Pre-fills contact fields from `user` when provided
 *  - Includes selected variant info in the submission
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productInquiryService } from "@/src/services/productInquiry";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import type { AuthUser } from "@/src/types/auth";
import type { SelectedVariant } from "./VariantSelector";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InquiryFormState = {
  quantity: string;
  deliveryLocation: string;
  message: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export type InquirySubmitResult = "success" | "error";

type Props = {
  product: Product;
  selectedVariant?: SelectedVariant | null;
  user?: AuthUser | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  /** Compact mode: hides delivery + email (useful in small drawers) */
  compact?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyForm = (user?: AuthUser | null): InquiryFormState => ({
  quantity: "",
  deliveryLocation: "",
  message: "",
  contactName: user?.displayName ?? user?.firstName ?? "",
  contactPhone: user?.phone ?? "",
  contactEmail: user?.email ?? "",
});

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

// ── Component ─────────────────────────────────────────────────────────────────

export const ProductInquiryForm = ({ product, selectedVariant, user, onSuccess, onCancel, compact = false }: Props) => {
  const [form, setForm] = useState<InquiryFormState>(() => emptyForm(user));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (key: keyof InquiryFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.contactName.trim()) { setError("Your name is required."); return; }
    if (!form.contactPhone.trim()) { setError("Phone number is required."); return; }

    try {
      setSubmitting(true);

      // Build message that includes variant context if selected
      const variantNote = selectedVariant
        ? `Variant: ${selectedVariant.variant.name}${selectedVariant.price ? ` (${selectedVariant.price.amount.toLocaleString("en-IN")} ${selectedVariant.price.currency ?? "INR"}/${selectedVariant.price.unit ?? "unit"})` : ""}`
        : "";
      const fullMessage = [variantNote, form.message.trim()].filter(Boolean).join("\n");

      if (user) {
        // Authenticated — use the service (cookie-based auth)
        await productInquiryService.create({
          productId: product._id,
          variantId: selectedVariant?.variant._id,
          quantity: form.quantity ? parseInt(form.quantity, 10) : undefined,
          deliveryLocation: form.deliveryLocation.trim() || undefined,
          message: fullMessage || undefined,
          contactName: form.contactName.trim() || undefined,
          contactPhone: form.contactPhone.trim() || undefined,
          contactEmail: form.contactEmail.trim() || undefined,
        } as any);
      } else {
        // Guest — post to public endpoint
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product-inquiries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product._id,
            variantId: selectedVariant?.variant._id,
            buyerName: form.contactName.trim(),
            buyerPhone: form.contactPhone.trim(),
            buyerEmail: form.contactEmail.trim() || undefined,
            quantity: form.quantity ? Number(form.quantity) : undefined,
            deliveryLocation: form.deliveryLocation.trim() || undefined,
            message: fullMessage || undefined,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as any).message || "Failed to send inquiry");
        }
      }

      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to send inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ backgroundColor: "#DCFCE7", border: "2px solid #BBF7D0" }}>
          ✅
        </motion.div>
        <div>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>Inquiry sent!</p>
          <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
            The seller will contact you at <strong>{form.contactPhone}</strong> shortly.
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--primary)" }}>
            Done
          </button>
        )}
      </motion.div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Variant context pill */}
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

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl px-3 py-2.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact fields */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Your name" required>
          <input value={form.contactName} onChange={set("contactName")}
            placeholder="Raj Kumar" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={baseInput} />
        </Field>
        <Field label="Phone" required>
          <input value={form.contactPhone} onChange={set("contactPhone")}
            placeholder="+91 98765 43210" type="tel"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={baseInput} />
        </Field>
      </div>

      {!compact && (
        <Field label="Email">
          <input value={form.contactEmail} onChange={set("contactEmail")}
            placeholder="you@company.com" type="email"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={baseInput} />
        </Field>
      )}

      <Field label="Quantity">
        <input value={form.quantity} onChange={set("quantity")}
          placeholder={`e.g. 500 ${product.price.unit ?? "units"}`}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={baseInput} />
      </Field>

      {!compact && (
        <Field label="Delivery location">
          <input value={form.deliveryLocation} onChange={set("deliveryLocation")}
            placeholder="e.g. Mumbai, Maharashtra"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={baseInput} />
        </Field>
      )}

      <Field label="Message">
        <textarea value={form.message} onChange={set("message")} rows={3}
          placeholder="Target price, lead time, certifications needed, sample request…"
          className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
          style={baseInput} />
      </Field>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: "var(--primary)" }}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
              Sending…
            </span>
          ) : "Send inquiry"}
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
        Your contact details are only shared with the seller of this product.
      </p>
    </div>
  );
};
