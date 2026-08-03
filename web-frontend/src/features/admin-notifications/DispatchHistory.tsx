"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  notificationService,
  AdminNotificationBatch,
  NotificationPriority,
} from "@/src/services/notification";
import { ApiError } from "@/src/lib/api-error";
import { useToast } from "@/src/components/ui/Toast";
import { useConfirm } from "@/src/components/ui/ConfirmDialog";
import { DeliveryStatusChips } from "./DeliveryStatusChips";

const PAGE_SIZE = 20;

const relativeDate = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const d = Math.floor(hrs / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const PRIORITY_STYLE: Record<NotificationPriority, { color: string; bg: string }> = {
  low: { color: "#6B7280", bg: "#F3F4F6" },
  normal: { color: "#1E40AF", bg: "#DBEAFE" },
  high: { color: "#92400E", bg: "#FEF3C7" },
  critical: { color: "#991B1B", bg: "#FEE2E2" },
};

const AUDIENCE_LABEL: Record<string, string> = {
  user: "Users",
  company: "Company",
  broadcast: "Broadcast",
};

const PRIORITIES: NotificationPriority[] = ["low", "normal", "high", "critical"];

/**
 * One row per dispatch batch (recipientCount/readCount/deliveryRollup —
 * backend/src/services/notification.service.js `listAdminNotifications`)
 * instead of the old one-row-per-recipient list, which made a broadcast to
 * hundreds of users unreadable (B6). Cancel is hidden once nothing is left
 * to cancel (W7 — previously shown even on fully-delivered rows).
 */
export const DispatchHistory = ({ reloadToken }: { reloadToken: number }) => {
  const toast = useToast();
  const confirm = useConfirm();

  const [history, setHistory] = useState<AdminNotificationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "all">("all");
  const [search, setSearch] = useState("");

  const loadHistory = useCallback(
    async (offset = 0, append = false) => {
      if (append) setLoadingMore(true); else setLoading(true);
      setError(null);
      try {
        const res = await notificationService.listAdmin({
          limit: PAGE_SIZE,
          offset,
          priority: priorityFilter === "all" ? undefined : priorityFilter,
          search: search.trim() || undefined,
        });
        setHistory((prev) => (append ? [...prev, ...(res.notifications ?? [])] : (res.notifications ?? [])));
        setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
      } catch (err) {
        setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [priorityFilter, search]
  );

  useEffect(() => { void loadHistory(0); }, [loadHistory, reloadToken]);

  const isSettled = (batch: AdminNotificationBatch) =>
    batch.cancelledCount + batch.completedCount >= batch.recipientCount;

  const handleCancel = async (batch: AdminNotificationBatch) => {
    const ok = await confirm({
      title: "Cancel this dispatch?",
      message: `This stops delivery to any recipients who haven't received "${batch.title}" yet. Already-delivered copies aren't recalled.`,
      confirmLabel: "Cancel dispatch",
      destructive: true,
    });
    if (!ok) return;

    setActionId(batch.batchId);
    try {
      await notificationService.cancelAdminBatch(batch.batchId);
      toast.success("Dispatch cancelled");
      void loadHistory(0);
    } catch (err) {
      toast.error("Cancel failed", err instanceof ApiError || err instanceof Error ? err.message : undefined);
    } finally {
      setActionId(null);
    }
  };

  const handleResend = async (batch: AdminNotificationBatch) => {
    setActionId(batch.batchId);
    try {
      const res = await notificationService.resendAdminBatch(batch.batchId);
      toast.success("Resent", `Sent to ${res.count ?? batch.recipientCount} recipient${(res.count ?? 0) !== 1 ? "s" : ""}.`);
      void loadHistory(0);
    } catch (err) {
      toast.error("Resend failed", err instanceof ApiError || err instanceof Error ? err.message : undefined);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
          Dispatch history{!loading && pagination.total ? ` · ${pagination.total}` : ""}
        </p>
        <button onClick={() => void loadHistory(0)} disabled={loading}
          className="text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-50"
          style={{ color: "var(--primary)" }}>
          ↻ Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, body, event key…"
          className="min-w-[180px] flex-1 rounded-xl px-3 py-2 text-xs outline-none"
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
        <div className="flex gap-1.5">
          {(["all", ...PRIORITIES] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPriorityFilter(p)}
              className="rounded-full px-2.5 py-1.5 text-[11px] font-bold capitalize transition-all"
              style={{
                backgroundColor: priorityFilter === p ? "var(--primary)" : "var(--surface)",
                color: priorityFilter === p ? "#fff" : "var(--medium-gray)",
                border: "1px solid var(--border)",
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={() => void loadHistory(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !history.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">🔔</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No notifications dispatched yet</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>Use the composer to send your first notification.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {history.map((batch, i) => {
              const pStyle = PRIORITY_STYLE[batch.priority] ?? PRIORITY_STYLE.normal;
              const settled = isSettled(batch);
              const fullyCancelled = batch.cancelledCount >= batch.recipientCount;
              return (
                <motion.div key={batch.batchId}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="space-y-2 rounded-xl px-4 py-3"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", opacity: fullyCancelled ? 0.6 : 1 }}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{batch.title}</p>
                        <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: pStyle.bg, color: pStyle.color }}>{batch.priority}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)", border: "1px solid var(--border)" }}>
                          {AUDIENCE_LABEL[batch.audience] || batch.audience} · {batch.recipientCount} recipient{batch.recipientCount !== 1 ? "s" : ""}
                        </span>
                        {fullyCancelled && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                            cancelled
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--medium-gray)" }}>{batch.body}</p>
                      <p className="text-[11px] mt-1" style={{ color: "var(--medium-gray)" }}>
                        {(batch.channels ?? []).join(", ") || "—"} · {batch.readCount}/{batch.recipientCount} read · {relativeDate(batch.createdAt)}
                        {batch.createdByName ? ` · by ${batch.createdByName}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {!settled && (
                        <button onClick={() => void handleCancel(batch)} disabled={actionId === batch.batchId}
                          className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                          style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>
                          Cancel
                        </button>
                      )}
                      <button onClick={() => void handleResend(batch)} disabled={actionId === batch.batchId}
                        className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                        style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                        Resend
                      </button>
                    </div>
                  </div>
                  <DeliveryStatusChips deliveryRollup={batch.deliveryRollup} />
                </motion.div>
              );
            })}
          </div>
          {pagination.hasMore && (
            <div className="flex justify-center pt-1">
              <button onClick={() => void loadHistory(pagination.offset + PAGE_SIZE, true)} disabled={loadingMore}
                className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
