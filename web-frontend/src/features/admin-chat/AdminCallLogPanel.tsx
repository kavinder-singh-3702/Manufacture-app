"use client";

import { useCallback, useEffect, useState } from "react";
import { chatService } from "@/src/services/chat";
import type { AdminCallLogEntry, Pagination } from "@/src/types/chat";

const PAGE_SIZE = 30;

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

/** Read-only call-log queue — backend/src/modules/chat/services/chat.service.js `listCallLogsAdmin`. */
export const AdminCallLogPanel = () => {
  const [logs, setLogs] = useState<AdminCallLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await chatService.listAdminCallLogs({ limit: PAGE_SIZE, offset });
      setLogs((prev) => (append ? [...prev, ...(res.callLogs ?? [])] : (res.callLogs ?? [])));
      setPagination(res.pagination);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(0, false);
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <div className="text-3xl">📞</div>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>No calls logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto p-4">
      {logs.map((log) => (
        <div key={log.id} className="rounded-xl px-4 py-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {log.caller?.displayName || log.caller?.email || "Unknown"} → {log.callee?.displayName || log.callee?.email || "Unknown"}
            </p>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
              {formatDuration(log.durationSeconds)}
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>{new Date(log.startedAt).toLocaleString("en-IN")}</p>
          {log.notes && <p className="mt-1 text-xs" style={{ color: "var(--foreground)" }}>{log.notes}</p>}
        </div>
      ))}
      {pagination.hasMore && (
        <div className="flex justify-center pt-1">
          <button
            onClick={() => void load(pagination.offset + PAGE_SIZE, true)}
            disabled={loadingMore}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ border: "1px solid var(--border)", color: "var(--medium-gray)", backgroundColor: "var(--surface)" }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};
