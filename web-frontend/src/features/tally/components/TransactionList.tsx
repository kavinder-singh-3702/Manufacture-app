"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { tallyService, Voucher, VoucherType, VoucherStatus } from "@/src/services/tally";
import { ApiError } from "@/src/lib/api-error";

const fmt = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const VOUCHER_LABELS: Record<VoucherType, string> = {
  sales_invoice: "Sales Invoice",
  purchase_bill: "Purchase Bill",
  receipt:       "Receipt",
  payment:       "Payment",
  journal:       "Journal",
  credit_note:   "Credit Note",
  debit_note:    "Debit Note",
};

const TYPE_ACCENT: Record<VoucherType, { color: string; bg: string }> = {
  sales_invoice: { color: "#16A34A", bg: "#DCFCE7" },
  purchase_bill: { color: "#1E40AF", bg: "#DBEAFE" },
  receipt:       { color: "#92400E", bg: "#FEF3C7" },
  payment:       { color: "#5B21B6", bg: "#EDE9FE" },
  journal:       { color: "#0E7490", bg: "#E0F2FE" },
  credit_note:   { color: "#DC2626", bg: "#FEE2E2" },
  debit_note:    { color: "#D97706", bg: "#FEF3C7" },
};

const STATUS_STYLE: Record<VoucherStatus, { label: string; color: string; bg: string }> = {
  posted: { label: "Posted",  color: "#166534", bg: "#DCFCE7" },
  draft:  { label: "Draft",   color: "#92400E", bg: "#FEF3C7" },
  voided: { label: "Voided",  color: "#6B7280", bg: "#F3F4F6" },
};

const TYPE_CHIPS: { key: VoucherType | "all"; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "sales_invoice", label: "Sales" },
  { key: "purchase_bill", label: "Purchases" },
  { key: "receipt",       label: "Receipts" },
  { key: "payment",       label: "Payments" },
];

const PAGE_SIZE = 20;

const voucherParty = (v: Voucher) =>
  typeof v.party === "object" && v.party ? v.party.name : null;

export const TransactionList = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<VoucherType | "all">("all");

  const load = useCallback(async (off = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await tallyService.listVouchers({
        voucherType: typeFilter === "all" ? undefined : typeFilter,
        limit: PAGE_SIZE,
        offset: off,
      });
      const incoming = res.vouchers ?? [];
      setVouchers((prev) => append ? [...prev, ...incoming] : incoming);
      setHasMore(res.pagination?.hasMore ?? false);
      setOffset(off);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(0, false); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: "var(--medium-gray)" }}>
            <Link href="/dashboard/accounting/tally" className="hover:opacity-70 transition-opacity" style={{ color: "var(--primary)" }}>
              Tally
            </Link>
            <span>/</span>
            <span style={{ color: "var(--foreground)" }}>Transactions</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>All Transactions</h1>
        </div>
        <div className="flex gap-2">
          {[
            { label: "New Invoice",  href: "/dashboard/accounting/tally/new?type=sales" },
            { label: "New Bill",     href: "/dashboard/accounting/tally/new?type=purchase" },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--primary)" }}>
              {a.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {TYPE_CHIPS.map((chip) => (
          <button key={chip.key} onClick={() => setTypeFilter(chip.key)}
            className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
            style={{
              backgroundColor: typeFilter === chip.key ? "var(--primary)" : "var(--surface)",
              color: typeFilter === chip.key ? "#fff" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}>
            {chip.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !vouchers.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center"
          style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}>
          <span className="text-4xl">📭</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No transactions</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
            {typeFilter !== "all" ? `No ${VOUCHER_LABELS[typeFilter as VoucherType]} entries found.` : "Use Quick Entry to create your first transaction."}
          </p>
          <Link href="/dashboard/accounting/tally"
            className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--primary)" }}>
            ← Back to Tally
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {vouchers.map((v, i) => {
              const accent = TYPE_ACCENT[v.voucherType] ?? { color: "var(--primary)", bg: "var(--primary-light)" };
              const statusStyle = STATUS_STYLE[v.status] ?? STATUS_STYLE.draft;
              return (
                <motion.div key={v._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 rounded-xl px-4 py-3.5"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: accent.bg }}>
                    {v.voucherType === "sales_invoice" ? "🧾"
                      : v.voucherType === "purchase_bill" ? "📥"
                      : v.voucherType === "receipt" ? "💰"
                      : v.voucherType === "payment" ? "💸"
                      : "📄"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                        {VOUCHER_LABELS[v.voucherType]}
                      </p>
                      {v.voucherNumber && (
                        <span className="text-xs" style={{ color: "var(--medium-gray)" }}>#{v.voucherNumber}</span>
                      )}
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                      {voucherParty(v) ?? "—"} · {new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className="flex-shrink-0 text-base font-bold" style={{ color: accent.color }}>
                    {fmt(v.totals.net)}
                  </p>
                </motion.div>
              );
            })}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button onClick={() => load(offset + PAGE_SIZE, true)} disabled={loadingMore}
                className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
