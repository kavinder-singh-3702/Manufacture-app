"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/src/components/ui/Surface";
import { EmptyState, LoadingEmptyState } from "@/src/components/ui/EmptyState";
import { fadeUp, useMotionSafe } from "@/src/components/ui/motion";
import { SERVICE_CATALOG_LIST, BUSINESS_CATALOG_META } from "../content/catalog";
import { useServiceRequests } from "../hooks/useServiceRequests";
import { ServiceTypeCard } from "./ServiceTypeCard";
import { ServiceKpiStrip } from "./ServiceKpiStrip";
import { ServiceRequestRow } from "./ServiceRequestRow";

export const ServicesOverview = () => {
  const router = useRouter();
  const motionSafe = useMotionSafe();
  const { requests, kpis, loading, error, reload } = useServiceRequests();
  const [showAll, setShowAll] = useState(false);

  const displayed = useMemo(() => (showAll ? requests : requests.slice(0, 5)), [showAll, requests]);
  const fade = (delay: number) => (motionSafe ? fadeUp(delay) : {});

  return (
    <div className="space-y-8">
      <PageHeader
        title="Services"
        actions={
          <Link
            href="/dashboard/services/request"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New request
          </Link>
        }
      />

      <motion.div {...fade(0.05)}>
        <ServiceKpiStrip kpis={kpis} />
      </motion.div>

      <motion.section {...fade(0.1)} className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
            Service catalog
          </p>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SERVICE_CATALOG_LIST.map((meta) => (
            <ServiceTypeCard
              key={meta.type}
              meta={meta}
              onStart={() =>
                router.push(
                  // Advertisement has its own status/insights home (Ad Runs) —
                  // send returning sellers there instead of a blank request form.
                  meta.type === "advertisement" ? "/dashboard/ads" : `/dashboard/services/request?type=${meta.type}`
                )
              }
            />
          ))}
          <ServiceTypeCard meta={BUSINESS_CATALOG_META} href={BUSINESS_CATALOG_META.href} ctaLabel="Start request" />
        </div>
      </motion.section>

      <motion.section {...fade(0.18)} className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
              My requests
            </p>
            {requests.length > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                {requests.length}
              </span>
            )}
          </div>
          {requests.length > 5 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
              {showAll ? "Show less" : `View all ${requests.length}`}
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            <span>{error}</span>
            <button type="button" onClick={reload} className="text-xs font-bold underline">
              Retry
            </button>
          </div>
        )}

        {loading && <LoadingEmptyState message="Loading request dashboard…" />}

        {!loading && !error && requests.length === 0 && (
          <EmptyState
            title="No requests yet"
            description="Start with a service card above and your request will appear here."
          />
        )}

        {!loading && displayed.length > 0 && (
          <div className="space-y-2.5">
            {displayed.map((req) => (
              <ServiceRequestRow key={req._id} request={req} />
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
};
