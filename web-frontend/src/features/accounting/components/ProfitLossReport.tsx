"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { accountingService } from "@/src/services/accounting";
import { ApiError } from "@/src/lib/api-error";
import type { ProfitAndLossData } from "@/src/types/accounting";
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
          Accounting
        </p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Profit & Loss</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>Income vs expense analysis</p>
      </motion.div>

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
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Total Income" value={formatIndian(data.totalIncome)} icon="📈"
              accent="#16A34A" textColor="#15803D" />
            <MetricCard label="Total Expenses" value={formatIndian(data.totalExpense)} icon="📉"
              accent="#DC2626" textColor="#DC2626" />
            <MetricCard label={isProfit ? "Net Profit" : "Net Loss"} value={formatIndian(Math.abs(data.netProfit))}
              icon={isProfit ? "✅" : "⚠️"}
              accent={isProfit ? "#16A34A" : "#DC2626"}
              textColor={isProfit ? "#15803D" : "#DC2626"}
              subtitle={`${margin}% ${isProfit ? "profit margin" : "loss margin"}`} />
          </div>

          {/* Visual bar comparison */}
          <ReportSection title="Income vs expenses" subtitle="Visual comparison for the period">
            <div className="space-y-4">
              {[
                { label: "Total Income", value: data.totalIncome, max: Math.max(data.totalIncome, data.totalExpense, 1), color: "#16A34A" },
                { label: "Total Expenses", value: data.totalExpense, max: Math.max(data.totalIncome, data.totalExpense, 1), color: "#DC2626" },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>{item.label}</span>
                    <span className="font-bold" style={{ color: item.color }}>{formatIndian(item.value)}</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / item.max) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
              <div
                className="mt-2 flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ backgroundColor: isProfit ? "#DCFCE7" : "#FEE2E2" }}
              >
                <span className="text-sm font-bold" style={{ color: isProfit ? "#15803D" : "#DC2626" }}>
                  {isProfit ? "Net Profit" : "Net Loss"}
                </span>
                <span className="text-xl font-bold" style={{ color: isProfit ? "#15803D" : "#DC2626" }}>
                  {formatIndian(Math.abs(data.netProfit))}
                </span>
              </div>
            </div>
          </ReportSection>

          {/* Income + Expense detail */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top income accounts */}
            <ReportSection title="Income accounts" subtitle={`${data.income.length} accounts`}>
              {topIncome.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--medium-gray)" }}>No income recorded in this period.</p>
              ) : (
                <div className="space-y-3">
                  {topIncome.map((acc, i) => (
                    <ProgressBar key={acc.accountId}
                      label={acc.accountName} value={acc.value} max={maxIncome}
                      color="#16A34A" amount={formatIndian(acc.value)} delay={i * 0.06} />
                  ))}
                </div>
              )}
            </ReportSection>

            {/* Top expense accounts */}
            <ReportSection title="Expense accounts" subtitle={`${data.expenses.length} accounts`}>
              {topExpense.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--medium-gray)" }}>No expenses recorded in this period.</p>
              ) : (
                <div className="space-y-3">
                  {topExpense.map((acc, i) => (
                    <ProgressBar key={acc.accountId}
                      label={acc.accountName} value={acc.value} max={maxExpense}
                      color="#DC2626" amount={formatIndian(acc.value)} delay={i * 0.06} />
                  ))}
                </div>
              )}
            </ReportSection>
          </div>
        </>
      )}
    </div>
  );
};
