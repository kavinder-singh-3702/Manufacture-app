"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { isAdminRole } from "@/src/lib/roles";
import { companyVerificationService } from "@/src/services/companyVerification";
import type { CompanyVerificationRequest } from "@/src/types/company";
import { adminService, AdminOverview as AdminOverviewData, AdminAuditEvent } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";
import { PhoneGate } from "@/src/features/auth/components/PhoneGate";
import { AnimatedNumber, DonutChart, DonutLegend, FunnelBar, type DonutSegment } from "@/src/components/ui/charts";
import { PageHeader } from "@/src/components/ui/Surface";
import { AdminMobileRail } from "./AdminMobileRail";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

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

  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    if (!initializing && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [initializing, user, isAdmin, router]);

  // Without this, a sign-out triggered from inside this shell (e.g.
  // PhoneGate's "Sign out") leaves `user` null with nothing navigating away —
  // the guard below just renders "Checking your session…" forever.
  useEffect(() => {
    if (!initializing && !user) {
      router.replace("/signin");
    }
  }, [initializing, user, router]);

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
    <div className="h-screen-safe flex overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
      {/* Sidebar — desktop only; AdminMobileRail below replaces it on mobile */}
      <AdminSidebar activePath={pathname} />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar activePath={pathname} />
        <main className="dashboard-main flex-1 overflow-y-auto" style={{ backgroundColor: "var(--background)", overscrollBehavior: "contain" }}>
          {children}
        </main>
      </div>

      <AdminMobileRail activePath={pathname} />
    </div>
  );
};

const QUICK_LINKS = [
  { label: "Users",             href: "/admin/users",                 icon: "👤" },
  { label: "Companies",         href: "/admin/companies",             icon: "🏢" },
  { label: "Orders pipeline",   href: "/admin/orders",                icon: "🗂️" },
  { label: "In-house products", href: "/admin/products",              icon: "📦" },
  { label: "Ops console",       href: "/admin/ops",                   icon: "📋" },
  { label: "Product inquiries", href: "/admin/product-inquiries",     icon: "📩" },
  { label: "Notifications",     href: "/admin/notifications",         icon: "🔔" },
  { label: "Ad studio",         href: "/admin/ad-studio",             icon: "📣" },
  { label: "Verification",      href: "/admin/verification-requests", icon: "🛡️" },
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
      <PageHeader
        title="Command center"
        actions={
          <button
            type="button"
            onClick={loadAll}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--primary)", boxShadow: "0 10px 25px rgba(90,48,66,0.2)" }}
          >
            Refresh data
          </button>
        }
      />

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
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Verification aging</p>
            <FunnelBar rows={[
              { label: "< 24h", value: overview.verificationAging.lt24h, color: "#16A34A" },
              { label: "24–72h", value: overview.verificationAging.from24hTo72h, color: "#F59E0B" },
              { label: "> 72h", value: overview.verificationAging.gt72h, color: "#DC2626" },
            ]} />
          </div>
          {overview.servicesQueue && (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Services queue</p>
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
          </Link>
        ))}
      </div>

      {error && <p className="text-sm font-semibold text-[#b91c1c]">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent verification submissions */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Company reviews</h2>
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
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Audit log</h2>
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
