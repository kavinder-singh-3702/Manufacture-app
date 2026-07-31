"use client";

import { useEffect, useState } from "react";
import { adService, AdCampaign, AdInsights, AdPlacement } from "@/src/services/ad";
import { ApiError } from "@/src/lib/api-error";
import { DonutChart, GroupedBars, FunnelBar, type DonutSegment, type BarGroup } from "@/src/components/ui/charts";
import { Drawer, DrawerHeader, PLACEMENTS } from "./adStudioShared";

const INSIGHT_RANGES: { key: string; label: string; days: number | null }[] = [
  { key: "7",   label: "7d",  days: 7 },
  { key: "30",  label: "30d", days: 30 },
  { key: "90",  label: "90d", days: 90 },
  { key: "all", label: "All", days: null },
];

export const InsightsDrawer = ({ campaign, onClose }: { campaign: AdCampaign; onClose: () => void }) => {
  const [insights, setInsights] = useState<AdInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const days = INSIGHT_RANGES.find((r) => r.key === rangeKey)?.days ?? null;
        const range = days ? { from: new Date(Date.now() - days * 86400000).toISOString() } : undefined;
        const data = await adService.getInsights(campaign.id, range);
        if (active) setInsights(data);
      } catch (err) {
        if (active) setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load insights");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [campaign.id, rangeKey]);

  const impressions = insights?.summary.impression?.count ?? 0;
  const clicks = insights?.summary.click?.count ?? 0;
  const dismisses = insights?.summary.dismiss?.count ?? 0;
  const dismissRate = insights?.dismissRate ?? 0;
  const fatigued = dismissRate >= 20;
  const attribution = insights?.attribution;
  const byPlacement = (insights?.byPlacement ?? []).filter((p) => p.impression + p.click + p.dismiss > 0);

  const cards = insights ? [
    { label: "Impressions", value: impressions.toLocaleString("en-IN"), sub: `${insights.summary.impression?.uniqueUsers ?? 0} users`, color: "var(--primary)" },
    { label: "Clicks",      value: clicks.toLocaleString("en-IN"),      sub: `${insights.summary.click?.uniqueUsers ?? 0} users`, color: "#16A34A" },
    { label: "CTR",         value: `${insights.ctr.toFixed(1)}%`, sub: "click-through", color: "#7C3AED" },
    { label: "Dismiss rate", value: `${dismissRate.toFixed(1)}%`, sub: fatigued ? "⚠ creative fatigue" : `${dismisses} dismisses`, color: fatigued ? "#DC2626" : "#92400E" },
  ] : [];

  // Pivot the flat byDay events into one group per day with each event type.
  const barGroups: BarGroup[] = insights
    ? Object.values(
        insights.byDay.reduce((acc, d) => {
          const key = d.day.slice(0, 10);
          acc[key] ??= { label: new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), values: {} };
          acc[key].values[d.type] = (acc[key].values[d.type] ?? 0) + d.count;
          return acc;
        }, {} as Record<string, BarGroup>)
      ).sort((a, b) => a.label.localeCompare(b.label))
    : [];

  const ctrDonut: DonutSegment[] = [
    { label: "Clicked", value: clicks, color: "#16A34A" },
    { label: "Did not click", value: Math.max(0, impressions - clicks), color: "var(--border)" },
  ];

  const placementLabel = (p: AdPlacement) => PLACEMENTS.find((x) => x.key === p)?.label ?? p;

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader title="Campaign insights" subtitle={campaign.creative?.title || campaign.name} onClose={onClose} />
      <div className="p-5 space-y-4">
        {/* Date range */}
        <div className="flex gap-1.5">
          {INSIGHT_RANGES.map((r) => (
            <button key={r.key} onClick={() => setRangeKey(r.key)}
              className="flex-1 rounded-lg py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: rangeKey === r.key ? "var(--primary)" : "var(--surface)",
                color: rangeKey === r.key ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />)}
          </div>
        ) : error ? (
          <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>
        ) : insights ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {cards.map((c) => (
                <div key={c.label} className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: c.color }}>{c.label}</p>
                  <p className="mt-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>{c.value}</p>
                  <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Lead attribution */}
            {attribution && attribution.clickers > 0 && (
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Lead attribution</p>
                  <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>{attribution.clickToLeadRate.toFixed(1)}% of clickers converted</p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Leads", value: attribution.leads, color: "#16A34A" },
                    { label: "Quotes", value: attribution.quotes, color: "var(--foreground)" },
                    { label: "Inquiries", value: attribution.inquiries, color: "var(--foreground)" },
                    { label: "Orders", value: attribution.orders, color: "#7C3AED" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-2" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                      <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] font-semibold" style={{ color: "var(--medium-gray)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px]" style={{ color: "var(--medium-gray)" }}>
                  Conversions on the promoted product by users who clicked this ad.
                </p>
              </div>
            )}

            {/* Per-placement breakdown */}
            {byPlacement.length > 0 && (
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>By placement</p>
                <div className="space-y-2">
                  {byPlacement.map((p) => (
                    <div key={p.placement} className="rounded-xl p-3" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{placementLabel(p.placement)}</p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>{p.ctr.toFixed(1)}% CTR</span>
                      </div>
                      <div className="mt-1.5 flex gap-4 text-[11px]" style={{ color: "var(--medium-gray)" }}>
                        <span>👁 {p.impression.toLocaleString("en-IN")}</span>
                        <span style={{ color: "#16A34A" }}>👆 {p.click.toLocaleString("en-IN")}</span>
                        <span style={{ color: "#DC2626" }}>✕ {p.dismiss.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTR donut + conversion funnel */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col items-center justify-center rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-2 self-start text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Click-through</p>
                <DonutChart segments={ctrDonut} centerValue={`${insights.ctr.toFixed(1)}%`} centerLabel="CTR" size={120} thickness={14} />
              </div>
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Funnel</p>
                <FunnelBar rows={[
                  { label: "Impressions", value: impressions, color: "var(--primary)" },
                  { label: "Clicks", value: clicks, color: "#16A34A" },
                  { label: "Dismisses", value: dismisses, color: "#DC2626" },
                ]} />
              </div>
            </div>

            {/* Daily trend */}
            {barGroups.length > 0 ? (
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Daily activity</p>
                <GroupedBars
                  groups={barGroups}
                  series={[
                    { key: "impression", label: "Impressions", color: "var(--primary)" },
                    { key: "click", label: "Clicks", color: "#16A34A" },
                    { key: "dismiss", label: "Dismisses", color: "#DC2626" },
                  ]}
                />
              </div>
            ) : (
              <p className="rounded-2xl p-4 text-center text-sm" style={{ border: "1px dashed var(--border)", color: "var(--medium-gray)" }}>
                No daily activity recorded yet.
              </p>
            )}
          </>
        ) : null}
      </div>
    </Drawer>
  );
};
