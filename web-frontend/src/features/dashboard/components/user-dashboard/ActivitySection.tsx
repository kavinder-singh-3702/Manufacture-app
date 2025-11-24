import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { activityService } from "@/src/services/activity";
import { ApiError } from "@/src/lib/api-error";
import { useDashboardContext } from "./context";
import { activityBadgeStyles, buildActivityMetaLine, formatCategory } from "./helpers";
import { SectionHeader } from "./shared";
import type { ActivityEvent } from "@/src/types/activity";

export const ActivitySection = () => {
  const { user } = useDashboardContext();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const response = await activityService.list({ limit: 30 });
        setActivities(response.activities);
        setError(null);
      } catch (err) {
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to load activity.";
        setError(message);
        setActivities([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const isEmpty = !loading && !activities.length && !error;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Recent activity"
        subtitle="Timeline"
        action={
          <button
            type="button"
            onClick={() => fetchActivities(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-2 text-xs font-semibold text-[#5a3042] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">↻</span>
            {refreshing || loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />
      {error ? (
        <div className="rounded-3xl border border-[#f5d0dc] bg-[#fff1f4] px-4 py-3 text-sm text-[#7a3a4a]">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchActivities(true)}
              className="text-xs font-semibold underline decoration-[var(--color-plum)]"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`activity-skeleton-${index}`}
                className="animate-pulse rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4"
              >
                <div className="mb-2 h-4 w-20 rounded-full bg-[var(--surface-muted)]" />
                <div className="mb-1 h-4 w-56 rounded-full bg-[var(--surface-muted)]" />
                <div className="h-3 w-40 rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-soft)] bg-white/70 px-5 py-6">
            <p className="text-base font-semibold text-[#2e1f2c]">No activity yet</p>
            <p className="mt-1 text-sm text-[#5c4451]">
              We will track logins, profile updates, company edits, and verification steps here as you work.
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const categoryKey = (activity.category || activity.action.split(".")[0] || "activity").toLowerCase();
            const badgeClass = activityBadgeStyles[categoryKey] ?? "bg-[var(--surface-muted)] text-[#4b3040]";
            const metaLine = buildActivityMetaLine(activity);
            return (
              <motion.div
                key={activity.id}
                className="flex items-start gap-4 rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                >
                  {formatCategory(categoryKey)}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2e1f2c]">{activity.label}</p>
                  {activity.description ? (
                    <p className="text-xs text-[#5c4451]">{activity.description}</p>
                  ) : null}
                  <p className="text-xs text-[#7a5d6b]">{metaLine}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
