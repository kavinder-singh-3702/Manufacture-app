"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { serviceRequestService } from "@/src/services/serviceRequest";
import { ApiError } from "@/src/lib/api-error";
import type { ServiceRequest } from "@/src/types/service";
import { ServiceTypeCard, SERVICE_TYPES, getServiceTypeMeta } from "./ServiceTypeCard";
import { ServiceStatusBadge, ServicePriorityBadge } from "./ServiceStatusBadge";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay },
});

const KpiChip = ({ label, value, color, dot }: { label: string; value: number; color: string; dot: string }) => (
  <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl p-4"
    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color }}>{label}</p>
    </div>
    <p className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
  </div>
);

const RequestRow = ({ request }: { request: ServiceRequest }) => {
  const meta = getServiceTypeMeta(request.serviceType);
  return (
    <Link
      href={`/dashboard/services/detail?serviceId=${request._id}`}
      className="flex items-start gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
    >
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: meta.accentBg }}
      >{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{request.title}</p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{meta.label}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ServiceStatusBadge status={request.status} />
          <ServicePriorityBadge priority={request.priority} />
        </div>
      </div>
      <p className="flex-shrink-0 text-[11px]" style={{ color: "var(--medium-gray)" }}>
        {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </p>
    </Link>
  );
};

export const ServicesOverview = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await serviceRequestService.list({ limit: 30, sort: "newest" });
      setRequests(res.requests);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load service requests");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => ({
    open: requests.filter((r) => ["pending", "in_review", "scheduled"].includes(r.status)).length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  }), [requests]);

  const displayed = showAll ? requests : requests.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fade(0)} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
            Marketplace
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Services</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>
            Operations command for support, workforce, and logistics
          </p>
        </div>
        <Link href="/dashboard/services/request"
          className="self-start inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          New request
        </Link>
      </motion.div>

      {/* KPI strip */}
      <motion.div {...fade(0.05)} className="flex gap-3">
        <KpiChip label="Open"       value={kpis.open}       color="#F59E0B" dot="#F59E0B" />
        <KpiChip label="In progress" value={kpis.inProgress} color="#0EA5E9" dot="#0EA5E9" />
        <KpiChip label="Completed"  value={kpis.completed}  color="#16A34A" dot="#22C55E" />
      </motion.div>

      {/* Service catalog */}
      <motion.section {...fade(0.1)} className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
            Service catalog
          </p>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SERVICE_TYPES.map((meta, i) => (
            <motion.div
              key={meta.type}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.07 }}
            >
              <ServiceTypeCard
                meta={meta}
                onStart={() => router.push(`/dashboard/services/request?type=${meta.type}`)}
              />
            </motion.div>
          ))}

          {/* Business Setup — special card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + SERVICE_TYPES.length * 0.07 }}
            whileHover={{ y: -4, boxShadow: "var(--shadow-lg)" }}
            className="flex flex-col overflow-hidden rounded-3xl"
            style={{ background: "var(--gradient-brand-deep)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex flex-1 flex-col p-5 text-white">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur-sm">
                  🚀
                </span>
                <div>
                  <p className="text-sm font-bold">Business Setup</p>
                  <p className="mt-0.5 text-xs text-white/70">Launch your own business</p>
                </div>
              </div>
              <div className="mt-3 flex-1 rounded-xl bg-white/10 p-3 text-xs leading-relaxed text-white/80">
                From GST registration to factory setup — our concierge team handles everything end-to-end.
              </div>
              <button
                type="button"
                onClick={() => router.push("/dashboard/business-setup")}
                className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:bg-white/90"
                style={{ color: "var(--primary)" }}
              >
                Start for free →
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Recent requests */}
      <motion.section {...fade(0.2)} className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
              My requests
            </p>
            {requests.length > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                {requests.length}
              </span>
            )}
          </div>
          {requests.length > 5 && (
            <button type="button" onClick={() => setShowAll((v) => !v)}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)" }}>
              {showAll ? "Show less" : `View all ${requests.length}`}
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            <span>{error}</span>
            <button type="button" onClick={load} className="text-xs font-bold underline">Retry</button>
          </div>
        )}

        {loading && (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && !error && (
          <div className="flex flex-col items-center gap-4 rounded-3xl p-10 text-center"
            style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}>
            <span className="text-4xl">🛠️</span>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No service requests yet</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
                Submit your first request from the catalog above.
              </p>
            </div>
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div className="space-y-2.5">
            {displayed.map((req) => <RequestRow key={req._id} request={req} />)}
          </div>
        )}
      </motion.section>
    </div>
  );
};
