"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { accountingService } from "@/src/services/accounting";
import { ApiError } from "@/src/lib/api-error";
import type { DashboardData, RecentVoucher } from "@/src/types/accounting";
import { tintBg } from "@/src/lib/color";
import { PageHeader } from "@/src/components/ui/Surface";
import { AccountingGuard } from "./AccountingGuard";
import { InternalStockModeView } from "./InternalStockModeView";
import { DateRangePicker, defaultDateRange, type DateRange } from "./DateRangePicker";
import { MetricCard, MetricCardSkeleton, ReportSection, formatIndian } from "./MetricCard";

type Mode = "books" | "internal";

const VOUCHER_TYPE_LABELS: Record<string, string> = {
  sales_invoice: "Sales Invoice", purchase_bill: "Purchase Bill",
  receipt: "Receipt", payment: "Payment", journal: "Journal",
};
// A single accent per status drives both the tinted badge (via `tintBg`) and
// the text color — was a hand-picked bg/text pastel pair per status,
// hardcoded light-only and illegible in dark mode.
const VOUCHER_STATUS_ACCENT: Record<string, string> = {
  draft:  "var(--medium-gray)",
  posted: "var(--success)",
  void:   "var(--error)",
};

const QUICK_ENTRIES = [
  { label: "Sales Invoice", icon: "🧾", href: "/dashboard/accounting/tally/sales", accent: "var(--success)" },
  { label: "Purchase Bill", icon: "📋", href: "/dashboard/accounting/tally/purchase", accent: "var(--primary)" },
  { label: "Receipt",       icon: "💰", href: "/dashboard/accounting/tally/receipt", accent: "var(--warning)" },
  { label: "Payment",       icon: "💸", href: "/dashboard/accounting/tally/payment", accent: "var(--accent)" },
];

