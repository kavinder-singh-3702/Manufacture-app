"use client";

import { tintBg } from "@/src/lib/color";
import { PageHeader } from "@/src/components/ui/Surface";
import { AccountingGuard } from "./AccountingGuard";
import { DateRangePicker } from "./DateRangePicker";
import { ReportSection } from "./MetricCard";
import { useAccountingDashboard } from "../hooks/useAccountingDashboard";

/** Minimal loading skeleton shared by both list sections on this page. */
const StockListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-12 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
    ))}
  </div>
);

/**
 * Single purpose: inventory signals — low stock alert and top-selling items
 * for the selected period. Both are book-side reads off `getDashboard()`,
 * merged onto one page since they're both "stock signals," via the shared
 * `useAccountingDashboard` hook (same payload the Overview and Working
 * capital pages consume).
 */
export const StockSignalsView = () => {
  const { range, setRange, data, loading, error, reload } = useAccountingDashboard();

  const lowStock = data?.lowStockProducts ?? [];
  const topItems = data?.topItems ?? [];

  return (
    <AccountingGuard>
      <div className="space-y-6">
        <PageHeader title="Stock Signals" />

        <DateRangePicker value={range} onChange={setRange} />

        {error && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            <span>{error}</span>
            <button type="button" onClick={reload} className="text-xs font-bold underline">Retry</button>
          </div>
        )}

        <ReportSection
          title="Low stock alert"
          subtitle={loading ? undefined : lowStock.length > 0 ? `${lowStock.length} product${lowStock.length !== 1 ? "s" : ""} need attention` : "Everything is stocked"}
        >
          {loading ? (
            <StockListSkeleton />
          ) : lowStock.length === 0 ? (
            <p className="py-4 text-center text-sm" style={{ color: "var(--medium-gray)" }}>Nothing is running low.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.productId} className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ backgroundColor: tintBg("var(--warning)"), border: "1px solid var(--warning)" }}>
                  <p className="truncate text-xs font-semibold" style={{ color: "var(--warning)" }}>{p.productName}</p>
                  <p className="ml-2 flex-shrink-0 text-xs" style={{ color: "var(--warning)" }}>
                    {p.onHandQty} {p.unit ?? "units"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ReportSection>

        <ReportSection title="Top items" subtitle="By quantity sold">
          {loading ? (
            <StockListSkeleton />
          ) : topItems.length === 0 ? (
            <p className="py-4 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No sales recorded in this period.</p>
          ) : (
            <div className="space-y-2">
              {topItems.slice(0, 5).map((p, i) => (
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
          )}
        </ReportSection>
      </div>
    </AccountingGuard>
  );
};
