"use client";

import { useCallback, useEffect, useState } from "react";
import { accountingService } from "@/src/services/accounting";
import { ApiError } from "@/src/lib/api-error";
import type { DashboardData } from "@/src/types/accounting";
import { defaultDateRange, type DateRange } from "../components/DateRangePicker";

/**
 * Shared data source for the accounting pages that render slices of
 * `getDashboard()` — Overview (KPIs), Working capital, and Stock signals.
 * Each page owns its own date range (they're separate routes, not tabs on
 * shared state), but all three fetch through this one hook so the
 * request/loading/error plumbing isn't triplicated.
 */
export const useAccountingDashboard = () => {
  const [range, setRange] = useState<DateRange>(defaultDateRange());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await accountingService.getDashboard({ from: range.from, to: range.to }));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load accounting data");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return { range, setRange, data, loading, error, reload: load };
};