const ModeToggle = ({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) => (
  <div className="inline-flex gap-1 rounded-2xl p-1" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
    {([
      { key: "books", label: "Books" },
      { key: "internal", label: "Internal Stock" },
    ] as const).map((opt) => {
      const active = mode === opt.key;
      return (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          style={{
            backgroundColor: active ? "var(--primary)" : "transparent",
            color: active ? "#fff" : "var(--foreground)",
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

/**
 * Mobile stack order (source of truth per Phase 5): KPI overview → Quick
 * entry → Recent transactions → Reports → Working capital → Inventory
 * snapshot — mirrors the app's AccountingDashboardScreen section order. At
 * `lg`+, `lg:order`/`lg:col-start` split the same DOM into a 2-column rail
 * (Reports + snapshot on the right) rather than duplicating content for
 * desktop.
 */
export const AccountingDashboard = () => {
  const [mode, setMode] = useState<Mode>("books");
  const [range, setRange] = useState<DateRange>(defaultDateRange());
  const [data, setData] = useState<DashboardData | null>(null);
  const [vouchers, setVouchers] = useState<RecentVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [dashboard, voucherRes] = await Promise.all([
        accountingService.getDashboard({ from: range.from, to: range.to }),
        accountingService.listVouchers({ status: "posted", limit: 5, from: range.from, to: range.to }),
      ]);
      setData(dashboard);
      setVouchers(voucherRes.vouchers ?? []);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load accounting data");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { if (mode === "books") load(); }, [load, mode]);

  const metrics = data ? [
    { label: "Sales", value: formatIndian(data.sales), icon: "📈", accent: "var(--success)", textColor: "var(--success)" },
    { label: "Purchases", value: formatIndian(data.purchases), icon: "📦", accent: "var(--warning)", textColor: "var(--warning)" },
    { label: "Gross Profit", value: formatIndian(data.grossProfit), icon: "💹", accent: data.grossProfit >= 0 ? "var(--success)" : "var(--error)", textColor: data.grossProfit >= 0 ? "var(--success)" : "var(--error)" },
    { label: "Cash Balance", value: formatIndian(data.cashBalance), icon: "🏦", accent: "var(--primary)", textColor: "var(--primary)" },
    { label: "Receivables", value: formatIndian(data.receivables), icon: "⬆️", accent: "var(--info)", textColor: "var(--info)" },
    { label: "Payables", value: formatIndian(data.payables), icon: "⬇️", accent: "var(--error)", textColor: "var(--error)" },
  ] : [];

  return (
    <AccountingGuard>
      <div className="space-y-6">
        <PageHeader
          title="Financial Overview"
          actions={
            mode === "books" ? (
              <button type="button" onClick={load}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                ↻ Refresh
              </button>
            ) : undefined
          }
        />

        <ModeToggle mode={mode} onChange={setMode} />

        {mode === "internal" ? (
          <InternalStockModeView />
        ) : (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
              <DateRangePicker value={range} onChange={setRange} />
            </motion.div>

            {error && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                <span>{error}</span>
                <button type="button" onClick={load} className="text-xs font-bold underline">Retry</button>
              </div>
            )}

            {loading ? <MetricCardSkeleton count={6} /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((m, i) => (
                  <MetricCard key={m.label} {...m} delay={i * 0.05} />
                ))}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:gap-6">
              {/* Quick Entry — left col, position 1 */}
              <ReportSection title="Quick entry" subtitle="Create vouchers directly" className="lg:order-1 lg:col-start-1">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {QUICK_ENTRIES.map((q) => (
                    <Link key={q.label} href={q.href}
                      className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                        style={{ backgroundColor: tintBg(q.accent), color: q.accent }}>{q.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{q.label}</span>
                    </Link>
                  ))}
                </div>
              </ReportSection>

              {/* Recent transactions — left col, position 2 */}
              <ReportSection title="Recent transactions" subtitle="Last 5 posted vouchers" className="lg:order-2 lg:col-start-1">
                {vouchers.length === 0 && !loading ? (
                  <p className="py-4 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No posted vouchers in this period.</p>
                ) : (
                  <div className="space-y-2">
                    {vouchers.map((v) => {
                      const statusAccent = VOUCHER_STATUS_ACCENT[v.status] ?? VOUCHER_STATUS_ACCENT.draft;
                      return (
                        <div key={v._id} className="flex items-center justify-between gap-3 rounded-xl p-3"
                          style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                              {VOUCHER_TYPE_LABELS[v.voucherType] ?? v.voucherType}
                              {v.voucherNumber ? ` #${v.voucherNumber}` : ""}
                            </p>
                            <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                              {new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                              {formatIndian(v.totals?.total ?? 0)}
                            </span>
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: tintBg(statusAccent), color: statusAccent }}>{v.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ReportSection>

              {/* Reports — right col, position 1 */}
              <ReportSection title="Reports" subtitle="Deep analysis" className="lg:order-1 lg:col-start-2">
                <div className="space-y-2.5">
                  {[
                    { href: "/dashboard/accounting/pnl", icon: "📊", label: "Profit & Loss", desc: "Income vs expenses", accent: "var(--success)" },
                    { href: "/dashboard/accounting/gst", icon: "🧮", label: "GST Summary", desc: "Input & output tax", accent: "var(--primary)" },
                    { href: "/dashboard/accounting/outstanding", icon: "⏳", label: "Party Outstanding", desc: "Receivables & payables aging", accent: "var(--warning)" },
                  ].map((r) => (
                    <Link key={r.href} href={r.href}
                      className="flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                        style={{ backgroundColor: tintBg(r.accent) }}>{r.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{r.label}</p>
                        <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{r.desc}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--medium-gray)", flexShrink: 0 }}>
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </ReportSection>

              {/* Working capital — left col, position 3 */}
              {data && (
                <ReportSection title="Working capital" subtitle="Receivables vs payables" className="lg:order-3 lg:col-start-1">
                  <div className="space-y-4">
                    {[
                      { label: "Receivables", value: data.receivables, color: "var(--info)" },
                      { label: "Payables", value: data.payables, color: "var(--error)" },
                    ].map((item) => {
                      const max = Math.max(data.receivables, data.payables, 1);
                      const pct = (item.value / max) * 100;
                      return (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold" style={{ color: "var(--foreground)" }}>{item.label}</span>
                            <span className="font-bold" style={{ color: item.color }}>{formatIndian(item.value)}</span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between rounded-xl p-3"
                      style={{ backgroundColor: tintBg(data.receivables >= data.payables ? "var(--success)" : "var(--error)") }}>
                      <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Net position</span>
                      <span className="text-lg font-bold" style={{ color: data.receivables >= data.payables ? "var(--success)" : "var(--error)" }}>
                        {formatIndian(Math.abs(data.receivables - data.payables))}
                        <span className="ml-1 text-xs font-normal">{data.receivables >= data.payables ? "net receivable" : "net payable"}</span>
                      </span>
                    </div>
                  </div>
                </ReportSection>
              )}

              {/* Inventory snapshot — right col, position 2 */}
              {data && (data.lowStockProducts.length > 0 || data.topItems.length > 0) && (
                <div className="space-y-5 lg:order-2 lg:col-start-2">
                  {data.lowStockProducts.length > 0 && (
                    <ReportSection title="Low stock alert" subtitle={`${data.lowStockProducts.length} product${data.lowStockProducts.length !== 1 ? "s" : ""} need attention`}>
                      <div className="space-y-2">
                        {data.lowStockProducts.slice(0, 5).map((p) => (
                          <div key={p.productId} className="flex items-center justify-between rounded-xl px-3 py-2"
                            style={{ backgroundColor: tintBg("var(--warning)"), border: "1px solid var(--warning)" }}>
                            <p className="truncate text-xs font-semibold" style={{ color: "var(--warning)" }}>{p.productName}</p>
                            <p className="ml-2 flex-shrink-0 text-xs" style={{ color: "var(--warning)" }}>
                              {p.onHandQty} {p.unit ?? "units"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ReportSection>
                  )}

                  {data.topItems.length > 0 && (
                    <ReportSection title="Top items" subtitle="By quantity sold">
                      <div className="space-y-2">
                        {data.topItems.slice(0, 5).map((p, i) => (
                          <div key={p.productId} className="flex items-center gap-3 rounded-xl px-3 py-2"
                            style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: tintBg("var(--primary)"), color: "var(--primary)" }}>{i + 1}</span>
                            <p className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color: "var(--foreground)" }}>{p.productName}</p>
                            <p className="flex-shrink-0 text-xs font-bold" style={{ color: "var(--foreground)" }}>
                              {p.quantitySold} {p.unit ?? "units"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ReportSection>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AccountingGuard>
  );
};
