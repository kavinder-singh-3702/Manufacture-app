"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { adminService, AdminUser } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";
import { AnimatedNumber, DonutChart, DonutLegend, type DonutSegment } from "@/src/components/ui/charts";

const PAGE_SIZE = 30;

const relativeDate = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "today";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
  admin:       { color: "#1E40AF", bg: "#DBEAFE" },
  "super-admin": { color: "#5B21B6", bg: "#EDE9FE" },
  user:        { color: "#166534", bg: "#DCFCE7" },
  guest:       { color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  active:   { color: "#166534", bg: "#DCFCE7" },
  inactive: { color: "#92400E", bg: "#FEF3C7" },
  banned:   { color: "#991B1B", bg: "#FEE2E2" },
  pending:  { color: "#6B7280", bg: "#F3F4F6" },
};

const FILTER_CHIPS = [
  { key: "all",      label: "All" },
  { key: "active",   label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

export const AdminUsersPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [summary, setSummary] = useState<{ total: number; active: number; inactive: number } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accurate totals across all users (independent of the active filter).
  const loadSummary = useCallback(async () => {
    const [allRes, activeRes, inactiveRes] = await Promise.allSettled([
      adminService.listUsers({ limit: 1 }),
      adminService.listUsers({ status: "active", limit: 1 }),
      adminService.listUsers({ status: "inactive", limit: 1 }),
    ]);
    setSummary({
      total: allRes.status === "fulfilled" ? (allRes.value.pagination?.total ?? 0) : 0,
      active: activeRes.status === "fulfilled" ? (activeRes.value.pagination?.total ?? 0) : 0,
      inactive: inactiveRes.status === "fulfilled" ? (inactiveRes.value.pagination?.total ?? 0) : 0,
    });
  }, []);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await adminService.listUsers({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
        sort: "updatedAt:desc",
      });
      setUsers((prev) => append ? [...prev, ...(res.users ?? [])] : (res.users ?? []));
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load users");
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Users</h1>
          {!loading && <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>{pagination.total.toLocaleString("en-IN")} total</p>}
        </div>
      </motion.div>

      {/* User analytics */}
      {summary && (() => {
        const other = Math.max(0, summary.total - summary.active - summary.inactive);
        const segs: DonutSegment[] = [
          { label: "Active", value: summary.active, color: "#16A34A" },
          { label: "Inactive", value: summary.inactive, color: "#F59E0B" },
          ...(other > 0 ? [{ label: "Other", value: other, color: "#9CA3AF" }] : []),
        ];
        const activeRate = summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0;
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 rounded-2xl p-5 sm:grid-cols-[auto_1fr]"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <div className="flex items-center gap-5">
              <DonutChart segments={segs} centerValue={summary.total} centerLabel="Users" size={120} thickness={14} />
              <div className="hidden sm:block min-w-[140px]"><DonutLegend segments={segs} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:self-center">
              {[
                { label: "Active", value: summary.active, accent: "#16A34A", suffix: "" },
                { label: "Inactive", value: summary.inactive, accent: "#F59E0B", suffix: "" },
                { label: "Active rate", value: activeRate, accent: "var(--primary)", suffix: "%" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--medium-gray)" }}>{s.label}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: s.accent }}><AnimatedNumber value={s.value} />{s.suffix}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
            <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="flex gap-1.5">
          {FILTER_CHIPS.map((chip) => (
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

      {/* Table / List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !users.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center"
          style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">👤</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No users found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          {/* Column headers */}
          <div className="hidden grid-cols-[1fr_140px_100px_100px_110px] gap-4 px-4 py-2.5 sm:grid"
            style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            {["User", "Role", "Status", "Type", "Joined"].map((h) => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>{h}</p>
            ))}
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {users.map((u, i) => {
              const roleStyle = ROLE_STYLE[u.role] ?? { color: "var(--foreground)", bg: "var(--surface)" };
              const statusStyle = STATUS_STYLE[u.status] ?? { color: "var(--medium-gray)", bg: "var(--border)" };
              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <Link href={`/admin/users/detail/?userId=${encodeURIComponent(u.id)}`}
                    className="grid grid-cols-1 gap-1 px-4 py-3 transition-colors hover:bg-[var(--background)] sm:grid-cols-[1fr_140px_100px_100px_110px] sm:items-center sm:gap-4"
                    style={{ backgroundColor: "var(--card)" }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {u.displayName || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>{u.email}</p>
                    </div>
                    <Badge label={u.role} color={roleStyle.color} bg={roleStyle.bg} />
                    <Badge label={u.status} color={statusStyle.color} bg={statusStyle.bg} />
                    <p className="text-xs font-medium capitalize" style={{ color: "var(--medium-gray)" }}>
                      {u.accountType ?? "—"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                      {relativeDate(u.createdAt)}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
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
    </div>
  );
};

const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize"
    style={{ backgroundColor: bg, color }}>
    {label}
  </span>
);
