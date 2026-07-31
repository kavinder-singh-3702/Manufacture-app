"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { internalInventoryService, type InternalInventoryDashboard } from "@/src/services/internalInventory";
import { ApiError } from "@/src/lib/api-error";
import { tintBg } from "@/src/lib/color";
import { MetricCardSkeleton, ReportSection, formatIndian } from "./MetricCard";

/**
 * The Accounts tab's "Internal Stock" mode — mirrors the app's
 * `InternalInventoryModeView.tsx`: an overview strip (items / units / value /
 * low+out), a low-stock queue, and shortcuts into the full internal-inventory
 * page (no dedicated create/adjust modal here — that flow already lives on
 * /dashboard/internal-inventory, so this links into it rather than
 * duplicating it).
 */
export const InternalStockModeView = () => {
  const [data, setData] = useState<InternalInventoryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await internalInventoryService.getDashboard());
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load internal stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lowOutCount = data ? data.lowStockCount + data.outOfStockCount : 0;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger-strong)" }}>
          <span>{error}</span>
          <button type="button" onClick={load} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      <ReportSection title="Internal stock overview" subtitle="Tracked independently from marketplace listings">
        {loading ? (
          <MetricCardSkeleton count={4} />
        ) : data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Items", value: data.totalItems.toLocaleString("en-IN") },
              { label: "Units", value: data.totalQuantity.toLocaleString("en-IN") },
              { label: "Value", value: formatIndian(data.totalValue) },
              { label: "Low · Out", value: `${data.lowStockCount} · ${data.outOfStockCount}` },
            ].map((m) => (
              <div key={m.label} className="rounded-xl p-3" style={{ backgroundColor: "var(--background)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>{m.label}</p>
                <p className="mt-1 text-lg font-bold" style={{ color: "var(--foreground)" }}>{m.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/internal-inventory"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--primary)" }}
          >
            + Add internal item
          </Link>
          <Link
            href="/dashboard/internal-inventory"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            Open inventory
          </Link>
        </div>
      </ReportSection>

      <ReportSection
        title="Low stock queue"
        subtitle={loading ? undefined : lowOutCount > 0 ? `${lowOutCount} item${lowOutCount !== 1 ? "s" : ""} need attention` : "Everything is stocked"}
      >
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
            ))}
          </div>
        ) : data && data.lowStockItems.length > 0 ? (
          <div className="space-y-2">
            {data.lowStockItems.slice(0, 5).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: tintBg("var(--warning)"), border: "1px solid var(--warning)" }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--warning)" }}>{item.name}</p>
                  <p className="text-xs" style={{ color: "var(--warning)" }}>
                    {item.onHandQty} / {item.reorderLevel} {item.unit}
                  </p>
                </div>
                <Link
                  href="/dashboard/internal-inventory"
                  className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold"
                  style={{ backgroundColor: "var(--warning)", color: "#fff" }}
                >
                  Add stock
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm" style={{ color: "var(--medium-gray)" }}>Nothing is running low.</p>
        )}
      </ReportSection>
    </div>
  );
};
