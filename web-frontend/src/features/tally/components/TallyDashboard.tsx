"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { tallyService, TallyStats, Voucher, VoucherType } from "@/src/services/tally";
import { ApiError } from "@/src/lib/api-error";
import { tintBg } from "@/src/lib/color";
import { PageHeader } from "@/src/components/ui/Surface";

const fmt = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// A single `accent` per entry drives both the tinted badge (via `tintBg`) and
// the label/icon color — previously a hand-picked `accentBg`/`bg` pastel pair
// per entry (e.g. `#DBEAFE`), hardcoded light-only and illegible in dark mode.
const QUICK_ACTIONS = [
  { key: "sales",    label: "Sales Invoice",  icon: "🧾", accent: "#16A34A", desc: "Record a customer sale", href: "/dashboard/accounting/tally/new?type=sales" },
  { key: "purchase", label: "Purchase Bill",  icon: "📥", accent: "#1E40AF", desc: "Log a supplier bill",     href: "/dashboard/accounting/tally/new?type=purchase" },
  { key: "receipt",  label: "Receipt",        icon: "💰", accent: "#92400E", desc: "Payment received",        href: "/dashboard/accounting/tally/new?type=receipt" },
  { key: "payment",  label: "Payment",        icon: "💸", accent: "#5B21B6", desc: "Payment made",           href: "/dashboard/accounting/tally/new?type=payment" },
] as const;

const STAT_CARDS = (s: TallyStats) => [
  { label: "Total Sales",     value: fmt(s.totalSales),     hint: "Revenue",      accent: "#16A34A" },
  { label: "Total Purchases", value: fmt(s.totalPurchases), hint: "Expenses",     accent: "#DC2626" },
  { label: "Net Profit",      value: fmt(s.netProfit),      hint: "Margin",       accent: "#1E40AF" },
  { label: "Receivables",     value: fmt(s.receivables),    hint: "To collect",   accent: "#D97706" },
  { label: "Payables",        value: fmt(s.payables),       hint: "To pay",       accent: "#5B21B6" },
  { label: "Receipts",        value: fmt(s.totalReceipts),  hint: "Cash in",      accent: "#0E7490" },
] as const;

const VOUCHER_LABELS: Record<VoucherType, string> = {
  sales_invoice: "Sales Invoice",
  purchase_bill: "Purchase Bill",
  receipt:       "Receipt",
  payment:       "Payment",
  journal:       "Journal",
  credit_note:   "Credit Note",
  debit_note:    "Debit Note",
};

const voucherPartyName = (v: Voucher) => {
  if (!v.party) return null;
  if (typeof v.party === "string") return null;
  return v.party.name;
};

export const TallyDashboard = () => {
  const [stats, setStats] = useState<TallyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await tallyService.getStats());
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader title="Tally" />

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger-strong)" }}>
          <span>⚠️ Stats unavailable — {error}. You can still create entries below.</span>
          <button onClick={load} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {/* Financial overview */}
      {(loading || stats) && (
        <div>
          <SectionLabel>Financial Overview</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
                ))
              : stats && STAT_CARDS(stats).map((card, i) => (
                  <motion.div key={card.label}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="relative overflow-hidden rounded-2xl p-5"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                    <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: card.accent }} />
                    <div className="flex items-start justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: card.accent }}>{card.label}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: tintBg(card.accent), color: card.accent }}>
                        {card.hint}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-bold" style={{ color: "var(--foreground)" }}>{card.value}</p>
                  </motion.div>
                ))}
          </div>
        </div>
      )}

      {/* Quick Entry */}
      <div>
        <SectionLabel>Quick Entry</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div key={action.key}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -3 }}>
              <Link href={action.href}
                className="flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-shadow hover:shadow-lg"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                  style={{ backgroundColor: tintBg(action.accent) }}>
                  {action.icon}
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{action.label}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{action.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <SectionLabel noMargin>Recent Transactions</SectionLabel>
          <Link href="/dashboard/accounting/tally/transactions"
            className="text-xs font-bold transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}>
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
            ))}
          </div>
        ) : !stats?.recentVouchers?.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl py-12 text-center"
            style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}>
            <span className="text-4xl">📭</span>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No transactions yet</p>
            <p className="text-xs" style={{ color: "var(--medium-gray)" }}>Use Quick Entry above to create your first one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentVouchers.map((v) => (
              <motion.div key={v._id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {VOUCHER_LABELS[v.voucherType] ?? v.voucherType}
                    {v.voucherNumber ? <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--medium-gray)" }}>#{v.voucherNumber}</span> : null}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--medium-gray)" }}>
                    {voucherPartyName(v) ?? "—"} · {new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <p className="ml-4 flex-shrink-0 text-sm font-bold" style={{ color: "var(--primary)" }}>
                  {fmt(v.totals.net)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SectionLabel = ({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) => (
  <div className={`flex items-center gap-3 ${noMargin ? "" : "mb-4"}`}>
    <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--medium-gray)" }}>{children}</p>
    <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
  </div>
);
