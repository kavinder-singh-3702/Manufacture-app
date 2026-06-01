"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { accountingService } from "@/src/services/accounting";
import { ApiError } from "@/src/lib/api-error";
import type { GSTSummaryData } from "@/src/types/accounting";
import { DateRangePicker, defaultDateRange, type DateRange } from "./DateRangePicker";
import { MetricCard, MetricCardSkeleton, ReportSection, formatIndian } from "./MetricCard";

const GSTRow = ({ label, value, max, color, dot, delay = 0 }: {
  label: string; value: number; max: number; color: string; dot: string; delay?: number;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
        <span className="font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
      </div>
      <span className="font-bold" style={{ color }}>{formatIndian(value)}</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        transition={{ duration: 0.75, delay, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: dot }}
      />
    </div>
  </div>
);

export const GSTSummaryReport = () => {
  const [range, setRange] = useState<DateRange>(defaultDateRange());
  const [data, setData] = useState<GSTSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      setData(await accountingService.getGSTSummary({ from: range.from, to: range.to }));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load GST data");
    } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const inputTotal = data ? data.input.cgst + data.input.sgst + data.input.igst : 0;
  const outputTotal = data ? data.output.cgst + data.output.sgst + data.output.igst : 0;
  const netPayable = data?.netPayable ?? 0;
  const isPayable = netPayable >= 0;
  const maxGST = Math.max(inputTotal, outputTotal, 1);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
          Accounting
        </p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>GST Summary</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>Input vs output tax analysis</p>
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
          {/* Net payable hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
            className="overflow-hidden rounded-3xl p-6 text-center"
            style={{
              background: isPayable
                ? "linear-gradient(135deg, #FEE2E2, #FEF2F2)"
                : "linear-gradient(135deg, #DCFCE7, #F0FDF4)",
              border: `1px solid ${isPayable ? "#FECACA" : "#BBF7D0"}`,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: isPayable ? "#991B1B" : "#15803D" }}>
              {isPayable ? "GST Payable to Government" : "GST Receivable / Credit"}
            </p>
            <p className="mt-3 text-5xl font-bold" style={{ color: isPayable ? "#DC2626" : "#16A34A" }}>
              {formatIndian(Math.abs(netPayable))}
            </p>
            <p className="mt-2 text-sm" style={{ color: isPayable ? "#991B1B" : "#15803D" }}>
              {isPayable
                ? "Amount you owe to the government this period"
                : "Excess credit — will be adjusted against future liability"}
            </p>
          </motion.div>

          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Input GST (Credits)" value={formatIndian(inputTotal)} icon="🔽"
              accent="#1E40AF" textColor="#1E40AF" subtitle="On your purchases" />
            <MetricCard label="Output GST (Collected)" value={formatIndian(outputTotal)} icon="🔼"
              accent="#F59E0B" textColor="#92400E" subtitle="On your sales" />
          </div>

          {/* GST breakdowns */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ReportSection title="Input GST breakdown" subtitle="Credits on purchases">
              <div className="space-y-4">
                <GSTRow label="CGST" value={data.input.cgst} max={inputTotal || 1}
                  color="#1E40AF" dot="#3B82F6" delay={0} />
                <GSTRow label="SGST" value={data.input.sgst} max={inputTotal || 1}
                  color="#7C3AED" dot="#8B5CF6" delay={0.1} />
                <GSTRow label="IGST" value={data.input.igst} max={inputTotal || 1}
                  color="#0369A1" dot="#0EA5E9" delay={0.2} />
                <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold"
                  style={{ backgroundColor: "#DBEAFE" }}>
                  <span style={{ color: "#1E40AF" }}>Total Input GST</span>
                  <span style={{ color: "#1E40AF" }}>{formatIndian(inputTotal)}</span>
                </div>
              </div>
            </ReportSection>

            <ReportSection title="Output GST breakdown" subtitle="Collected on sales">
              <div className="space-y-4">
                <GSTRow label="CGST" value={data.output.cgst} max={outputTotal || 1}
                  color="#92400E" dot="#F59E0B" delay={0} />
                <GSTRow label="SGST" value={data.output.sgst} max={outputTotal || 1}
                  color="#065F46" dot="#10B981" delay={0.1} />
                <GSTRow label="IGST" value={data.output.igst} max={outputTotal || 1}
                  color="#9A3412" dot="#F97316" delay={0.2} />
                <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold"
                  style={{ backgroundColor: "#FEF3C7" }}>
                  <span style={{ color: "#92400E" }}>Total Output GST</span>
                  <span style={{ color: "#92400E" }}>{formatIndian(outputTotal)}</span>
                </div>
              </div>
            </ReportSection>
          </div>

          {/* Calculation card */}
          <ReportSection title="GST calculation" subtitle="How the net is derived">
            <div className="space-y-2.5">
              {[
                { label: "Output GST (Collected on sales)", value: formatIndian(outputTotal), color: "#92400E" },
                { label: "Input GST (Paid on purchases)", value: `− ${formatIndian(inputTotal)}`, color: "#1E40AF" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--medium-gray)" }}>{row.label}</span>
                  <span className="font-bold" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-3 text-base font-bold"
                style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--foreground)" }}>
                  {isPayable ? "Net GST Payable" : "Net GST Receivable"}
                </span>
                <span style={{ color: isPayable ? "#DC2626" : "#16A34A" }}>
                  {formatIndian(Math.abs(netPayable))}
                </span>
              </div>
            </div>
          </ReportSection>
        </>
      )}
    </div>
  );
};
