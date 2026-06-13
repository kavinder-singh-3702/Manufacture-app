"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Quote, RespondQuotePayload } from "@/src/services/quotes";

type Props = {
  quote: Quote | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: RespondQuotePayload) => void;
};

export const QuoteRespondModal = ({ quote, saving, onClose, onSubmit }: Props) => {
  const [unitPrice, setUnitPrice] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    setErr("");
    const price = Number(unitPrice);
    if (!unitPrice || price <= 0) { setErr("Unit price is required."); return; }
    onSubmit({
      unitPrice: price,
      minOrderQty: minOrderQty ? Number(minOrderQty) : undefined,
      leadTimeDays: leadTimeDays ? Number(leadTimeDays) : undefined,
      validUntil: validUntil || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      {quote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>Respond to quote</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{quote.product.name}</p>
              </div>
              <button onClick={onClose} className="text-xl font-bold hover:opacity-60" style={{ color: "var(--medium-gray)" }}>✕</button>
            </div>

            {/* Request summary */}
            <div className="mx-5 mt-4 rounded-xl p-3 text-xs space-y-1" style={{ backgroundColor: "var(--background)" }}>
              <p style={{ color: "var(--medium-gray)" }}>
                Buyer wants <strong style={{ color: "var(--foreground)" }}>{quote.request.quantity} units</strong>
                {quote.request.targetPrice ? ` at target ₹${quote.request.targetPrice}` : ""}
              </p>
              <p className="italic" style={{ color: "var(--medium-gray)" }}>"{quote.request.requirements}"</p>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {err && (
                <p className="rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>{err}</p>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Unit price (₹) *</label>
                <input type="number" min="0.01" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Min order qty</label>
                  <input type="number" min="1" value={minOrderQty} onChange={(e) => setMinOrderQty(e.target.value)}
                    placeholder="—" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Lead time (days)</label>
                  <input type="number" min="1" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)}
                    placeholder="—" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Valid until</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Notes</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any terms, conditions or remarks…" className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={handleSubmit} disabled={saving}
                  className="flex-1 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                  {saving ? "Sending…" : "Send quote"}
                </button>
                <button onClick={onClose} disabled={saving}
                  className="rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--background)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
