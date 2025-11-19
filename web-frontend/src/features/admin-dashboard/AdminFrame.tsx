"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { companyVerificationService } from "@/src/services/companyVerification";
import type { CompanyVerificationRequest } from "@/src/types/company";
import { ApiError } from "@/src/lib/api-error";

const adminNavItems = [
  { id: "overview", label: "Overview", href: "/admin" },
  { id: "verification", label: "Verification queue", href: "/admin/verification-requests" },
] as const;

const statusColors = {
  pending: { background: "rgba(250, 204, 21, 0.18)", color: "#854d0e" },
  approved: { background: "rgba(34, 197, 94, 0.18)", color: "#14532d" },
  rejected: { background: "rgba(248, 113, 113, 0.18)", color: "#991b1b" },
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export const AdminFrame = ({ children }: { children: ReactNode }) => {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!initializing && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [initializing, user, isAdmin, router]);

  if (initializing || !user) {
    return (
      <div className="mx-auto max-w-3xl py-24 text-center text-sm font-semibold text-[#5c4451]">
        Checking your session…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl py-24 text-center text-sm font-semibold text-[#5c4451]">
        You need an admin account to access this console.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminTopbar userEmail={user.email} onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar activePath={pathname} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-lg shadow-[#5a304218]">
          {children}
        </div>
      </div>
    </div>
  );
};

const AdminTopbar = ({ userEmail, onToggleSidebar }: { userEmail?: string; onToggleSidebar: () => void }) => (
  <motion.header
    className="flex flex-col gap-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-lg shadow-[#5a304212] lg:flex-row lg:items-center lg:justify-between"
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-3">
      <button
        onClick={onToggleSidebar}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] text-[#5a3042] lg:hidden"
        aria-label="Toggle navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
          Admin console
        </p>
        <p className="text-lg font-semibold text-[#2e1f2c]">Compliance & moderation</p>
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/85 px-4 py-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 7.5-7.5 7.5 7.5 0 0 1-7.5 7.5z" stroke="#b98b9e" strokeWidth="1.6" />
        </svg>
        <input
          type="search"
          placeholder="Search moderation queue"
          className="w-full bg-transparent text-sm text-[#2e1f2c] placeholder:text-[#b98b9e] focus:outline-none"
        />
      </div>
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white/85 px-4 py-2 text-sm text-[#5c4451]">
        Signed in as {userEmail ?? "admin"}
      </div>
    </div>
  </motion.header>
);

const AdminSidebar = ({
  activePath,
  isOpen,
  onClose,
}: {
  activePath: string;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <>
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-black/35 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-6 left-4 z-40 w-72 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-2xl lg:hidden"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
          >
            <AdminSidebarContent activePath={activePath} onNavigate={onClose} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
    <div className="hidden w-full max-w-xs flex-shrink-0 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-lg shadow-[#5a304218] lg:block">
      <AdminSidebarContent activePath={activePath} onNavigate={onClose} />
    </div>
  </>
);

const AdminSidebarContent = ({ activePath, onNavigate }: { activePath: string; onNavigate: () => void }) => (
  <div className="space-y-4">
    <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
        Admin tools
      </p>
      <p className="mt-1 text-sm text-[#5c4451]">Jump between moderation workstreams</p>
    </div>
    <div className="space-y-2">
      {adminNavItems.map((item) => {
        const isActive = activePath === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left"
          >
            {isActive && (
              <motion.span
                layoutId="admin-sidebar-highlight"
                className="absolute inset-0 rounded-2xl border border-[var(--color-plum)] bg-white shadow-xl shadow-[#5a304233]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className={`relative z-10 text-sm font-semibold ${isActive ? "text-[var(--color-plum)]" : "text-[#5c4451]"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  </div>
);

export const AdminOverview = () => {
  const [requests, setRequests] = useState<CompanyVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await companyVerificationService.list();
      setRequests(response.requests);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to load verification data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => {
    return requests.reduce(
      (acc, request) => {
        acc.total += 1;
        if (request.status === "pending") acc.pending += 1;
        if (request.status === "approved") acc.approved += 1;
        if (request.status === "rejected") acc.rejected += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [requests]);

  const recent = useMemo(() => requests.slice(0, 4), [requests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Admin overview
          </p>
          <h1 className="text-2xl font-semibold text-[#2e1f2c]">Compliance command center</h1>
          <p className="text-sm text-[#6c4f5b]">Track verification throughput and jump into the moderation queue.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadRequests}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-plum)", boxShadow: "0 10px 25px rgba(90,48,66,0.2)" }}
          >
            Refresh data
          </button>
          <Link
            href="/admin/verification-requests"
            className="rounded-full border border-[var(--color-plum)] px-5 py-2 text-sm font-semibold text-[var(--color-plum)]"
          >
            Go to queue
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total requests", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Approved", value: stats.approved },
          { label: "Rejected", value: stats.rejected },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#2e1f2c]">{loading ? "…" : card.value}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="text-sm font-semibold text-[#b91c1c]">{error}</p>
      ) : (
        <div className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
                Recent submissions
              </p>
              <h2 className="text-xl font-semibold text-[#2e1f2c]">Latest company reviews</h2>
            </div>
            <Link href="/admin/verification-requests" className="text-sm font-semibold text-[var(--color-plum)]">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-[#5c4451]">Loading queue…</p>
          ) : recent.length ? (
            <div className="mt-4 space-y-3">
              {recent.map((request) => {
                const badge = statusColors[request.status];
                return (
                  <div key={request.id} className="rounded-2xl border border-[var(--border-soft)] bg-white/90 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#2e1f2c]">
                          {request.company?.displayName ?? "Company"}
                        </p>
                        <p className="text-xs text-[#6c4f5b]">
                          Submitted {formatDateTime(request.createdAt)} · Requested by {request.requestedBy?.displayName ?? request.requestedBy?.email ?? "user"}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ backgroundColor: badge.background, color: badge.color }}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#5c4451]">No submissions yet.</p>
          )}
        </div>
      )}
    </div>
  );
};
