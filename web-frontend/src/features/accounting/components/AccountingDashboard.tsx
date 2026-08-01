"use client";

import { PageHeader } from "@/src/components/ui/Surface";
import { AccountingGuard } from "./AccountingGuard";
import { DateRangePicker } from "./DateRangePicker";
import { MetricCard, MetricCardSkeleton, formatIndian } from "./MetricCard";
import { useAccountingDashboard } from "../hooks/useAccountingDashboard";

/**
 * Pure financial snapshot: header, date range, 6 KPI cards. Nothing else —
 * quick entry, recent transactions, reports, working capital and stock
 * signals all moved to their own routes (reachable from the sub-nav in
 * `app/dashboard/accounting/layout.tsx`), and the books/internal-stock
 * toggle that used to live here was replaced by a dedicated
 * `/dashboard/accounting/internal-stock` route.
 */
export const AccountingDashboard = () => {
  const { range, setRange, data, loading, error, reload } = useAccountingDashboard();

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
            <button type="button" onClick={reload}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
              ↻ Refresh
            </button>
          }
        />

        <DateRangePicker value={range} onChange={setRange} />

        {error && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            <span>{error}</span>
            <button type="button" onClick={reload} className="text-xs font-bold underline">Retry</button>
          </div>
        )}

        {loading ? <MetricCardSkeleton count={6} /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m, i) => (
              <MetricCard key={m.label} {...m} delay={i * 0.05} />
            ))}
          </div>
        )}
      </div>
    </AccountingGuard>
  );
};
