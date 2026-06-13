"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { adminService, AdminUserOverview } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";

type UserStatus = "active" | "inactive" | "suspended";

const USER_STATUS_META: Record<UserStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Activate",   color: "#166534", bg: "#DCFCE7" },
  inactive:  { label: "Deactivate", color: "#92400E", bg: "#FEF3C7" },
  suspended: { label: "Suspend",    color: "#991B1B", bg: "#FEE2E2" },
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
};

const formatDuration = (seconds?: number) => {
  const s = Math.max(Number(seconds || 0), 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m ? `${m}m ${rem}s` : `${rem}s`;
};

const titleCase = (action?: string) =>
  (action ?? "—").split(".").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

const STATUS_COLOR: Record<string, string> = {
  pending: "#D97706", in_review: "#1E40AF", scheduled: "#5B21B6", in_progress: "#0E7490",
  completed: "#166534", cancelled: "#6B7280", rejected: "#991B1B",
};

export const AdminUserDetail = ({ userId }: { userId: string }) => {
  const [overview, setOverview] = useState<AdminUserOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await adminService.getUserOverview(userId, { limit: 8 }));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const openStatus = (status: UserStatus) => {
    setPendingStatus(status);
    setStatusReason("");
    setStatusError(null);
  };

  const submitStatus = async () => {
    if (!pendingStatus) return;
    setStatusSaving(true);
    setStatusError(null);
    try {
      const updated = await adminService.setUserStatus(userId, {
        status: pendingStatus,
        reason: statusReason.trim() || undefined,
      });
      setOverview((prev) => (prev ? { ...prev, user: { ...prev.user, ...updated } } : prev));
      setFlash(`User ${pendingStatus === "active" ? "activated" : pendingStatus === "inactive" ? "deactivated" : "suspended"}.`);
      setPendingStatus(null);
    } catch (err) {
      setStatusError(err instanceof ApiError || err instanceof Error ? err.message : "Could not update status");
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>User not found</p>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>{error ?? "Could not load this user."}</p>
        <Link href="/admin/users" className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
          ← Back to users
        </Link>
      </div>
    );
  }

  const { user, activity, services, communications } = overview;
  const name = user.displayName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--medium-gray)" }}>
        <Link href="/admin/users" className="hover:opacity-70 transition-opacity" style={{ color: "var(--primary)" }}>Users</Link>
        <span>/</span>
        <span style={{ color: "var(--foreground)" }}>{name}</span>
      </div>

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
            {(name[0] ?? "U").toUpperCase()}
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{name}</p>
            <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{user.email}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Tag>{user.role}</Tag>
              <Tag>{user.status}</Tag>
              {user.accountType && <Tag>{user.accountType}</Tag>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-right text-xs" style={{ color: "var(--medium-gray)" }}>
            <p>Joined {formatDateTime(user.createdAt)}</p>
            {user.lastLoginAt && <p className="mt-0.5">Last login {formatDateTime(user.lastLoginAt)}</p>}
          </div>
          {user.role !== "admin" && user.role !== "super-admin" && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {(Object.keys(USER_STATUS_META) as UserStatus[])
                .filter((s) => s !== user.status)
                .map((s) => {
                  const meta = USER_STATUS_META[s];
                  return (
                    <button key={s} onClick={() => openStatus(s)}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                      style={{ backgroundColor: meta.bg, color: meta.color }}>
                      {meta.label}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Status flash */}
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

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Activity events", value: activity.total },
          { label: "Service requests", value: services.total },
          { label: "Conversations", value: communications.conversations.total },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>{c.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Services */}
        <Section title="Service requests" count={services.total}>
          {services.recent.length ? (
            <div className="space-y-2">
              {services.recent.slice(0, 5).map((s) => {
                const color = STATUS_COLOR[s.status] ?? "var(--medium-gray)";
                return (
                  <div key={s.id} className="rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{s.title}</p>
                      <span className="flex-shrink-0 text-[11px] font-bold capitalize px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}18`, color }}>
                        {s.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>
                      {s.company?.displayName ?? "—"} · {formatDateTime(s.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : <Empty>No service requests.</Empty>}
        </Section>

        {/* Communications */}
        <Section title="Communications" count={communications.conversations.total + communications.calls.total}>
          <div className="mb-2 flex gap-4 text-xs" style={{ color: "var(--medium-gray)" }}>
            <span>{communications.conversations.total} conversations</span>
            <span>{communications.calls.total} calls</span>
          </div>
          {communications.conversations.recent.length || communications.calls.recent.length ? (
            <div className="space-y-2">
              {communications.conversations.recent.slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>💬 {c.lastMessage ?? "Conversation"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>{formatDateTime(c.lastMessageAt ?? c.updatedAt)}</p>
                </div>
              ))}
              {communications.calls.recent.slice(0, 2).map((c) => (
                <div key={c.id} className="rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>📞 Call · {formatDuration(c.durationSeconds)}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>{formatDateTime(c.startedAt)}</p>
                </div>
              ))}
            </div>
          ) : <Empty>No communications.</Empty>}
        </Section>
      </div>

      {/* Activity log */}
      <Section title="Recent activity" count={activity.total}>
        {activity.recent.length ? (
          <div className="space-y-2">
            {activity.recent.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <span className="mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                  {(a.action?.split(".")[0] ?? "event")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{a.label ?? titleCase(a.action)}</p>
                  {a.description && <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{a.description}</p>}
                  <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{formatDateTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty>No activity recorded.</Empty>}
      </Section>

      {/* Status confirm modal */}
      <AnimatePresence>
        {pendingStatus && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPendingStatus(null)} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                {USER_STATUS_META[pendingStatus].label} user
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>{name} · {user.email}</p>
              {pendingStatus === "suspended" && (
                <p className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
                  A suspended user is blocked from signing in until reactivated.
                </p>
              )}
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                  Reason (optional)
                </label>
                <input value={statusReason} onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Admin reason for this action…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>
              {statusError && <p className="mt-3 text-xs font-semibold" style={{ color: "#991B1B" }}>{statusError}</p>}
              <div className="mt-4 flex gap-3">
                <button onClick={() => setPendingStatus(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  Cancel
                </button>
                <button onClick={submitStatus} disabled={statusSaving}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: USER_STATUS_META[pendingStatus].color }}>
                  {statusSaving ? "Saving…" : "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize"
    style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)", border: "1px solid var(--border)" }}>
    {children}
  </span>
);

const Section = ({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
      {title}{typeof count === "number" ? ` · ${count}` : ""}
    </p>
    {children}
  </motion.div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{children}</p>
);
