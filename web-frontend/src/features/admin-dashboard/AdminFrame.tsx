"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { companyVerificationService } from "@/src/services/companyVerification";
import type { CompanyVerificationRequest } from "@/src/types/company";
import { adminService, AdminOverview as AdminOverviewData, AdminAuditEvent } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";
import { PhoneGate } from "@/src/features/auth/components/PhoneGate";
import { AnimatedNumber, DonutChart, DonutLegend, FunnelBar, type DonutSegment } from "@/src/components/ui/charts";

const adminNavItems = [
  { id: "overview",           label: "Overview",             href: "/admin" },
  { id: "verification",       label: "Verification queue",   href: "/admin/verification-requests" },
  { id: "users",              label: "Users",                href: "/admin/users" },
  { id: "companies",          label: "Companies",            href: "/admin/companies" },
  { id: "orders",             label: "Orders pipeline",      href: "/admin/orders" },
  { id: "products",           label: "In-house products",    href: "/admin/products" },
  { id: "ops",                label: "Ops console",          href: "/admin/ops" },
  { id: "product-inquiries",  label: "Product inquiries",    href: "/admin/product-inquiries" },
  { id: "notifications",      label: "Notification studio",  href: "/admin/notifications" },
  { id: "ad-studio",          label: "Ad studio",            href: "/admin/ad-studio" },
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

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  useEffect(() => {
    if (!initializing && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [initializing, user, isAdmin, router]);

  if (initializing || !user) {
    return (
      <div className="mx-auto max-w-3xl py-24 text-center text-sm font-semibold text-[var(--foreground)]">
        Checking your session…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl py-24 text-center text-sm font-semibold text-[var(--foreground)]">
        You need an admin account to access this console.
      </div>
    );
  }

  // Hard phone gate — same requirement as the user shell.
  if (user.role !== "guest" && !user.phone) {
    return <PhoneGate />;
  }

  return (
    <div className="space-y-6">
      <AdminTopbar userEmail={user.email} onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar activePath={pathname} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg shadow-[rgba(20,141,178,0.08)]">
          {children}
        </div>
      </div>
    </div>
  );
};

const AdminTopbar = ({ userEmail, onToggleSidebar }: { userEmail?: string; onToggleSidebar: () => void }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const q = query.trim().toLowerCase();
  const matches = q ? adminNavItems.filter((i) => i.label.toLowerCase().includes(q)) : [];
  const initial = (userEmail ?? "A").charAt(0).toUpperCase();

  const go = (href: string) => { setQuery(""); setSearchFocused(false); router.push(href); };
  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); router.push("/signin"); }
    finally { setLoggingOut(false); setMenuOpen(false); }
  };

  return (
    <motion.header
      className="relative z-20 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg shadow-[rgba(20,141,178,0.07)] lg:flex-row lg:items-center lg:justify-between"
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] text-[var(--primary-dark)] lg:hidden"
          aria-label="Toggle navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>Admin console</p>
          <p className="text-lg font-semibold text-[var(--foreground)]">Compliance & moderation</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        {/* Section quick-search */}
        <div className="relative lg:w-72">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 7.5-7.5 7.5 7.5 0 0 1-7.5 7.5z" stroke="var(--medium-gray)" strokeWidth="1.6" />
            </svg>
            <input
              type="search" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) go(matches[0].href); }}
              placeholder="Jump to a section…"
              className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--medium-gray)] focus:outline-none"
            />
          </div>
          <AnimatePresence>
            {searchFocused && matches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
                {matches.map((m) => (
                  <button key={m.id} onMouseDown={() => go(m.href)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--background)]">
                    {m.label}
                    <span className="text-xs text-[var(--medium-gray)]">↵</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Account menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 transition-opacity hover:opacity-90 lg:w-auto">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>{initial}</span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Admin</span>
              <span className="block max-w-[160px] truncate text-xs font-semibold text-[var(--foreground)]">{userEmail ?? "admin"}</span>
            </span>
            <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" animate={{ rotate: menuOpen ? 180 : 0 }}>
              <path d="M6 9l6 6 6-6" stroke="var(--medium-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
                  <div className="border-b border-[var(--border)] px-4 py-3">
                    <p className="text-xs font-semibold text-[var(--medium-gray)]">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{userEmail ?? "admin"}</p>
                  </div>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--background)]">
                    <span>🏠</span> User dashboard
                  </Link>
                  <button onClick={handleLogout} disabled={loggingOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-[var(--background)] disabled:opacity-50"
                    style={{ color: "var(--accent)" }}>
                    <span>↩︎</span> {loggingOut ? "Signing out…" : "Sign out"}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

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
            className="fixed inset-y-6 left-4 z-40 w-72 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl lg:hidden"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
          >
            <AdminSidebarContent activePath={activePath} onNavigate={onClose} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
    <div className="hidden w-full max-w-xs flex-shrink-0 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg shadow-[rgba(20,141,178,0.08)] lg:block">
      <AdminSidebarContent activePath={activePath} onNavigate={onClose} />
    </div>
  </>
);

const AdminSidebarContent = ({ activePath, onNavigate }: { activePath: string; onNavigate: () => void }) => (
  <div className="space-y-4">
    <div className="rounded-2xl bg-[var(--background)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
        Admin tools
      </p>
      <p className="mt-1 text-sm text-[var(--foreground)]">Jump between moderation workstreams</p>
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
                className="absolute inset-0 rounded-2xl border border-[var(--primary)] bg-[var(--card)] shadow-xl shadow-[rgba(20,141,178,0.20)]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className={`relative z-10 text-sm font-semibold ${isActive ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  </div>
);

const QUICK_LINKS = [
  { label: "Users",             href: "/admin/users",                 icon: "👤", desc: "Manage accounts" },
  { label: "Companies",         href: "/admin/companies",             icon: "🏢", desc: "Status & compliance" },
  { label: "Orders pipeline",   href: "/admin/orders",                icon: "🗂️", desc: "Requests by stage" },
  { label: "In-house products", href: "/admin/products",              icon: "📦", desc: "Catalog & stock" },
  { label: "Ops console",       href: "/admin/ops",                   icon: "📋", desc: "Service & startup requests" },
  { label: "Product inquiries", href: "/admin/product-inquiries",     icon: "📩", desc: "Buyer leads" },
  { label: "Notifications",     href: "/admin/notifications",         icon: "🔔", desc: "Dispatch & history" },
  { label: "Ad studio",         href: "/admin/ad-studio",             icon: "📣", desc: "Campaigns & insights" },
  { label: "Verification",      href: "/admin/verification-requests", icon: "🛡️", desc: "Compliance queue" },
] as const;

const auditActorLabel = (e: AdminAuditEvent) =>
  e.actor?.displayName ?? e.actor?.email ?? e.companyName ?? e.company?.displayName ?? "System";

const auditTitle = (e: AdminAuditEvent) =>
  e.label ?? e.action.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");

export const AdminOverview = () => {
  const [requests, setRequests] = useState<CompanyVerificationRequest[]>([]);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [activity, setActivity] = useState<AdminAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [reqRes, ovRes, actRes] = await Promise.allSettled([
      companyVerificationService.list(),
      adminService.getOverview(),
      adminService.listAuditEvents({ limit: 8 }),
    ]);

    if (reqRes.status === "fulfilled") setRequests(reqRes.value.requests);
    if (ovRes.status === "fulfilled") setOverview(ovRes.value);
    if (actRes.status === "fulfilled") setActivity(actRes.value.events ?? []);

    if (reqRes.status === "rejected" && ovRes.status === "rejected") {
      const err = reqRes.reason;
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Unable to load admin data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const verificationStats = useMemo(() => {
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

  const stats = overview?.stats;
  const kpis = stats
    ? [
        { label: "Users", value: stats.users.total, sub: `${stats.users.active.toLocaleString("en-IN")} active`, icon: "👤", accent: "var(--primary)" },
        { label: "Companies", value: stats.companies.total, sub: `${stats.companies.active.toLocaleString("en-IN")} active`, icon: "🏢", accent: "#7C3AED" },
        { label: "Pending verification", value: stats.verifications.pending, sub: `${stats.verifications.total.toLocaleString("en-IN")} all-time`, icon: "🛡️", accent: "#EA580C" },
        { label: "New today", value: stats.today.newUsers, sub: `${stats.today.newVerifications} verifications`, icon: "✨", accent: "#16A34A" },
      ]
    : [
        { label: "Total requests", value: verificationStats.total, sub: "verification", icon: "🗂️", accent: "var(--primary)" },
        { label: "Pending", value: verificationStats.pending, sub: "awaiting review", icon: "⏳", accent: "#EA580C" },
        { label: "Approved", value: verificationStats.approved, sub: "verified", icon: "✅", accent: "#16A34A" },
        { label: "Rejected", value: verificationStats.rejected, sub: "declined", icon: "🚫", accent: "#DC2626" },
      ];

  // Donut + funnel data (fall back to locally-computed verification stats).
  const verif = stats?.verifications ?? { ...verificationStats };
  const verificationSegments: DonutSegment[] = [
    { label: "Pending", value: verif.pending, color: "#F59E0B" },
    { label: "Approved", value: verif.approved, color: "#16A34A" },
    { label: "Rejected", value: verif.rejected, color: "#DC2626" },
  ];
  const verifTotal = verificationSegments.reduce((a, s) => a + s.value, 0);

  const notif = overview?.notificationDispatchHealth;
  const notifSegments: DonutSegment[] = notif
    ? [
        { label: "Delivered", value: notif.delivered, color: "#16A34A" },
        { label: "Failed", value: notif.failed, color: "#DC2626" },
      ]
    : [];

  const comms = overview?.communications;
  const callMinutes = comms ? Math.round(comms.totalCallDurationSeconds / 60) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Admin overview
          </p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Command center</h1>
          <p className="text-sm text-[#6c4f5b]">Platform health, moderation throughput, and recent activity.</p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--primary)", boxShadow: "0 10px 25px rgba(90,48,66,0.2)" }}
        >
          Refresh data
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card, i) => (
          <motion.div key={card.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4">
            <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.08]" style={{ backgroundColor: card.accent }} />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: card.accent }}>{card.label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl text-base" style={{ backgroundColor: "var(--background)" }}>{card.icon}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
              {loading ? "…" : <AnimatedNumber value={card.value} />}
            </p>
            <p className="mt-1 text-xs text-[var(--medium-gray)]">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Graphs row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Verification breakdown donut */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Verification mix</p>
          <div className="mt-4 flex items-center gap-5">
            <DonutChart segments={verificationSegments} centerValue={verifTotal} centerLabel="Requests" />
            <div className="flex-1"><DonutLegend segments={verificationSegments} /></div>
          </div>
        </div>

        {/* Notification health donut */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Notification health · 24h</p>
          {notif ? (
            <div className="mt-4 flex items-center gap-5">
              <DonutChart segments={notifSegments} centerValue={`${Math.round(notif.successRate * 100)}%`} centerLabel="Delivered" />
              <div className="flex-1 space-y-3">
                <DonutLegend segments={notifSegments} />
                <p className="text-xs text-[var(--medium-gray)]"><strong className="text-[var(--foreground)]">{notif.last24h.toLocaleString("en-IN")}</strong> dispatched</p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--medium-gray)]">{loading ? "Loading…" : "No dispatch data."}</p>
          )}
        </div>

        {/* Communications (24h) — previously unsurfaced */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Communications · 24h</p>
          {comms ? (
            <div className="mt-4 grid gap-3">
              <MiniStat icon="💬" label="Conversations" value={comms.conversationsLast24h} accent="#16A34A" />
              <MiniStat icon="📞" label="Calls" value={comms.callsLast24h} accent="#EA580C" />
              <MiniStat icon="⏱️" label="Call minutes" value={callMinutes} accent="var(--primary)" />
            </div>
          ) : overview?.servicesQueue ? (
            <div className="mt-4 grid gap-3">
              <MiniStat icon="⏳" label="Pending services" value={overview.servicesQueue.pending} accent="#EA580C" />
              <MiniStat icon="🔧" label="In progress" value={overview.servicesQueue.inProgress} accent="var(--primary)" />
              <MiniStat icon="⚠️" label="Overdue" value={overview.servicesQueue.overdue} accent="#DC2626" />
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--medium-gray)]">{loading ? "Loading…" : "No communications data."}</p>
          )}
        </div>
      </div>

      {/* Verification aging + services queue funnels */}
      {overview && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Verification aging</p>
            <p className="mt-0.5 mb-4 text-xs text-[var(--medium-gray)]">How long pending requests have been waiting</p>
            <FunnelBar rows={[
              { label: "< 24h", value: overview.verificationAging.lt24h, color: "#16A34A" },
              { label: "24–72h", value: overview.verificationAging.from24hTo72h, color: "#F59E0B" },
              { label: "> 72h", value: overview.verificationAging.gt72h, color: "#DC2626" },
            ]} />
          </div>
          {overview.servicesQueue && (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Services queue</p>
              <p className="mt-0.5 mb-4 text-xs text-[var(--medium-gray)]">Open service & startup requests</p>
              <FunnelBar rows={[
                { label: "Pending", value: overview.servicesQueue.pending, color: "#F59E0B" },
                { label: "In progress", value: overview.servicesQueue.inProgress, color: "var(--primary)" },
                { label: "Overdue", value: overview.servicesQueue.overdue, color: "#DC2626" },
              ]} />
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_LINKS.map((q) => (
          <Link key={q.href} href={q.href}
            className="flex flex-col items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lg">
            <span className="text-2xl">{q.icon}</span>
            <span className="text-sm font-bold text-[var(--foreground)]">{q.label}</span>
            <span className="text-[11px] text-[#6c4f5b]">{q.desc}</span>
          </Link>
        ))}
      </div>

      {error && <p className="text-sm font-semibold text-[#b91c1c]">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent verification submissions */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
                Recent submissions
              </p>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Company reviews</h2>
            </div>
            <Link href="/admin/verification-requests" className="text-sm font-semibold text-[var(--primary)]">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-[var(--foreground)]">Loading queue…</p>
          ) : recent.length ? (
            <div className="mt-4 space-y-3">
              {recent.map((request) => {
                const badge = statusColors[request.status];
                return (
                  <div key={request.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {request.company?.displayName ?? "Company"}
                        </p>
                        <p className="text-xs text-[#6c4f5b]">
                          Submitted {formatDateTime(request.createdAt)} · {request.requestedBy?.displayName ?? request.requestedBy?.email ?? "user"}
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
            <p className="mt-4 text-sm text-[var(--foreground)]">No submissions yet.</p>
          )}
        </div>

        {/* Recent platform activity */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
                Recent activity
              </p>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Audit log</h2>
            </div>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-[var(--foreground)]">Loading activity…</p>
          ) : activity.length ? (
            <div className="mt-4 space-y-2.5">
              {activity.map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
                  <span className="mt-0.5 inline-flex rounded-full bg-[var(--primary-light)] px-2.5 py-1 text-[10px] font-semibold capitalize text-[var(--primary)]">
                    {event.category ?? event.action.split(".")[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{auditTitle(event)}</p>
                    <p className="text-xs text-[#6c4f5b]">
                      {auditActorLabel(event)} · {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--foreground)]">No recent activity recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ icon, label, value, accent }: { icon: string; label: string; value: number; accent: string }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base" style={{ backgroundColor: "var(--surface)" }}>{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold" style={{ color: "var(--medium-gray)" }}>{label}</p>
      <p className="text-lg font-bold leading-tight" style={{ color: accent }}><AnimatedNumber value={value} /></p>
    </div>
  </div>
);
