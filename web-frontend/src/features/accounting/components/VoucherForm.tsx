"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { tallyService, VoucherType, VoucherItemLine, Party } from "@/src/services/tally";
import { productService } from "@/src/services/product";
import type { Product } from "@/src/types/product";
import { ApiError, isAbortError } from "@/src/lib/api-error";

// ── Config ────────────────────────────────────────────────────────────────────

const VOUCHER_CONFIG: Record<string, { type: VoucherType; label: string; icon: string; accent: string; partyType: "customer" | "supplier"; mode: "items" | "amount" }> = {
  sales:    { type: "sales_invoice",  label: "Sales Invoice",  icon: "🧾", accent: "#16A34A", partyType: "customer", mode: "items"   },
  purchase: { type: "purchase_bill",  label: "Purchase Bill",  icon: "📋", accent: "#1E40AF", partyType: "supplier", mode: "items"   },
  receipt:  { type: "receipt",        label: "Receipt",        icon: "💰", accent: "#92400E", partyType: "customer", mode: "amount"  },
  payment:  { type: "payment",        label: "Payment",        icon: "💸", accent: "#5B21B6", partyType: "supplier", mode: "amount"  },
};

type LineItem = VoucherItemLine & { productName?: string };

const emptyLine = (): LineItem => ({
  product: "", productName: "", description: "", quantity: 1, rate: 0, amount: 0,
  tax: { gstRate: 18, gstType: "cgst_sgst" },
});

const formatIndian = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Product Picker ─────────────────────────────────────────────────────────────

type ProductPickerProps = {
  onSelect: (product: Product) => void;
  onClose: () => void;
};

