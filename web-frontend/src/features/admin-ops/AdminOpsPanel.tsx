"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { adminService, type AdminOpsCounts, type AdminOpsRequest } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";
import { PageHeader } from "@/src/components/ui/Surface";
import { Sheet } from "@/src/components/ui/Sheet";
import { useIsDesktop } from "@/src/hooks/useMediaQuery";
import {
  SERVICE_TYPE_LABELS,
  TERMINAL_STATUSES,
  priorityBg,
  priorityTone,
  relativeAge,
  slaState,
  statusBg,
  statusTone,
  toStatusLabel,
} from "./opsMeta";
import { DEFAULT_OPS_FILTERS, OpsFilterSheet, countActiveFilters, type OpsFilters } from "./OpsFilterSheet";
import { OpsRequestDetail } from "./OpsRequestDetail";

const PAGE_SIZE = 25;

type Tile = "open" | "urgent" | "unassigned" | "closed";

export const AdminOpsPanel = () => {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const [requests, setRequests] = useState<AdminOpsRequest[]>([]);
  const [counts, setCounts] = useState<AdminOpsCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [bucket, setBucket] = useState<"all" | "open" | "closed">("all");
  const [assignedTo, setAssignedTo] = useState<"" | "unassigned">("");
  const [filters, setFilters] = useState<OpsFilters>(DEFAULT_OPS_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [openDesktopId, setOpenDesktopId] = useState<{ id: string; kind: AdminOpsRequest["kind"] } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await adminService.listOpsRequests({
        kind: filters.kind === "all" ? undefined : filters.kind,
        statusBucket: bucket === "all" ? undefined : bucket,
        priority: filters.priority === "all" ? undefined : filters.priority,
        serviceType: filters.serviceType === "all" ? undefined : filters.serviceType,
        assignedTo: assignedTo || undefined,
        sort: filters.sort,
        from: filters.from || undefined,
        to: filters.to || undefined,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setRequests((prev) => (append ? [...prev, ...(res.requests ?? [])] : (res.requests ?? [])));
      setCounts(res.counts ?? null);
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, bucket, assignedTo, search]);

  useEffect(() => { load(0); }, [load]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  // Infinite scroll — replaces the old "Load more" button.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !pagination.hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) load(pagination.offset + PAGE_SIZE, true);
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [pagination.hasMore, pagination.offset, loading, loadingMore, load]);

  const toggleTile = (tile: Tile) => {
    if (tile === "open") setBucket((b) => (b === "open" ? "all" : "open"));
    if (tile === "closed") setBucket((b) => (b === "closed" ? "all" : "closed"));
    if (tile === "urgent") setFilters((f) => ({ ...f, priority: f.priority === "urgent" ? "all" : "urgent" }));
    if (tile === "unassigned") setAssignedTo((a) => (a === "unassigned" ? "" : "unassigned"));
  };
  const isTileActive = (tile: Tile) =>
    (tile === "open" && bucket === "open") ||
    (tile === "closed" && bucket === "closed") ||
    (tile === "urgent" && filters.priority === "urgent") ||
    (tile === "unassigned" && assignedTo === "unassigned");

  const openDetail = (r: AdminOpsRequest) => {
    if (isDesktop) setOpenDesktopId({ id: r.id, kind: r.kind });
    else router.push(`/admin/ops/detail?id=${encodeURIComponent(r.id)}&kind=${r.kind}`);
  };

  const handleChanged = () => load(0);

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(bucket !== "all" ? [{ key: "bucket", label: bucket === "open" ? "Open" : "Closed", onRemove: () => setBucket("all") }] : []),
    ...(assignedTo ? [{ key: "assigned", label: "Unassigned", onRemove: () => setAssignedTo("") }] : []),
    ...(filters.kind !== "all" ? [{ key: "kind", label: filters.kind === "service" ? "Service" : "Startup", onRemove: () => setFilters((f) => ({ ...f, kind: "all" })) }] : []),
    ...(filters.priority !== "all" ? [{ key: "priority", label: `${filters.priority} priority`, onRemove: () => setFilters((f) => ({ ...f, priority: "all" })) }] : []),
    ...(filters.serviceType !== "all" ? [{ key: "serviceType", label: SERVICE_TYPE_LABELS[filters.serviceType], onRemove: () => setFilters((f) => ({ ...f, serviceType: "all" })) }] : []),
    ...(filters.sort !== "updatedAt:desc" ? [{ key: "sort", label: "Custom sort", onRemove: () => setFilters((f) => ({ ...f, sort: "updatedAt:desc" })) }] : []),
    ...(filters.from ? [{ key: "from", label: `From ${filters.from}`, onRemove: () => setFilters((f) => ({ ...f, from: "" })) }] : []),
    ...(filters.to ? [{ key: "to", label: `To ${filters.to}`, onRemove: () => setFilters((f) => ({ ...f, to: "" })) }] : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <>
            Ops Console
            {!loading && counts && (
              <span className="ml-2.5 rounded-full px-2.5 py-0.5 text-sm font-semibold align-middle"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                {counts.total.toLocaleString("en-IN")}
              </span>
            )}
          </>
        }
      />

      {/* Search */}
      <div className="relative">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
          <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search requests, contacts, companies…"
          className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
      </div>

      {/* Summary tiles — double as quick filters, replacing the two always-on
          chip rows the old panel had (which alone ate ~1/3 of a phone screen). */}
      <div className="grid grid-cols-4 gap-2">
        {([
          { tile: "open" as Tile, label: "Open", value: counts?.open ?? 0, tone: "#1E40AF" },
          { tile: "urgent" as Tile, label: "Urgent", value: counts?.urgent ?? 0, tone: "var(--danger-strong)" },
          { tile: "unassigned" as Tile, label: "Unassigned", value: counts?.unassigned ?? 0, tone: "var(--warning)" },
          { tile: "closed" as Tile, label: "Closed", value: counts?.closed ?? 0, tone: "var(--success)" },
        ]).map((t) => {
          const active = isTileActive(t.tile);
          return (
            <button key={t.tile} type="button" onClick={() => toggleTile(t.tile)}
              className="rounded-xl px-2.5 py-2.5 text-left transition-all"
              style={{
                border: active ? `1px solid ${t.tone}` : "1px solid var(--border)",
                backgroundColor: active ? `color-mix(in srgb, ${t.tone} 12%, transparent)` : "var(--card)",
              }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: active ? t.tone : "var(--medium-gray)" }}>{t.label}</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums" style={{ color: active ? t.tone : "var(--foreground)" }}>
                {counts ? t.value.toLocaleString("en-IN") : "—"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters button + removable active-filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => setFilterSheetOpen(true)}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-opacity hover:opacity-70"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
          ⚙ Filters
          {countActiveFilters(filters) > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
              {countActiveFilters(filters)}
            </span>
          )}
        </button>
        {activeChips.map((chip) => (
          <button key={chip.key} type="button" onClick={chip.onRemove}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-opacity hover:opacity-70"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
            {chip.label} ✕
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger-strong)", color: "var(--danger-strong)" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !requests.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">📋</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No requests found</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>Try adjusting your filters or search.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          <div className="hidden grid-cols-[1fr_90px_140px_100px_110px_90px] gap-3 px-4 py-2.5 sm:grid"
            style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            {["Request", "Kind", "Company", "Priority", "Status", "Updated"].map((h) => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>{h}</p>
            ))}
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {requests.map((r, i) => {
              const breached = slaState(r.slaDueAt, TERMINAL_STATUSES.has(r.status)) === "breached";
              return (
                <motion.button key={r.id} type="button" onClick={() => openDetail(r)}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="grid w-full grid-cols-1 gap-1 px-4 py-3 text-left transition-colors hover:bg-[var(--background)] sm:grid-cols-[1fr_90px_140px_100px_110px_90px] sm:items-center sm:gap-3"
                  style={{ backgroundColor: "var(--card)" }}>
                  {/* Title + mobile meta line */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: statusTone(r.status) }} />
                      <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{r.title}</p>
                      {(r.priority === "urgent" || r.priority === "high") && (
                        <span className="flex-shrink-0 text-xs" title={`${r.priority} priority`}>⚑</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs sm:hidden" style={{ color: "var(--medium-gray)" }}>
                      {r.kind === "service" ? "Service" : "Startup"} · {r.company?.displayName ?? "—"} · {relativeAge(r.updatedAt)}
                      {breached && <span className="ml-1.5 font-bold" style={{ color: "var(--danger-strong)" }}>· SLA breached</span>}
                    </p>
                  </div>
                  <p className="hidden text-xs font-semibold capitalize sm:block" style={{ color: "var(--medium-gray)" }}>
                    {r.kind === "service" ? "Service" : "Startup"}
                  </p>
                  <p className="hidden truncate text-xs sm:block" style={{ color: "var(--medium-gray)" }}>{r.company?.displayName ?? "—"}</p>
                  <span className="hidden w-fit rounded-full px-2 py-0.5 text-[10px] font-bold capitalize sm:inline-block"
                    style={{ backgroundColor: priorityBg(r.priority), color: priorityTone(r.priority) }}>
                    {r.priority}
                  </span>
                  <span className="hidden w-fit rounded-full px-2 py-0.5 text-[10px] font-bold capitalize sm:inline-block"
                    style={{ backgroundColor: statusBg(r.status), color: statusTone(r.status) }}>
                    {toStatusLabel(r.status)}
                  </span>
                  <p className="hidden text-xs sm:block" style={{ color: breached ? "var(--danger-strong)" : "var(--medium-gray)" }}>
                    {breached ? "SLA overdue" : relativeAge(r.updatedAt)}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {pagination.hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-2">
          {loadingMore && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          )}
        </div>
      )}

      <OpsFilterSheet open={filterSheetOpen} filters={filters} onClose={() => setFilterSheetOpen(false)}
        onApply={(next) => { setFilters(next); setFilterSheetOpen(false); }} />

      {/* Detail — side sheet on desktop only; mobile navigates to the dedicated page */}
      <Sheet open={Boolean(openDesktopId)} onClose={() => setOpenDesktopId(null)} width={560}>
        {openDesktopId && (
          <OpsRequestDetail id={openDesktopId.id} kind={openDesktopId.kind} onClose={() => setOpenDesktopId(null)} onChanged={handleChanged} />
        )}
      </Sheet>
    </div>
  );
};
