"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { serviceRequestService } from "@/src/services/serviceRequest";
import { ApiError } from "@/src/lib/api-error";
import type { ServiceRequest } from "@/src/types/service";
import { ServiceStatusBadge, ServicePriorityBadge } from "@/src/features/services/components/ServiceStatusBadge";
import { getServiceTypeMeta } from "@/src/features/services/components/ServiceTypeCard";

const DetailContent = () => {
  const params = useSearchParams();
  const serviceId = params.get("serviceId") ?? "";
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!serviceId) { setError("No service ID provided."); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      setRequest(await serviceRequestService.getById(serviceId));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load request");
    } finally { setLoading(false); }
  }, [serviceId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Request not found</p>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>{error ?? "This request could not be loaded."}</p>
        <Link href="/dashboard/services" className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--primary)" }}>← Back to services</Link>
      </div>
    );
  }

  const meta = getServiceTypeMeta(request.serviceType);

  const detailSections: Array<{ label: string; value?: string | number | null }> = [
    { label: "Service type", value: meta.label },
    { label: "Title", value: request.title },
    { label: "Description", value: request.description },
    { label: "Notes", value: request.notes },
    { label: "Submitted", value: new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
  ];

  if (request.contact) {
    if (request.contact.name) detailSections.push({ label: "Contact name", value: request.contact.name });
    if (request.contact.phone) detailSections.push({ label: "Contact phone", value: request.contact.phone });
    if (request.contact.email) detailSections.push({ label: "Contact email", value: request.contact.email });
  }
  if (request.location?.city) {
    detailSections.push({ label: "Location", value: [request.location.city, request.location.state, request.location.country].filter(Boolean).join(", ") });
  }
  if (request.budget?.estimatedCost) {
    detailSections.push({ label: "Budget", value: `₹${request.budget.estimatedCost.toLocaleString("en-IN")}` });
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm" style={{ color: "var(--medium-gray)" }}>
        <Link href="/dashboard/services" className="transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
          Services
        </Link>
        <span>/</span>
        <span style={{ color: "var(--foreground)" }}>{request.title}</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="overflow-hidden rounded-3xl"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
        <div className="h-1" style={{ backgroundColor: meta.accent }} />
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: meta.accentBg }}>{meta.icon}</span>
            <div className="space-y-1.5">
              <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{request.title}</p>
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{meta.label}</p>
              <div className="flex flex-wrap gap-2">
                <ServiceStatusBadge status={request.status} />
                <ServicePriorityBadge priority={request.priority} />
              </div>
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
            #{request._id.slice(-8).toUpperCase()}
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-3 rounded-2xl p-5"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
            Request details
          </p>
          {detailSections.filter((s) => s.value).map((s) => (
            <div key={s.label} className="flex gap-3 rounded-xl px-3 py-2.5"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
              <span className="w-28 flex-shrink-0 text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>{s.label}</span>
              <span className="text-sm" style={{ color: "var(--foreground)" }}>{String(s.value)}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl p-5 space-y-3 self-start"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
            About this service
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{meta.hint}</p>
          <Link href="/dashboard/services/request"
            className="block w-full rounded-xl py-2.5 text-center text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: meta.accent }}>
            New {meta.label} request
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    }>
      <DetailContent />
    </Suspense>
  );
}
