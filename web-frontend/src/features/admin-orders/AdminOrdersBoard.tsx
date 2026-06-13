"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { adminService, AdminOpsRequest } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";
import { AnimatedNumber, DonutChart, DonutLegend, FunnelBar, type DonutSegment } from "@/src/components/ui/charts";

// Pipeline columns mirror the app's AdminOrders kanban — ops + business-setup
// requests bucketed by lifecycle stage.
type PipelineColumn = { key: string; label: string; accent: string; statuses: string[] };

const PIPELINE_COLUMNS: PipelineColumn[] = [
  { key: "pending",     label: "Pending",     accent: "#D97706", statuses: ["pending", "new"] },
  { key: "in_progress", label: "In progress", accent: "#0E7490", statuses: ["in_review", "scheduled", "in_progress", "contacted", "planning", "onboarding"] },
  { key: "completed",   label: "Completed",   accent: "#166534", statuses: ["completed", "launched", "closed"] },
  { key: "rejected",    label: "Rejected",    accent: "#991B1B", statuses: ["rejected", "cancelled"] },
];

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  urgent: { color: "#991B1B", bg: "#FEE2E2" },
  high:   { color: "#92400E", bg: "#FEF3C7" },
  normal: { color: "#1E40AF", bg: "#DBEAFE" },
  low:    { color: "#6B7280", bg: "#F3F4F6" },
};

const relativeDate = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "today";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const AdminOrdersBoard = () => {
  const [requests, setRequests] = useState<AdminOpsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull a wide page so all lifecycle stages are represented across columns.
      const res = await adminService.listOpsRequests({ search: search || undefined, limit: 100, offset: 0, sort: "updatedAt:desc" });
      setRequests(res.requests ?? []);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [searchInput]);

  const columns = useMemo(() =>
    PIPELINE_COLUMNS.map((col) => ({
      ...col,
      items: requests.filter((r) => col.statuses.includes(r.status)),
    })),
    [requests]
  );

  const summary = useMemo(() => {
    const count = (key: string) => columns.find((c) => c.key === key)?.items.length ?? 0;
    const total = requests.length;
    const service = requests.filter((r) => r.kind === "service").length;
    const startup = total - service;
    const completed = count("completed");
    const rejected = count("rejected");
    const resolved = completed + rejected;
    return {
      pending: count("pending"),
      inProgress: count("in_progress"),
      completed,
      rejected,
      total,
      service,
      startup,
      active: count("pending") + count("in_progress"),
      completionRate: resolved > 0 ? completed / resolved : 0,
    };
  }, [columns, requests]);

  const typeSegments: DonutSegment[] = [
    { label: "Service", value: summary.service, color: "#0E7490" },
    { label: "Startup", value: summary.startup, color: "#7C3AED" },
  ];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Orders Pipeline</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>
            Service &amp; startup requests by stage · <Link href="/admin/ops" className="font-semibold hover:opacity-70" style={{ color: "var(--primary)" }}>list view →</Link>
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
          style={{ border: "1px solid var(--border)", color: "var(--medium-gray)", backgroundColor: "var(--surface)" }}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </motion.div>

      <div className="relative max-w-md">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
          <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search pipeline…"
          className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={load} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {/* Pipeline analytics */}
      {!loading && summary.total > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Stage funnel */}
          <div className="rounded-2xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>Stage funnel</p>
            <p className="mb-4 mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>Requests by lifecycle stage</p>
            <FunnelBar rows={[
              { label: "Pending", value: summary.pending, color: "#D97706" },
              { label: "In progress", value: summary.inProgress, color: "#0E7490" },
              { label: "Completed", value: summary.completed, color: "#166534" },
              { label: "Rejected", value: summary.rejected, color: "#991B1B" },
            ]} />
          </div>

          {/* Type mix donut */}
          <div className="rounded-2xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>Request mix</p>
            <div className="mt-4 flex items-center gap-5">
              <DonutChart segments={typeSegments} centerValue={summary.total} centerLabel="Total" size={120} thickness={14} />
              <div className="flex-1"><DonutLegend segments={typeSegments} /></div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active", value: summary.active, accent: "#0E7490", icon: "🔵", suffix: "" },
              { label: "Completion", value: Math.round(summary.completionRate * 100), accent: "#166534", icon: "✅", suffix: "%" },
              { label: "Pending", value: summary.pending, accent: "#D97706", icon: "⏳", suffix: "" },
              { label: "Total", value: summary.total, accent: "var(--primary)", icon: "🗂️", suffix: "" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col justify-between rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>{s.label}</p>
                  <span className="text-sm">{s.icon}</span>
                </div>
                <p className="mt-2 text-2xl font-bold" style={{ color: s.accent }}><AnimatedNumber value={s.value} />{s.suffix}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.key} className="flex flex-col rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.accent }} />
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{col.label}</p>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${col.accent}18`, color: col.accent }}>
                {loading ? "…" : col.items.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 p-2.5 min-h-24">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
                ))
              ) : col.items.length ? (
                col.items.map((r, i) => {
                  const p = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.normal;
                  return (
                    <motion.div key={r.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className="rounded-xl p-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderLeft: `3px solid ${col.accent}` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: r.kind === "service" ? "#DBEAFE" : "#EDE9FE", color: r.kind === "service" ? "#1E40AF" : "#5B21B6" }}>
                          {r.kind === "service" ? "Service" : "Startup"}
                        </span>
                        <span className="text-[9px] font-bold capitalize px-1.5 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>
                          {r.priority}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                        {r.company?.displayName ?? r.title}
                      </p>
                      <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "var(--medium-gray)" }}>{r.title}</p>
                      <p className="text-[11px] mt-1.5" style={{ color: "var(--medium-gray)" }}>
                        {r.status.replace(/_/g, " ")} · {relativeDate(r.updatedAt)}
                      </p>
                    </motion.div>
                  );
                })
              ) : (
                <p className="px-2 py-6 text-center text-xs" style={{ color: "var(--medium-gray)" }}>Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
