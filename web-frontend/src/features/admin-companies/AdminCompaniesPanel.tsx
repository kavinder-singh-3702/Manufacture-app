"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService, AdminCompany } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";
import { useAuth } from "@/src/hooks/useAuth";
import { AnimatedNumber, DonutChart, DonutLegend, type DonutSegment } from "@/src/components/ui/charts";

type CompanyActionType = "active" | "inactive" | "archive" | "request-documents" | "hard-delete";

const ACTION_META: Record<CompanyActionType, {
  title: string;
  confirm: string;
  color: string;
  reasonLabel: string;
  reasonRequired: boolean;
  destructive?: boolean;
}> = {
  active:               { title: "Activate company",   confirm: "Activate",     color: "#166534", reasonLabel: "Reason (optional)",  reasonRequired: false },
  inactive:             { title: "Deactivate company", confirm: "Deactivate",   color: "#92400E", reasonLabel: "Reason (optional)",  reasonRequired: false },
  archive:              { title: "Archive company",    confirm: "Archive",      color: "#6B7280", reasonLabel: "Reason (optional)",  reasonRequired: false },
  "request-documents":  { title: "Request documents",  confirm: "Send request", color: "#0369A1", reasonLabel: "Message to owner (optional)", reasonRequired: false },
  "hard-delete":        { title: "Permanently delete", confirm: "Delete forever", color: "#991B1B", reasonLabel: "Reason (required, min 5 chars)", reasonRequired: true, destructive: true },
};

const SUMMARY_STATUSES = [
  { key: "active", label: "Active", color: "#16A34A" },
  { key: "pending-verification", label: "Pending", color: "#F59E0B" },
  { key: "inactive", label: "Inactive", color: "#9CA3AF" },
  { key: "archived", label: "Archived", color: "#6B7280" },
] as const;

const PAGE_SIZE = 25;

const relativeDate = (iso?: string) => {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "today";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const COMPLIANCE_STYLE: Record<string, { color: string; bg: string }> = {
  verified:   { color: "#166534", bg: "#DCFCE7" },
  pending:    { color: "#92400E", bg: "#FEF3C7" },
  rejected:   { color: "#991B1B", bg: "#FEE2E2" },
  unverified: { color: "#6B7280", bg: "#F3F4F6" },
  approved:   { color: "#166534", bg: "#DCFCE7" },
};

const STATUS_FILTER_CHIPS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending-verification", label: "Pending verification" },
  { key: "inactive", label: "Inactive" },
  { key: "archived", label: "Archived" },
] as const;

