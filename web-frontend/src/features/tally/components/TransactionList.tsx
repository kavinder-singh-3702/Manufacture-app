"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { tallyService, Voucher, VoucherType, VoucherStatus } from "@/src/services/tally";
import { ApiError } from "@/src/lib/api-error";
import { tintBg } from "@/src/lib/color";
import { PageHeader } from "@/src/components/ui/Surface";
import { useConfirm } from "@/src/components/ui/ConfirmDialog";
import { AccountingGuard } from "@/src/features/accounting/components/AccountingGuard";

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

// `bg` is derived from `color` via `tintBg` at render time — was a hand-picked
// pastel per type/status (e.g. `#DCFCE7`), hardcoded light-only and illegible
// in dark mode.
const TYPE_ACCENT: Record<VoucherType, { color: string }> = {
  sales_invoice: { color: "var(--success)" },
  purchase_bill: { color: "var(--primary)" },
  receipt:       { color: "var(--warning)" },
  payment:       { color: "var(--accent)" },
  journal:       { color: "var(--info)" },
  credit_note:   { color: "var(--error)" },
  debit_note:    { color: "var(--warning)" },
};

const STATUS_STYLE: Record<VoucherStatus, { label: string; color: string }> = {
  posted: { label: "Posted",  color: "var(--success)" },
  draft:  { label: "Draft",   color: "var(--warning)" },
  voided: { label: "Voided",  color: "var(--medium-gray)" },
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
  const confirm = useConfirm();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<VoucherType | "all">("all");
  const [voidingId, setVoidingId] = useState<string | null>(null);

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

  const handleVoid = async (voucher: Voucher) => {
    const ok = await confirm({
      title: "Void this voucher?",
      message: `${VOUCHER_LABELS[voucher.voucherType]}${voucher.voucherNumber ? ` #${voucher.voucherNumber}` : ""} will be marked voided. This can't be undone.`,
      confirmLabel: "Void voucher",
      destructive: true,
    });
    if (!ok) return;
    setVoidingId(voucher._id);
    try {
      const updated = await tallyService.voidVoucher(voucher._id);
      setVouchers((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to void voucher");
    } finally {
      setVoidingId(null);
    }
  };

  return (
    <AccountingGuard>
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="All Transactions"
        breadcrumb={
          <>
            <Link href="/dashboard/accounting/tally" className="hover:opacity-70 transition-opacity" style={{ color: "var(--primary)" }}>
              Tally
            </Link>
            <span>/</span>
            <span style={{ color: "var(--foreground)" }}>Transactions</span>
          </>
        }
        actions={[
          { label: "New Invoice",  href: "/dashboard/accounting/tally/sales" },
          { label: "New Bill",     href: "/dashboard/accounting/tally/purchase" },
        ].map((a) => (
          <Link key={a.href} href={a.href}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)" }}>
            {a.label}
          </Link>
        ))}
      />

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
          style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger-strong)" }}>
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
              const accent = TYPE_ACCENT[v.voucherType] ?? { color: "var(--primary)" };
              const statusStyle = STATUS_STYLE[v.status] ?? STATUS_STYLE.draft;
              return (
                <motion.div key={v._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 rounded-xl px-4 py-3.5"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: tintBg(accent.color) }}>
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
                        style={{ backgroundColor: tintBg(statusStyle.color), color: statusStyle.color }}>
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
                  {v.status !== "voided" && (
                    <button
                      type="button"
                      onClick={() => handleVoid(v)}
                      disabled={voidingId === v._id}
                      aria-label="Void voucher"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
                      style={{ color: "var(--danger-strong)" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
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
    </AccountingGuard>
  );
};
