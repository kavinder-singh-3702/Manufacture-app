"use client";

import { motion } from "framer-motion";
import { tintBg } from "@/src/lib/color";
import { PageHeader } from "@/src/components/ui/Surface";
import { AccountingGuard } from "./AccountingGuard";
import { DateRangePicker } from "./DateRangePicker";
import { ReportSection, formatIndian } from "./MetricCard";
import { useAccountingDashboard } from "../hooks/useAccountingDashboard";

/** Minimal loading skeleton for the receivables/payables bars. */
const WorkingCapitalSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-3 w-24 animate-pulse rounded-full" style={{ backgroundColor: "var(--border)" }} />
        <div className="h-3 w-full animate-pulse rounded-full" style={{ backgroundColor: "var(--border)" }} />
      </div>
    ))}
    <div className="h-12 w-full animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
  </div>
);

/**
 * Single purpose: receivables vs payables for the selected period. Same
 * `getDashboard()` payload the Overview and Stock pages consume, via the
 * shared `useAccountingDashboard` hook.
 */
export const WorkingCapitalView = () => {
  const { range, setRange, data, loading, error, reload } = useAccountingDashboard();

  return (
    <AccountingGuard>
      <div className="space-y-6">
        <PageHeader title="Working Capital" />

        <DateRangePicker value={range} onChange={setRange} />

        {error && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            <span>{error}</span>
            <button type="button" onClick={reload} className="text-xs font-bold underline">Retry</button>
          </div>
        )}

        <ReportSection title="Working capital" subtitle="Receivables vs payables">
          {loading ? (
            <WorkingCapitalSkeleton />
          ) : !data || (data.receivables === 0 && data.payables === 0) ? (
            <p className="py-4 text-center text-sm" style={{ color: "var(--medium-gray)" }}>
              No receivables or payables in this period.
            </p>
          ) : (
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
          )}
        </ReportSection>
      </div>
    </AccountingGuard>
  );
};
