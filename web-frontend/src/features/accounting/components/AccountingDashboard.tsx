"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { accountingService } from "@/src/services/accounting";
import { ApiError } from "@/src/lib/api-error";
import type { DashboardData, RecentVoucher } from "@/src/types/accounting";
import { DateRangePicker, defaultDateRange, type DateRange } from "./DateRangePicker";
import { MetricCard, MetricCardSkeleton, ReportSection, formatIndian } from "./MetricCard";

const VOUCHER_TYPE_LABELS: Record<string, string> = {
  sales_invoice: "Sales Invoice", purchase_bill: "Purchase Bill",
  receipt: "Receipt", payment: "Payment", journal: "Journal",
};
const VOUCHER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:  { bg: "#F3F4F6", text: "#4B5563" },
  posted: { bg: "#DCFCE7", text: "#15803D" },
  void:   { bg: "#FEE2E2", text: "#991B1B" },
};

const QUICK_ENTRIES = [
  { label: "Sales Invoice", icon: "🧾", href: "/dashboard/accounting/tally?type=sales", color: "#16A34A", bg: "#DCFCE7" },
  { label: "Purchase Bill", icon: "📋", href: "/dashboard/accounting/tally?type=purchase", color: "#1E40AF", bg: "#DBEAFE" },
  { label: "Receipt",       icon: "💰", href: "/dashboard/accounting/tally?type=receipt", color: "#92400E", bg: "#FEF3C7" },
  { label: "Payment",       icon: "💸", href: "/dashboard/accounting/tally?type=payment", color: "#5B21B6", bg: "#EDE9FE" },
];

export const AccountingDashboard = () => {
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

  useEffect(() => { load(); }, [load]);

  const metrics = data ? [
    { label: "Sales", value: formatIndian(data.sales), icon: "📈", accent: "#16A34A", textColor: "#15803D" },
    { label: "Purchases", value: formatIndian(data.purchases), icon: "📦", accent: "#F59E0B", textColor: "#92400E" },
    { label: "Gross Profit", value: formatIndian(data.grossProfit), icon: "💹", accent: data.grossProfit >= 0 ? "#16A34A" : "#DC2626", textColor: data.grossProfit >= 0 ? "#15803D" : "#DC2626" },
    { label: "Cash Balance", value: formatIndian(data.cashBalance), icon: "🏦", accent: "var(--primary)", textColor: "var(--primary)" },
    { label: "Receivables", value: formatIndian(data.receivables), icon: "⬆️", accent: "#1E40AF", textColor: "#1E40AF" },
    { label: "Payables", value: formatIndian(data.payables), icon: "⬇️", accent: "#DC2626", textColor: "#DC2626" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
            Accounting
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Financial Overview</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>
            GST-ready books for Indian manufacturers
          </p>
        </div>
        <button type="button" onClick={load}
          className="self-start rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
          ↻ Refresh
        </button>
      </motion.div>

      {/* Date range */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <DateRangePicker value={range} onChange={setRange} />
      </motion.div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          <span>{error}</span>
          <button type="button" onClick={load} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* KPI metrics */}
      {loading ? <MetricCardSkeleton count={6} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m, i) => (
            <MetricCard key={m.label} {...m} delay={i * 0.05} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left */}
        <div className="space-y-5">
          {/* Quick Entry */}
          <ReportSection title="Quick entry" subtitle="Create vouchers directly">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ENTRIES.map((q) => (
                <Link key={q.label} href={q.href}
                  className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: q.bg, color: q.color }}>{q.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{q.label}</span>
                </Link>
              ))}
            </div>
          </ReportSection>

          {/* Working Capital */}
          {data && (
            <ReportSection title="Working capital" subtitle="Receivables vs payables">
              <div className="space-y-4">
                {[
                  { label: "Receivables", value: data.receivables, color: "#1E40AF", bg: "#DBEAFE" },
                  { label: "Payables", value: data.payables, color: "#DC2626", bg: "#FEE2E2" },
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
                  style={{ backgroundColor: data.receivables >= data.payables ? "#DCFCE7" : "#FEE2E2" }}>
                  <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Net position</span>
                  <span className="text-lg font-bold" style={{ color: data.receivables >= data.payables ? "#15803D" : "#DC2626" }}>
                    {formatIndian(Math.abs(data.receivables - data.payables))}
                    <span className="ml-1 text-xs font-normal">{data.receivables >= data.payables ? "net receivable" : "net payable"}</span>
                  </span>
                </div>
              </div>
            </ReportSection>
          )}

          {/* Recent transactions */}
          <ReportSection title="Recent transactions" subtitle="Last 5 posted vouchers">
            {vouchers.length === 0 && !loading ? (
              <p className="py-4 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No posted vouchers in this period.</p>
            ) : (
              <div className="space-y-2">
                {vouchers.map((v) => {
                  const sc = VOUCHER_STATUS_COLORS[v.status] ?? VOUCHER_STATUS_COLORS.draft;
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
                          style={{ backgroundColor: sc.bg, color: sc.text }}>{v.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ReportSection>
        </div>

        {/* Right: Report navigation */}
        <div className="space-y-4">
          <ReportSection title="Reports" subtitle="Deep analysis">
            <div className="space-y-2.5">
              {[
                { href: "/dashboard/accounting/pnl", icon: "📊", label: "Profit & Loss", desc: "Income vs expenses", accent: "#16A34A", bg: "#DCFCE7" },
                { href: "/dashboard/accounting/gst", icon: "🧮", label: "GST Summary", desc: "Input & output tax", accent: "#1E40AF", bg: "#DBEAFE" },
                { href: "/dashboard/accounting/outstanding", icon: "⏳", label: "Party Outstanding", desc: "Receivables & payables aging", accent: "#92400E", bg: "#FEF3C7" },
              ].map((r) => (
                <Link key={r.href} href={r.href}
                  className="flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: r.bg }}>{r.icon}</span>
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

          {/* Inventory snapshot */}
          {data && data.lowStockProducts.length > 0 && (
            <ReportSection title="Low stock alert" subtitle={`${data.lowStockProducts.length} product${data.lowStockProducts.length !== 1 ? "s" : ""} need attention`}>
              <div className="space-y-2">
                {data.lowStockProducts.slice(0, 5).map((p) => (
                  <div key={p.productId} className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
                    <p className="truncate text-xs font-semibold" style={{ color: "#92400E" }}>{p.productName}</p>
                    <p className="ml-2 flex-shrink-0 text-xs" style={{ color: "#92400E" }}>
                      {p.onHandQty} {p.unit ?? "units"}
                    </p>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}
        </div>
      </div>
    </div>
  );
};