const ProductPicker = ({ onSelect, onClose }: ProductPickerProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (q: string) => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    try {
      setLoading(true);
      const res = await productService.list({ scope: "company", search: q || undefined, limit: 40 }, controller.signal);
      setResults(res.products ?? []);
    } catch (err) {
      if (isAbortError(err)) return; // superseded/unmounted — ignore
      setResults([]);
    } finally {
      if (loadAbortRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => { load(""); inputRef.current?.focus(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [load, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Select product</p>
          <button onClick={onClose} className="text-lg font-bold leading-none hover:opacity-60" style={{ color: "var(--medium-gray)" }}>✕</button>
        </div>
        <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <input ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…" className="w-full rounded-xl px-3 py-2 text-sm font-medium outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
            </div>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No products found</p>
          ) : results.map((p) => (
            <button key={p._id} onClick={() => onSelect(p)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-70"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.name}</p>
                <p className="text-xs capitalize" style={{ color: "var(--medium-gray)" }}>
                  {p.category?.replace(/-/g, " ")} · {p.price?.amount ? formatIndian(p.price.amount) : "No price"}
                </p>
              </div>
              <span style={{ color: "var(--medium-gray)" }}>›</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ── Party Search ───────────────────────────────────────────────────────────────

type PartyInputProps = {
  label: string;
  partyType: "customer" | "supplier";
  value: string;
  partyId: string;
  onSelect: (name: string, id: string) => void;
};

const PartyInput = ({ label, partyType, value, partyId: _partyId, onSelect }: PartyInputProps) => {
  const [search, setSearch] = useState(value);
  const [results, setResults] = useState<Party[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const loadParties = useCallback(async (q: string) => {
    try {
      setLoading(true);
      const res = await tallyService.listParties({ type: partyType, search: q || undefined, limit: 10 });
      setResults(res.parties ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [partyType]);

  const handleChange = (val: string) => {
    setSearch(val);
    onSelect(val, "");
    setOpen(true);
    const t = setTimeout(() => loadParties(val), 250);
    return () => clearTimeout(t);
  };

  const handleFocus = () => { setOpen(true); loadParties(search); };
  const handleSelect = (p: Party) => { onSelect(p.name, p._id); setSearch(p.name); setOpen(false); };

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>{label} *</label>
      <input value={search} onChange={(e) => handleChange(e.target.value)} onFocus={handleFocus}
        placeholder={`Enter ${partyType} name`}
        className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all"
        style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
      <AnimatePresence>
        {open && (results.length > 0 || loading) && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl shadow-lg"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            {loading ? (
              <p className="py-3 text-center text-xs" style={{ color: "var(--medium-gray)" }}>Searching…</p>
            ) : results.map((p) => (
              <button key={p._id} onMouseDown={() => handleSelect(p)}
                className="flex w-full items-center px-3 py-2.5 text-left text-sm hover:opacity-70"
                style={{ borderBottom: "1px solid var(--border)", color: "var(--foreground)" }}>
                <span className="font-semibold">{p.name}</span>
                {p.gstin && <span className="ml-2 text-xs" style={{ color: "var(--medium-gray)" }}>{p.gstin}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="mt-1 text-[10px]" style={{ color: "var(--medium-gray)" }}>
        Type to search existing {partyType}s or enter a new name — it will be auto-created.
      </p>
    </div>
  );
};

// ── Main VoucherForm ──────────────────────────────────────────────────────────

type Props = { typeKey: string };

export const VoucherForm = ({ typeKey }: Props) => {
  const router = useRouter();
  const config = VOUCHER_CONFIG[typeKey] ?? VOUCHER_CONFIG.sales;

  const [partyName, setPartyName] = useState("");
  const [partyId, setPartyId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [narration, setNarration] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank">("cash");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyLine()]);
  const [pickerLineIdx, setPickerLineIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addItem = () => setItems((prev) => [...prev, emptyLine()]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i: number, field: keyof LineItem, val: unknown) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      if (field === "quantity" || field === "rate") {
        next[i].amount = (next[i].quantity || 0) * (next[i].rate || 0);
      }
      return next;
    });
  };

  const applyProduct = (i: number, p: Product) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = next[i];
      const rate = Number(p.price?.amount || 0);
      next[i] = { ...cur, product: p._id, productName: p.name, description: cur.description || p.name, rate, amount: (cur.quantity || 1) * rate, unit: p.unit || cur.unit };
      return next;
    });
    setPickerLineIdx(null);
  };

  const totals = items.reduce(
    (acc, item) => {
      const taxable = (item.quantity || 0) * (item.rate || 0);
      const gst = item.tax?.gstRate ? (taxable * item.tax.gstRate) / 100 : 0;
      return { taxable: acc.taxable + taxable, gst: acc.gst + gst };
    },
    { taxable: 0, gst: 0 }
  );
  const grandTotal = totals.taxable + totals.gst;

  const handleSave = async () => {
    setError(null);
    if (!partyName.trim()) { setError("Party name is required."); return; }
    if (config.mode === "items" && items.some((it) => !it.product || it.quantity <= 0 || it.rate <= 0)) {
      setError("Select a product and fill quantity + rate for all line items."); return;
    }
    if (config.mode === "amount" && (!amount || Number(amount) <= 0)) {
      setError("Amount must be greater than zero."); return;
    }

    try {
      setSaving(true);
      let resolvedPartyId = partyId;
      if (!resolvedPartyId) {
        const party = await tallyService.createParty({ name: partyName.trim(), type: config.partyType });
        resolvedPartyId = party._id;
      }

      const voucher = await tallyService.createVoucher({
        voucherType: config.type,
        date,
        partyId: resolvedPartyId,
        narration: narration.trim() || undefined,
        ...(config.mode === "items"
          ? { lines: { items: items.map(({ productName: _pn, ...rest }) => rest) }, gst: { enabled: true, gstType: "cgst_sgst" } }
          : { amount: Number(amount), paymentMode }),
      });

      await tallyService.postVoucher(voucher._id);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/accounting"), 1500);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to save voucher.");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="text-5xl">✅</div>
        <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{config.label} saved!</p>
        <p className="text-sm" style={{ color: "var(--medium-gray)" }}>Redirecting to accounting…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
          ←
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
            Accounting
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {config.icon} {config.label}
          </h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold">✕</button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left */}
        <div className="space-y-4">
          {/* Party + date */}
          <div className="rounded-2xl p-5 space-y-4"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {config.partyType === "customer" ? "Customer" : "Supplier"} details
            </p>
            <PartyInput
              label={config.partyType === "customer" ? "Customer name" : "Supplier name"}
              partyType={config.partyType}
              value={partyName}
              partyId={partyId}
              onSelect={(name, id) => { setPartyName(name); setPartyId(id); }}
            />
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
                style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
          </div>

          {/* Items or Amount */}
          {config.mode === "items" ? (
            <div className="rounded-2xl p-5 space-y-3"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Line items</p>
                <button onClick={addItem}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-70"
                  style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                  + Add item
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="rounded-xl p-4 space-y-3"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Item {idx + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-xs font-bold hover:opacity-70" style={{ color: "var(--accent)" }}>Remove</button>
                    )}
                  </div>

                  {/* Product picker trigger */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Product *</label>
                    <button onClick={() => setPickerLineIdx(idx)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-left transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: item.productName ? "var(--foreground)" : "var(--medium-gray)" }}>
                      <span className="truncate font-medium">{item.productName || "Select product…"}</span>
                      <span>›</span>
                    </button>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Description</label>
                    <input value={item.description || ""} onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder="Optional" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Qty *</label>
                      <input type="number" min="0.01" step="0.01" value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Rate (₹) *</label>
                      <input type="number" min="0" step="0.01" value={item.rate}
                        onChange={(e) => updateItem(idx, "rate", parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>GST %</label>
                      <select value={item.tax?.gstRate ?? 18}
                        onChange={(e) => updateItem(idx, "tax", { gstRate: Number(e.target.value), gstType: "cgst_sgst" })}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                        {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col justify-end">
                      <p className="text-xs font-semibold mb-1" style={{ color: "var(--medium-gray)" }}>Amount</p>
                      <p className="text-sm font-bold py-2.5" style={{ color: "var(--primary)" }}>
                        {formatIndian(item.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-5 space-y-4"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Payment details</p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Amount (₹) *</label>
                <input type="number" min="0.01" step="0.01" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Payment mode</label>
                <div className="flex gap-2">
                  {(["cash", "bank"] as const).map((m) => (
                    <button key={m} onClick={() => setPaymentMode(m)}
                      className="flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition-all"
                      style={{
                        backgroundColor: paymentMode === m ? "var(--primary)" : "var(--background)",
                        color: paymentMode === m ? "#fff" : "var(--foreground)",
                        border: "1px solid var(--border)",
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Narration */}
          <div className="rounded-2xl p-5"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Narration (optional)</label>
            <textarea value={narration} onChange={(e) => setNarration(e.target.value)}
              rows={3} placeholder="Additional notes…"
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        {/* Right: Summary + Save */}
        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl p-5 space-y-3"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Summary</p>

              {config.mode === "items" ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--medium-gray)" }}>Subtotal</span>
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>{formatIndian(totals.taxable)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--medium-gray)" }}>GST</span>
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>{formatIndian(totals.gst)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between"
                    style={{ borderColor: "var(--border)" }}>
                    <span className="font-bold" style={{ color: "var(--foreground)" }}>Grand total</span>
                    <span className="text-lg font-black" style={{ color: config.accent }}>{formatIndian(grandTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="font-bold" style={{ color: "var(--foreground)" }}>Amount</span>
                  <span className="text-lg font-black" style={{ color: config.accent }}>
                    {amount ? formatIndian(Number(amount)) : "₹0.00"}
                  </span>
                </div>
              )}
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full rounded-2xl py-4 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: config.accent, color: "#fff" }}>
              {saving ? "Saving…" : `Save & post ${config.label}`}
            </button>

            <button onClick={() => router.back()}
              className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--background)" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Product picker modal */}
      <AnimatePresence>
        {pickerLineIdx !== null && (
          <ProductPicker
            onSelect={(p) => applyProduct(pickerLineIdx, p)}
            onClose={() => setPickerLineIdx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
