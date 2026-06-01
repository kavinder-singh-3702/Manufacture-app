"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { accountingService } from "@/src/services/accounting";
import { ApiError } from "@/src/lib/api-error";
import type { PartyOutstandingData } from "@/src/types/accounting";
import { MetricCardSkeleton, ReportSection, formatIndian } from "./MetricCard";

const AGING_BUCKETS = [
  { key: "bucket_0_30",   label: "0–30 days",  color: "#16A34A", bg: "#DCFCE7",  dot: "#22C55E",  hint: "Good standing" },
  { key: "bucket_31_60",  label: "31–60 days", color: "#CA8A04", bg: "#FEF9C3",  dot: "#EAB308",  hint: "Watch closely" },
  { key: "bucket_61_90",  label: "61–90 days", color: "#EA580C", bg: "#FFEDD5",  dot: "#F97316",  hint: "Concerning" },
  { key: "bucket_90_plus",label: "90+ days",   color: "#DC2626", bg: "#FEE2E2",  dot: "#EF4444",  hint: "Overdue" },
] as const;

export const PartyOutstandingReport = () => {
  const [partyType, setPartyType] = useState<"customer" | "supplier">("customer");
  const [data, setData] = useState<PartyOutstandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      setData(await accountingService.getPartyOutstanding({
        type: partyType,
        asOf: new Date().toISOString().slice(0, 10),
      }));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load outstanding data");
    } finally { setLoading(false); }
  }, [partyType]);

  useEffect(() => { load(); }, [load]);

  const total = data?.totalOutstanding ?? 0;
  const rows = data?.rows ?? [];

  const agingTotals = AGING_BUCKETS.map((b) => ({
    ...b,
    value: rows.reduce((s, r) => s + (r.aging[b.key] ?? 0), 0),
  }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
          Accounting
        </p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Party Outstanding</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>
          Aged receivables & payables as of today
        </p>
      </motion.div>

      {/* Type toggle */}
      <div className="flex items-center gap-2">
        {(["customer", "supplier"] as const).map((t) => {
          const active = partyType === t;
          return (
            <button key={t} type="button"
              onClick={() => setPartyType(t)}
              className="rounded-xl px-4 py-2.5 text-sm font-bold transition-all"
              style={{
                backgroundColor: active ? "var(--primary)" : "var(--surface)",
                color: active ? "#fff" : "var(--foreground)",
                border: active ? "none" : "1px solid var(--border)",
                boxShadow: active ? "var(--shadow-primary)" : "none",
              }}>
              {t === "customer" ? "👥 Customers (Receivables)" : "🏭 Suppliers (Payables)"}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          <span>{error}</span>
          <button type="button" onClick={load} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {loading ? <MetricCardSkeleton count={4} /> : (
        <>
          {/* Total outstanding hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
            className="rounded-3xl p-6 text-center"
            style={{
              background: partyType === "customer"
                ? "linear-gradient(135deg, #DBEAFE, #EFF6FF)"
                : "linear-gradient(135deg, #FEE2E2, #FEF2F2)",
              border: `1px solid ${partyType === "customer" ? "#BFDBFE" : "#FECACA"}`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: partyType === "customer" ? "#1E40AF" : "#991B1B" }}>
              Total {partyType === "customer" ? "Receivables" : "Payables"}
            </p>
            <p className="mt-3 text-5xl font-bold"
              style={{ color: partyType === "customer" ? "#1E40AF" : "#DC2626" }}>
              {formatIndian(total)}
            </p>
            <p className="mt-2 text-sm" style={{ color: partyType === "customer" ? "#1D4ED8" : "#B91C1C" }}>
              From {rows.length} {partyType === "customer" ? "customer" : "supplier"}{rows.length !== 1 ? "s" : ""}
            </p>
          </motion.div>

          {/* Aging summary */}
          <ReportSection title="Aging analysis" subtitle="Outstanding by time bucket">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {agingTotals.map((b, i) => {
                const pct = total > 0 ? ((b.value / total) * 100).toFixed(1) : "0.0";
                return (
                  <motion.div key={b.key}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="space-y-2 rounded-2xl p-4"
                    style={{ backgroundColor: b.bg, border: `1px solid ${b.dot}33` }}>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.dot }} />
                      <p className="text-xs font-semibold" style={{ color: b.color }}>{b.label}</p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: b.color }}>{formatIndian(b.value)}</p>
                    <p className="text-xs font-medium" style={{ color: b.color }}>{pct}% · {b.hint}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.07, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: b.dot }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ReportSection>

          {/* Party list */}
          {rows.length > 0 ? (
            <ReportSection title={`${partyType === "customer" ? "Customer" : "Supplier"} details`}
              subtitle={`${rows.length} ${partyType}${rows.length !== 1 ? "s" : ""} with outstanding balance`}>
              <div className="space-y-2.5">
                {rows.slice().sort((a, b) => b.totalOutstanding - a.totalOutstanding).map((row, i) => (
                  <motion.div key={row.partyId}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-4"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                        {row.partyName}
                      </p>
                      <p className="flex-shrink-0 text-base font-bold"
                        style={{ color: partyType === "customer" ? "#1E40AF" : "#DC2626" }}>
                        {formatIndian(row.totalOutstanding)}
                      </p>
                    </div>
                    {/* Aging chips */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {AGING_BUCKETS.map((b) => {
                        const val = row.aging[b.key];
                        if (!val) return null;
                        return (
                          <span key={b.key}
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: b.bg, color: b.color }}>
                            {b.label}: {formatIndian(val)}
                          </span>
                        );
                      })}
                    </div>
                    {/* Mini aging bar */}
                    <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full gap-0.5">
                      {AGING_BUCKETS.map((b) => {
                        const val = row.aging[b.key];
                        const pct = row.totalOutstanding > 0 ? (val / row.totalOutstanding) * 100 : 0;
                        return pct > 0 ? (
                          <motion.div key={b.key}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{ backgroundColor: b.dot, minWidth: "4px" }}
                          />
                        ) : null;
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ReportSection>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ border: "1px dashed var(--border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                No outstanding {partyType === "customer" ? "receivables" : "payables"}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
                All accounts are settled for today.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
