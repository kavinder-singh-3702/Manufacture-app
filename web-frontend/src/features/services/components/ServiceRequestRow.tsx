"use client";

import Link from "next/link";
import { tintBg } from "@/src/lib/color";
import type { ServiceRequest } from "@/src/types/service";
import { getServiceCatalogMeta } from "../content/catalog";
import { ServiceStatusBadge, ServicePriorityBadge } from "./ServiceStatusBadge";

/**
 * One row in "My requests" — a colored left accent stripe in the service's
 * gradient accent, an emoji chip, status + priority badges, and (when the
 * request was cancelled/rejected and the backend recorded a reason on the
 * latest status-history entry) an inset reason callout. Ported from the
 * app's `RecentRequestRow`.
 */
export const ServiceRequestRow = ({ request }: { request: ServiceRequest }) => {
  const meta = getServiceCatalogMeta(request.serviceType);
  const lastHistory = request.statusHistory?.[request.statusHistory.length - 1];
  // `cancelled` is the only terminal "didn't happen" status in
  // SERVICE_STATUSES (backend/src/constants/services.js) — there is no
  // separate "rejected" state, so this only ever reads as a cancellation.
  const showReason = request.status === "cancelled" && lastHistory?.reason && lastHistory.to === "cancelled";

  return (
    <Link
      href={`/dashboard/services/detail?serviceId=${request._id}`}
      className="relative flex items-start gap-3 overflow-hidden rounded-2xl py-3.5 pl-5 pr-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
    >
      <span aria-hidden className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: meta.accent }} />

      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: tintBg(meta.accent) }}>
        {meta.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {request.title}
            </p>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: meta.accent }}>
              {meta.title}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0" style={{ color: "var(--medium-gray)" }}>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <ServiceStatusBadge status={request.status} />
            <ServicePriorityBadge priority={request.priority} />
          </div>
          <p className="text-[11px] font-medium" style={{ color: "var(--medium-gray)" }}>
            {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        {showReason && (
          <div
            className="mt-2 rounded-lg px-2.5 py-2"
            style={{ backgroundColor: tintBg("#DC2626", 10), borderLeft: "3px solid #DC2626" }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "#DC2626" }}>
              Cancellation reason
            </p>
            <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--foreground)" }}>
              {lastHistory?.reason}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};
