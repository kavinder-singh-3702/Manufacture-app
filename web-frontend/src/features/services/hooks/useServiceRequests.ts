"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { serviceRequestService } from "@/src/services/serviceRequest";
import { ApiError } from "@/src/lib/api-error";
import type { ServiceRequest } from "@/src/types/service";
import type { ServiceKpis } from "../components/ServiceKpiStrip";

const OPEN_STATUSES = new Set(["pending", "in_review", "scheduled"]);

/** Loads "My requests" and derives the Open/In Progress/Completed KPI strip from the loaded page — same client-side aggregation the app uses (ServicesOverviewScreen.tsx). */
export const useServiceRequests = (limit = 30) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceRequestService.list({ limit, sort: "newest" });
      setRequests(res.services);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load service requests");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis: ServiceKpis = useMemo(
    () => ({
      open: requests.filter((r) => OPEN_STATUSES.has(r.status)).length,
      inProgress: requests.filter((r) => r.status === "in_progress").length,
      completed: requests.filter((r) => r.status === "completed").length,
    }),
    [requests]
  );

  return { requests, kpis, loading, error, reload: load };
};
