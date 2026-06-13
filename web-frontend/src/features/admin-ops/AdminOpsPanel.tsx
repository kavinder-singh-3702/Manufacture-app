"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService, AdminOpsRequest } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";

const PAGE_SIZE = 25;

const relativeDate = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "today";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  urgent: { color: "#991B1B", bg: "#FEE2E2" },
  high:   { color: "#92400E", bg: "#FEF3C7" },
  normal: { color: "#1E40AF", bg: "#DBEAFE" },
  low:    { color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_COLOR: Record<string, string> = {
  pending:     "#D97706",
  in_review:   "#1E40AF",
  scheduled:   "#5B21B6",
  in_progress: "#0E7490",
  completed:   "#166534",
  launched:    "#166534",
  closed:      "#166534",
  cancelled:   "#6B7280",
  rejected:    "#991B1B",
};

const KIND_CHIPS = [
  { key: "all",           label: "All" },
  { key: "service",       label: "Service requests" },
  { key: "business_setup", label: "Startup setup" },
] as const;

const BUCKET_CHIPS = [
  { key: "all",      label: "All status" },
  { key: "open",     label: "Open" },
  { key: "closed",   label: "Closed" },
  { key: "rejected", label: "Rejected" },
] as const;

type KindKey = typeof KIND_CHIPS[number]["key"];
type BucketKey = typeof BUCKET_CHIPS[number]["key"];

export const AdminOpsPanel = () => {
  const [requests, setRequests] = useState<AdminOpsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<KindKey>("all");
  const [bucketFilter, setBucketFilter] = useState<BucketKey>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionTarget, setActionTarget] = useState<AdminOpsRequest | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [actionSaving, setActionSaving] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await adminService.listOpsRequests({
        kind: kindFilter === "all" ? undefined : kindFilter,
        statusBucket: bucketFilter === "all" ? undefined : bucketFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
        sort: "updatedAt:desc",
      });
      setRequests((prev) => append ? [...prev, ...(res.requests ?? [])] : (res.requests ?? []));
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [kindFilter, bucketFilter, search]);

  useEffect(() => { load(0); }, [load]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [searchInput]);

  const openAction = (req: AdminOpsRequest, status: string) => {
    setActionTarget(req);
    setActionStatus(status);
    setActionNote("");
  };

  const submitAction = async () => {
    if (!actionTarget) return;
    setActionSaving(true);
    try {
      const payload = {
        status: actionStatus,
        reason: actionNote || "Updated by admin",
        note: actionNote || undefined,
        contextCompanyId: actionTarget.company?.id,
      };
      if (actionTarget.kind === "service") {
        await adminService.updateServiceRequestWorkflow(actionTarget.id, payload);
      } else {
        await adminService.updateBusinessSetupRequestWorkflow(actionTarget.id, payload);
      }
      setActionTarget(null);
      load(0);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionSaving(false);
    }
  };

  const SERVICE_NEXT: Record<string, string> = {
    pending: "in_review", in_review: "scheduled", scheduled: "in_progress", in_progress: "completed",
  };
  const BUSINESS_NEXT: Record<string, string> = {
    new: "contacted", contacted: "planning", planning: "onboarding", onboarding: "launched", launched: "closed",
  };
  const getNext = (r: AdminOpsRequest) =>
    r.kind === "service" ? SERVICE_NEXT[r.status] : BUSINESS_NEXT[r.status];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Ops Console</h1>
          {!loading && <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>{pagination.total.toLocaleString("en-IN")} requests</p>}
        </div>
      </motion.div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
            <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search requests…"
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KIND_CHIPS.map((chip) => (
            <button key={chip.key} onClick={() => setKindFilter(chip.key)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: kindFilter === chip.key ? "var(--primary)" : "var(--surface)",
                color: kindFilter === chip.key ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {chip.label}
            </button>
          ))}
          <div className="w-px" style={{ backgroundColor: "var(--border)" }} />
          {BUCKET_CHIPS.map((chip) => (
            <button key={chip.key} onClick={() => setBucketFilter(chip.key)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: bucketFilter === chip.key ? "#5B21B6" : "var(--surface)",
                color: bucketFilter === chip.key ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !requests.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">📋</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No requests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r, i) => {
            const pStyle = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.normal;
            const sColor = STATUS_COLOR[r.status] ?? "var(--medium-gray)";
            const nextStatus = getNext(r);
            return (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="rounded-xl px-4 py-3.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: r.kind === "service" ? "#DBEAFE" : "#EDE9FE", color: r.kind === "service" ? "#1E40AF" : "#5B21B6" }}>
                        {r.kind === "service" ? "Service" : "Startup"}
                      </span>
                      <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: pStyle.bg, color: pStyle.color }}>
                        {r.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold" style={{ color: "var(--foreground)" }}>{r.title}</p>
                    <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                      {r.company?.displayName ?? "—"} · {relativeDate(r.createdAt)}
                      {r.assignedTo ? ` · Assigned to ${r.assignedTo.displayName ?? r.assignedTo.email}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold capitalize px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${sColor}18`, color: sColor }}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                    {nextStatus && (
                      <button onClick={() => openAction(r, nextStatus)}
                        className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                        style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(20,141,178,0.2)" }}>
                        → {nextStatus.replace(/_/g, " ")}
                      </button>
                    )}
                  </div>
                </div>
                {r.preview?.description && (
                  <p className="mt-2 text-xs line-clamp-1" style={{ color: "var(--medium-gray)" }}>
                    {r.preview.description}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {pagination.hasMore && (
        <div className="flex justify-center">
          <button onClick={() => load(pagination.offset + PAGE_SIZE, true)} disabled={loadingMore}
            className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {/* Status update modal */}
      <AnimatePresence>
        {actionTarget && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActionTarget(null)} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>Advance status</p>
              <p className="mt-1 text-sm truncate" style={{ color: "var(--medium-gray)" }}>{actionTarget.title}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: "var(--medium-gray)" }}>
                  {actionTarget.status.replace(/_/g, " ")}
                </span>
                <span style={{ color: "var(--medium-gray)" }}>→</span>
                <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                  {actionStatus.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                  Note (optional)
                </label>
                <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} rows={2}
                  placeholder="Add a note for this status change…"
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setActionTarget(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  Cancel
                </button>
                <button onClick={submitAction} disabled={actionSaving}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}>
                  {actionSaving ? "Saving…" : "Confirm advance"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
