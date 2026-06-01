"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { productInquiryService } from "@/src/services/productInquiry";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import type { AuthUser } from "@/src/types/auth";

type FormState = {
  quantity: string;
  deliveryLocation: string;
  message: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

const empty = (user?: AuthUser): FormState => ({
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

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
      {label}
    </span>
    {children}
    {hint && <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>{hint}</p>}
  </label>
);

export const ProductInquiryDrawer = ({
  open,
  product,
  user,
  onClose,
  onSuccess,
}: {
  open: boolean;
  product: Product;
  user?: AuthUser;
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const [form, setForm] = useState<FormState>(() => empty(user));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(empty(user));
      setError(null);
      setDone(false);
    }
  }, [open, user]);

  const set = <K extends keyof FormState>(key: K, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await productInquiryService.create({
        productId: product._id,
        quantity: form.quantity ? parseInt(form.quantity, 10) : undefined,
        deliveryLocation: form.deliveryLocation.trim() || undefined,
        message: form.message.trim() || undefined,
        contactName: form.contactName.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
      });
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to send inquiry");
    } finally {
      setSubmitting(false);
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
                  Purchase inquiry
                </p>
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  {product.name}
                </h2>
              </div>
              <button
                type="button" onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
                aria-label="Close"
              >×</button>
            </div>

            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                  style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                >✓</div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Inquiry sent!</h3>
                  <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                    The seller will reach out to you shortly. We&apos;ve also notified them of your contact details.
                  </p>
                </div>
                <button
                  type="button" onClick={onClose}
                  className="mt-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--primary)" }}
                >Close</button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                  {/* Info banner */}
                  <div
                    className="rounded-xl p-3.5 text-xs"
                    style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                  >
                    All fields are optional — fill in what you know and the seller will follow up.
                  </div>

                  {/* Purchase details */}
                  <section className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                      Purchase details
                    </p>
                    <Field label="Quantity" hint="How many units do you need?">
                      <input
                        type="number" min="1"
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInput} placeholder="e.g. 500"
                        value={form.quantity} onChange={(e) => set("quantity", e.target.value)}
                      />
                    </Field>
                    <Field label="Delivery location">
                      <input
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInput} placeholder="e.g. Mumbai, Maharashtra"
                        value={form.deliveryLocation} onChange={(e) => set("deliveryLocation", e.target.value)}
                      />
                    </Field>
                    <Field label="Message">
                      <textarea
                        rows={3}
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInput}
                        placeholder="Any specifications, certifications needed, timeline…"
                        value={form.message} onChange={(e) => set("message", e.target.value)}
                      />
                    </Field>
                  </section>

                  {/* Contact info */}
                  <section className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                      Your contact info
                    </p>
                    <Field label="Name">
                      <input
                        className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                        style={baseInput} placeholder="Your name"
                        value={form.contactName} onChange={(e) => set("contactName", e.target.value)}
                      />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Phone">
                        <input
                          type="tel"
                          className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                          style={baseInput} placeholder="+91 98765 43210"
                          value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)}
                        />
                      </Field>
                      <Field label="Email">
                        <input
                          type="email"
                          className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                          style={baseInput} placeholder="you@company.com"
                          value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)}
                        />
                      </Field>
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
                    type="button" onClick={onClose} disabled={submitting}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
                    style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >Cancel</button>
                  <button
                    type="submit" disabled={submitting}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
                  >{submitting ? "Sending…" : "Send inquiry"}</button>
                </div>
              </form>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
