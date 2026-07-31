"use client";

/**
 * Ad Studio — campaign list, portfolio summary, search/filter. The campaign
 * wizard and insights view used to live in this same 1486-line file; they're
 * now CampaignDrawer.tsx and InsightsDrawer.tsx, with shared drawer
 * primitives (Drawer/DrawerHeader/Label/Field/Section/ToggleRow/PLACEMENTS)
 * in adStudioShared.tsx.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adService, AdCampaign, AdCampaignStatus } from "@/src/services/ad";
import { ApiError } from "@/src/lib/api-error";
import { DonutChart, DonutLegend, AnimatedNumber, type DonutSegment } from "@/src/components/ui/charts";
import { tintBg } from "@/src/lib/color";
import { PageHeader } from "@/src/components/ui/Surface";
import { PLACEMENTS } from "./adStudioShared";
import { CampaignDrawer } from "./CampaignDrawer";
import { InsightsDrawer } from "./InsightsDrawer";

const PAGE_SIZE = 24;

const relativeDate = (iso?: string) => {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "today";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// A single accent per status drives both the tinted badge (via `tintBg`) and
// the label color — was a hand-picked color/bg pastel pair per status,
// hardcoded light-only and illegible in dark mode.
const STATUS_ACCENT: Record<AdCampaignStatus, string> = {
  draft:     "#6B7280",
  active:    "#166534",
  paused:    "#92400E",
  completed: "#1E40AF",
  archived:  "#6B7280",
};
const STATUS_LABEL: Record<AdCampaignStatus, string> = {
  draft: "Draft", active: "Active", paused: "Paused", completed: "Completed", archived: "Archived",
};

const STATUS_CHIPS: { key: AdCampaignStatus | "all"; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "active",   label: "Active" },
  { key: "paused",   label: "Paused" },
  { key: "draft",    label: "Draft" },
  { key: "archived", label: "Archived" },
];

export const AdStudioPanel = () => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdCampaignStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdCampaign | null>(null);
  const [insightsFor, setInsightsFor] = useState<AdCampaign | null>(null);
  const [summary, setSummary] = useState<Record<AdCampaignStatus, number> | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accurate per-status totals (independent of the active filter / pagination).
  const loadSummary = useCallback(async () => {
    const statuses: AdCampaignStatus[] = ["active", "paused", "draft", "completed", "archived"];
    const results = await Promise.allSettled(
      statuses.map((s) => adService.listCampaigns({ status: s, limit: 1 }))
    );
    const next = {} as Record<AdCampaignStatus, number>;
    statuses.forEach((s, i) => {
      const r = results[i];
      next[s] = r.status === "fulfilled" ? (r.value.pagination?.total ?? 0) : 0;
    });
    setSummary(next);
  }, []);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await adService.listCampaigns({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setCampaigns((prev) => append ? [...prev, ...(res.campaigns ?? [])] : (res.campaigns ?? []));
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(0); }, [load]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [searchInput]);

  const runLifecycle = async (c: AdCampaign, action: "activate" | "pause" | "stop") => {
    setActionId(c.id);
    setError(null);
    try {
      if (action === "activate") await adService.activateCampaign(c.id);
      else if (action === "pause") await adService.pauseCampaign(c.id);
      else await adService.stopCampaign(c.id);
      load(0);
      loadSummary();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title={
          <>
            Ad Studio
            {!loading && (
              <span className="ml-2.5 rounded-full px-2.5 py-0.5 text-sm font-semibold align-middle"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                {pagination.total.toLocaleString("en-IN")}
              </span>
            )}
          </>
        }
        actions={
          <button onClick={() => setCreateOpen(true)}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)" }}>
            + New campaign
          </button>
        }
      />

      {/* Portfolio summary */}
      {summary && (() => {
        const segs: DonutSegment[] = [
          { label: "Active", value: summary.active, color: "#16A34A" },
          { label: "Paused", value: summary.paused, color: "#F59E0B" },
          { label: "Draft", value: summary.draft, color: "#9CA3AF" },
          { label: "Archived", value: summary.archived, color: "#6B7280" },
        ];
        const totalCampaigns = Object.values(summary).reduce((a, b) => a + b, 0);
        const liveSegs = segs.filter((s) => s.value > 0);
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 rounded-2xl p-5 sm:grid-cols-[auto_1fr]"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <div className="flex items-center gap-5">
              <DonutChart segments={liveSegs.length ? liveSegs : segs} centerValue={totalCampaigns} centerLabel="Total" size={120} thickness={14} />
              <div className="hidden sm:block min-w-[140px]"><DonutLegend segments={segs} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:self-center">
              {[
                { label: "Active", value: summary.active, accent: "#16A34A", icon: "🟢" },
                { label: "Paused", value: summary.paused, accent: "#F59E0B", icon: "⏸️" },
                { label: "Draft", value: summary.draft, accent: "#6B7280", icon: "✏️" },
                { label: "Archived", value: summary.archived, accent: "#9CA3AF", icon: "📁" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>{s.icon} {s.label}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: s.accent }}><AnimatedNumber value={s.value} /></p>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Search + filters */}
      <div className="space-y-2">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
            <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search campaigns…"
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_CHIPS.map((chip) => (
            <button key={chip.key} onClick={() => setStatusFilter(chip.key)}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: statusFilter === chip.key ? "var(--primary)" : "var(--surface)",
                color: statusFilter === chip.key ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger-strong)" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !campaigns.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">📣</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No campaigns</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>Create your first ad campaign to promote products.</p>
          <button onClick={() => setCreateOpen(true)} className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
            + New campaign
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c, i) => {
              const statusAccent = STATUS_ACCENT[c.status];
              const banner = c.creative?.bannerImageUrl ?? c.product?.images?.[0]?.url;
              const busy = actionId === c.id;
              return (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex flex-col overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  {/* Banner */}
                  <div className="relative h-28" style={{ backgroundColor: "var(--surface)" }}>
                    {banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async" src={banner} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">📦</div>
                    )}
                    <span className="absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: tintBg(statusAccent), color: statusAccent }}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div>
                      <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                        {c.creative?.title || c.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>
                        {c.product?.name ?? "No product"} · {relativeDate(c.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.placements.map((p) => (
                        <span key={p} className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)", border: "1px solid var(--border)" }}>
                          {PLACEMENTS.find((x) => x.key === p)?.label ?? p}
                        </span>
                      ))}
                    </div>
                    {/* Actions */}
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                      {(c.status === "draft" || c.status === "paused") && (
                        <ActBtn onClick={() => runLifecycle(c, "activate")} disabled={busy} color="var(--success)">Activate</ActBtn>
                      )}
                      {c.status === "active" && (
                        <ActBtn onClick={() => runLifecycle(c, "pause")} disabled={busy} color="#92400E">Pause</ActBtn>
                      )}
                      <ActBtn onClick={() => setInsightsFor(c)} color="var(--primary)">Insights</ActBtn>
                      {c.status !== "archived" && (
                        <ActBtn onClick={() => setEditing(c)} color="var(--foreground)">Edit</ActBtn>
                      )}
                      {c.status !== "archived" && (
                        <ActBtn onClick={() => runLifecycle(c, "stop")} disabled={busy} color="var(--error)">Archive</ActBtn>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {pagination.hasMore && (
            <div className="flex justify-center pt-1">
              <button onClick={() => load(pagination.offset + PAGE_SIZE, true)} disabled={loadingMore}
                className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Create / edit drawer */}
      <AnimatePresence>
        {(createOpen || editing) && (
          <CampaignDrawer
            campaign={editing}
            onClose={() => { setCreateOpen(false); setEditing(null); }}
            onSaved={() => { setCreateOpen(false); setEditing(null); load(0); loadSummary(); }}
          />
        )}
      </AnimatePresence>

      {/* Insights drawer */}
      <AnimatePresence>
        {insightsFor && (
          <InsightsDrawer campaign={insightsFor} onClose={() => setInsightsFor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const ActBtn = ({ children, onClick, disabled, color }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; color: string;
}) => (
  <button onClick={onClick} disabled={disabled}
    className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
    style={{ backgroundColor: tintBg(color), color }}>
    {children}
  </button>
);
