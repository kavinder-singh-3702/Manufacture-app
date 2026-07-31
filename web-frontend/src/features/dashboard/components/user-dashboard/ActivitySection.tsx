import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { activityService } from "@/src/services/activity";
import { ApiError } from "@/src/lib/api-error";
import { useDashboardContext } from "./context";
import { buildActivityMetaLine, formatCategory } from "./helpers";
import { Card, PageHeader } from "@/src/components/ui/Surface";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonListItem } from "@/src/components/ui/Skeleton";
import { tintBg } from "@/src/lib/color";
import type { ActivityEvent } from "@/src/types/activity";

// Category badge tint — one accent per category, derived via tintBg() rather
// than hand-picked pastel hexes (the pattern that washed out in dark mode).
const activityCategoryColor: Record<string, string> = {
  auth: "var(--primary)",
  user: "var(--accent)",
  company: "var(--success)",
  verification: "var(--warning)",
};

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
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Recent activity"
        actions={
          <button
            type="button"
            onClick={() => fetchActivities(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">↻</span>
            {refreshing || loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />
      {error ? (
        <Card padding="md">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm" style={{ color: "var(--danger-strong)" }}>{error}</span>
            <button
              type="button"
              onClick={() => fetchActivities(true)}
              className="text-xs font-semibold underline decoration-[var(--primary)]"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : null}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <SkeletonListItem key={`activity-skeleton-${index}`} />)
        ) : isEmpty ? (
          <EmptyState
            title="No activity yet"
            description="We will track logins, profile updates, company edits, and verification steps here as you work."
          />
        ) : (
          activities.map((activity) => {
            const categoryKey = (activity.category || activity.action.split(".")[0] || "activity").toLowerCase();
            const badgeColor = activityCategoryColor[categoryKey] ?? "var(--medium-gray)";
            const metaLine = buildActivityMetaLine(activity);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card padding="sm">
                  <div className="flex items-start gap-4">
                    <span
                      className="mt-1 inline-flex flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: tintBg(badgeColor), color: badgeColor }}
                    >
                      {formatCategory(categoryKey)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{activity.label}</p>
                      {activity.description ? (
                        <p className="text-xs" style={{ color: "var(--foreground)" }}>{activity.description}</p>
                      ) : null}
                      <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{metaLine}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
