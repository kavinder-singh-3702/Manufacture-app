"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { accountingService } from "@/src/services/accounting";
import { ApiError } from "@/src/lib/api-error";
import type { ProfitAndLossData } from "@/src/types/accounting";
import { tintBg } from "@/src/lib/color";
import { PageHeader } from "@/src/components/ui/Surface";
import { DonutChart, DonutLegend } from "@/src/components/ui/charts";
import { AccountingGuard } from "./AccountingGuard";
import { DateRangePicker, defaultDateRange, type DateRange } from "./DateRangePicker";
import { MetricCard, MetricCardSkeleton, ProgressBar, ReportSection, formatIndian } from "./MetricCard";

export const ProfitLossReport = () => {
  const [range, setRange] = useState<DateRange>(defaultDateRange());
  const [data, setData] = useState<ProfitAndLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await accountingService.getProfitAndLoss({ from: range.from, to: range.to });
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load P&L");
    } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const margin = data && data.totalIncome > 0
    ? ((data.netProfit / data.totalIncome) * 100).toFixed(1)
    : "0.0";

  const isProfit = (data?.netProfit ?? 0) >= 0;

  const topIncome = data?.income.slice().sort((a, b) => b.value - a.value).slice(0, 8) ?? [];
  const topExpense = data?.expenses.slice().sort((a, b) => b.value - a.value).slice(0, 8) ?? [];
  const maxIncome = Math.max(...topIncome.map((i) => i.value), 1);
  const maxExpense = Math.max(...topExpense.map((e) => e.value), 1);

  return (
    <AccountingGuard>
      <div className="space-y-6">
        <PageHeader title="Profit & Loss" />

        <DateRangePicker value={range} onChange={setRange} />

        {error && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            <span>{error}</span>
            <button type="button" onClick={load} className="text-xs font-bold underline">Retry</button>
          </div>
        )}

        {loading ? <MetricCardSkeleton count={3} /> : data && (
          <>
            {/* Summary cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Total Income" value={formatIndian(data.totalIncome)} icon="📈"
                accent="var(--success)" textColor="var(--success)" />
              <MetricCard label="Total Expenses" value={formatIndian(data.totalExpense)} icon="📉"
                accent="var(--error)" textColor="var(--error)" />
            </div>

            {/* Net profit hero — matches the app's dedicated Net Profit card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
              className="rounded-3xl p-6 text-center"
              style={{
                backgroundColor: tintBg(isProfit ? "var(--success)" : "var(--error)", 10),
                border: `1px solid ${isProfit ? "var(--success)" : "var(--error)"}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: isProfit ? "var(--success)" : "var(--error)" }}>
                {isProfit ? "Net Profit" : "Net Loss"}
              </p>
              <p className="mt-3 text-5xl font-bold" style={{ color: isProfit ? "var(--success)" : "var(--error)" }}>
                {formatIndian(Math.abs(data.netProfit))}
              </p>
              <p className="mt-2 text-sm" style={{ color: isProfit ? "var(--success)" : "var(--error)" }}>
                {margin}% {isProfit ? "profit margin" : "loss margin"}
              </p>
            </motion.div>

            {/* Income vs Expenses donut — app parity, reuses the shared DonutChart */}
            <ReportSection title="Income vs expenses" subtitle="Share of the period's totals">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                <DonutChart
                  segments={[
                    { label: "Income", value: data.totalIncome, color: "var(--success)" },
                    { label: "Expenses", value: data.totalExpense, color: "var(--error)" },
                  ]}
                  centerValue={`${margin}%`}
                  centerLabel={isProfit ? "Profit" : "Loss"}
                />
                <div className="w-full max-w-[220px]">
                  <DonutLegend
                    segments={[
                      { label: "Income", value: data.totalIncome, color: "var(--success)" },
                      { label: "Expenses", value: data.totalExpense, color: "var(--error)" },
                    ]}
                  />
                </div>
              </div>
            </ReportSection>

            {/* Income + Expense detail */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ReportSection title="Income accounts" subtitle={`${data.income.length} accounts`}>
                {topIncome.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--medium-gray)" }}>No income recorded in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {topIncome.map((acc, i) => (
                      <ProgressBar key={acc.accountId}
                        label={acc.accountName} value={acc.value} max={maxIncome}
                        color="var(--success)" amount={formatIndian(acc.value)} delay={i * 0.06} />
                    ))}
                  </div>
                )}
              </ReportSection>

              <ReportSection title="Expense accounts" subtitle={`${data.expenses.length} accounts`}>
                {topExpense.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--medium-gray)" }}>No expenses recorded in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {topExpense.map((acc, i) => (
                      <ProgressBar key={acc.accountId}
                        label={acc.accountName} value={acc.value} max={maxExpense}
                        color="var(--error)" amount={formatIndian(acc.value)} delay={i * 0.06} />
                    ))}
                  </div>
                )}
              </ReportSection>
            </div>
          </>
        )}
      </div>
    </AccountingGuard>
  );
};