export const AdminCompaniesPanel = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super-admin";
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionTarget, setActionTarget] = useState<AdminCompany | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionType, setActionType] = useState<CompanyActionType>("active");
  const [actionSaving, setActionSaving] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accurate per-status totals across all companies (independent of the filter).
  const loadSummary = useCallback(async () => {
    const results = await Promise.allSettled(
      SUMMARY_STATUSES.map((s) => adminService.listCompanies({ status: s.key, limit: 1 }))
    );
    const next: Record<string, number> = {};
    SUMMARY_STATUSES.forEach((s, i) => {
      const r = results[i];
      next[s.key] = r.status === "fulfilled" ? (r.value.pagination?.total ?? 0) : 0;
    });
    setSummary(next);
  }, []);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await adminService.listCompanies({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
        sort: "updatedAt:desc",
      });
      setCompanies((prev) => append ? [...prev, ...(res.companies ?? [])] : (res.companies ?? []));
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load companies");
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

  const openAction = (company: AdminCompany, type: CompanyActionType) => {
    setActionTarget(company);
    setActionType(type);
    setActionReason("");
    setActionNotice(null);
  };

  const submitAction = async () => {
    if (!actionTarget) return;
    const meta = ACTION_META[actionType];
    const reason = actionReason.trim();
    if (meta.reasonRequired && reason.length < 5) {
      setActionNotice("Please enter a reason of at least 5 characters.");
      return;
    }
    setActionSaving(true);
    setActionNotice(null);
    try {
      const id = actionTarget.id;
      let toast = "";
      switch (actionType) {
        case "active":
        case "inactive":
          await adminService.setCompanyStatus(id, { status: actionType, reason: reason || undefined });
          toast = actionType === "active" ? "Company activated." : "Company deactivated.";
          break;
        case "archive":
          await adminService.archiveCompany(id, { reason: reason || undefined });
          toast = "Company archived.";
          break;
        case "request-documents":
          await adminService.requestCompanyDocuments(id, { message: reason || undefined });
          toast = "Document request sent to the company owner.";
          break;
        case "hard-delete":
          await adminService.hardDeleteCompany(id, { reason });
          toast = "Permanent deletion queued.";
          break;
      }
      setActionTarget(null);
      setFlash(toast);
      load(0);
      loadSummary();
    } catch (err) {
      setActionNotice(err instanceof ApiError || err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Companies</h1>
          {!loading && <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>{pagination.total.toLocaleString("en-IN")} total</p>}
        </div>
      </motion.div>

      {/* Status analytics */}
      {summary && (() => {
        const segs: DonutSegment[] = SUMMARY_STATUSES.map((s) => ({ label: s.label, value: summary[s.key] ?? 0, color: s.color }));
        const total = segs.reduce((a, s) => a + s.value, 0);
        const live = segs.filter((s) => s.value > 0);
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 rounded-2xl p-5 sm:grid-cols-[auto_1fr]"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <div className="flex items-center gap-5">
              <DonutChart segments={live.length ? live : segs} centerValue={total} centerLabel="Companies" size={120} thickness={14} />
              <div className="hidden sm:block min-w-[150px]"><DonutLegend segments={segs} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:self-center">
              {SUMMARY_STATUSES.map((s) => (
                <div key={s.key} className="rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--medium-gray)" }}>{s.label}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}><AnimatedNumber value={summary[s.key] ?? 0} /></p>
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
            placeholder="Search by company name or owner email…"
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER_CHIPS.map((chip) => (
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

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {/* Success flash */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7", color: "#065F46" }}>
            <span>{flash}</span>
            <button onClick={() => setFlash(null)} className="text-xs font-bold underline ml-4">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !companies.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">🏢</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No companies found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map((c, i) => {
            const cStyle = COMPLIANCE_STYLE[c.complianceStatus ?? "unverified"] ?? COMPLIANCE_STYLE.unverified;
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                {/* Avatar */}
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                  {(c.displayName[0] ?? "C").toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>{c.displayName}</p>
                    <span className="text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)", border: "1px solid var(--border)" }}>
                      {c.type}
                    </span>
                    {c.complianceStatus && (
                      <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cStyle.bg, color: cStyle.color }}>
                        {c.complianceStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>
                    {c.owner ? `${c.owner.displayName} (${c.owner.email})` : "No owner"} · {relativeDate(c.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-end gap-1.5">
                  {c.status !== "active" && c.status !== "archived" && (
                    <button onClick={() => openAction(c, "active")}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "#DCFCE7", color: "#166534" }}>
                      Activate
                    </button>
                  )}
                  {c.status === "active" && (
                    <button onClick={() => openAction(c, "inactive")}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                      Deactivate
                    </button>
                  )}
                  {c.complianceStatus !== "verified" && c.status !== "archived" && (
                    <button onClick={() => openAction(c, "request-documents")}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "#E0F2FE", color: "#0369A1" }}
                      title={c.documentsRequestedAt ? `Last requested ${relativeDate(c.documentsRequestedAt)}` : undefined}>
                      Request docs
                    </button>
                  )}
                  {c.status !== "archived" && (
                    <button onClick={() => openAction(c, "archive")}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "var(--surface)", color: "#6B7280", border: "1px solid var(--border)" }}>
                      Archive
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button onClick={() => openAction(c, "hard-delete")}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>
                      Delete
                    </button>
                  )}
                </div>
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

      {/* Action modal */}
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
              <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                {ACTION_META[actionType].title}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
                {actionTarget.displayName}
              </p>
              {ACTION_META[actionType].destructive && (
                <p className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
                  This permanently removes the company and its data. This cannot be undone.
                </p>
              )}
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                  {ACTION_META[actionType].reasonLabel}
                </label>
                {actionType === "request-documents" ? (
                  <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                    rows={3} placeholder="Let the owner know which documents you need…"
                    className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                ) : (
                  <input value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Admin reason for this action…"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                )}
              </div>
              {actionNotice && (
                <p className="mt-3 text-xs font-semibold" style={{ color: "#991B1B" }}>{actionNotice}</p>
              )}
              <div className="mt-4 flex gap-3">
                <button onClick={() => setActionTarget(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  Cancel
                </button>
                <button onClick={submitAction} disabled={actionSaving}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: ACTION_META[actionType].color }}>
                  {actionSaving ? "Saving…" : ACTION_META[actionType].confirm}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
