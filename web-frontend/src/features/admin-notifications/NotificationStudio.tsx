"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  notificationService,
  AdminNotification,
  AdminDispatchPayload,
  NotificationPriority,
  NotificationChannel,
} from "@/src/services/notification";
import { ApiError } from "@/src/lib/api-error";

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
  low:      { color: "#6B7280", bg: "#F3F4F6" },
  normal:   { color: "#1E40AF", bg: "#DBEAFE" },
  high:     { color: "#92400E", bg: "#FEF3C7" },
  critical: { color: "#991B1B", bg: "#FEE2E2" },
};

const AUDIENCES: { key: NonNullable<AdminDispatchPayload["audience"]>; label: string; hint: string }[] = [
  { key: "broadcast", label: "Broadcast",  hint: "All users" },
  { key: "user",      label: "Single user", hint: "By user ID" },
  { key: "company",   label: "Company",     hint: "By company ID" },
];

const PRIORITIES: NotificationPriority[] = ["low", "normal", "high", "critical"];
const ALL_CHANNELS: NotificationChannel[] = ["in_app", "push", "email", "sms"];
const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: "In-app", push: "Push", email: "Email", sms: "SMS", webhook: "Webhook",
};

export const NotificationStudio = () => {
  // Compose state
  const [audience, setAudience] = useState<NonNullable<AdminDispatchPayload["audience"]>>("broadcast");
  const [targetId, setTargetId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<NotificationPriority>("normal");
  const [channels, setChannels] = useState<NotificationChannel[]>(["in_app", "push"]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // History state
  const [history, setHistory] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadHistory = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await notificationService.listAdmin({ limit: PAGE_SIZE, offset });
      setHistory((prev) => append ? [...prev, ...(res.notifications ?? [])] : (res.notifications ?? []));
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadHistory(0); }, [loadHistory]);

  const toggleChannel = (ch: NotificationChannel) =>
    setChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);

  const canSend = title.trim() && body.trim() && channels.length > 0 &&
    (audience === "broadcast" || targetId.trim());

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setSendResult(null);
    try {
      const payload: AdminDispatchPayload = {
        audience,
        title: title.trim(),
        body: body.trim(),
        eventKey: "admin.broadcast",
        topic: "admin",
        priority,
        channels,
        ...(audience === "user" ? { userId: targetId.trim() } : {}),
        ...(audience === "company" ? { companyId: targetId.trim() } : {}),
      };
      const res = await notificationService.dispatch(payload);
      const count = res.count ?? (res.notificationIds?.length ?? 1);
      setSendResult({ ok: true, msg: `Sent to ${count} recipient${count !== 1 ? "s" : ""}.` });
      setTitle("");
      setBody("");
      setTargetId("");
      loadHistory(0);
    } catch (err) {
      setSendResult({ ok: false, msg: err instanceof ApiError || err instanceof Error ? err.message : "Dispatch failed" });
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (id: string) => {
    setActionId(id);
    try {
      await notificationService.cancelAdmin(id);
      loadHistory(0);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setActionId(null);
    }
  };

  const handleResend = async (id: string) => {
    setActionId(id);
    try {
      await notificationService.resendAdmin(id);
      loadHistory(0);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Resend failed");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Admin</p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Notification Studio</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>Compose and dispatch notifications, review delivery history.</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* ── Compose ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-2xl p-5 self-start"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>Compose</p>

          {/* Audience */}
          <div>
            <Label>Audience</Label>
            <div className="grid grid-cols-3 gap-2">
              {AUDIENCES.map((a) => (
                <button key={a.key} type="button" onClick={() => setAudience(a.key)}
                  className="rounded-xl py-2 text-center transition-all"
                  style={{
                    backgroundColor: audience === a.key ? "var(--primary)" : "var(--surface)",
                    color: audience === a.key ? "#fff" : "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}>
                  <div className="text-xs font-bold">{a.label}</div>
                  <div className="text-[10px] opacity-70">{a.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {audience !== "broadcast" && (
            <div>
              <Label>{audience === "user" ? "User ID" : "Company ID"}</Label>
              <input value={targetId} onChange={(e) => setTargetId(e.target.value)}
                placeholder={`Enter ${audience} ID…`}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
          )}

          <div>
            <Label>Title</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
              placeholder="Notification title"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>

          <div>
            <Label>Body</Label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={500}
              placeholder="Notification message…"
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>

          <div>
            <Label>Priority</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className="flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all"
                  style={{
                    backgroundColor: priority === p ? PRIORITY_STYLE[p].bg : "var(--surface)",
                    color: priority === p ? PRIORITY_STYLE[p].color : "var(--medium-gray)",
                    border: priority === p ? `1px solid ${PRIORITY_STYLE[p].color}40` : "1px solid var(--border)",
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_CHANNELS.map((ch) => (
                <button key={ch} type="button" onClick={() => toggleChannel(ch)}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                  style={{
                    backgroundColor: channels.includes(ch) ? "var(--primary)" : "var(--surface)",
                    color: channels.includes(ch) ? "#fff" : "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}>
                  {CHANNEL_LABEL[ch]}
                </button>
              ))}
            </div>
          </div>

          {sendResult && (
            <p className="text-xs font-semibold" style={{ color: sendResult.ok ? "#059669" : "#DC2626" }}>
              {sendResult.ok ? "✓ " : "⚠ "}{sendResult.msg}
            </p>
          )}

          <button onClick={handleSend} disabled={!canSend || sending}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)" }}>
            {sending ? "Dispatching…" : "Dispatch notification"}
          </button>
        </motion.div>

        {/* ── History ──────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
              Dispatch history{!loading && pagination.total ? ` · ${pagination.total}` : ""}
            </p>
            <button onClick={() => loadHistory(0)} disabled={loading}
              className="text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ color: "var(--primary)" }}>
              ↻ Refresh
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
              <span>{error}</span>
              <button onClick={() => loadHistory(0)} className="text-xs font-bold underline ml-4">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
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
                {history.map((n, i) => {
                  const pStyle = PRIORITY_STYLE[n.priority] ?? PRIORITY_STYLE.normal;
                  const cancelled = n.lifecycleStatus === "cancelled";
                  return (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className="rounded-xl px-4 py-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", opacity: cancelled ? 0.6 : 1 }}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{n.title}</p>
                            <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: pStyle.bg, color: pStyle.color }}>{n.priority}</span>
                            {n.lifecycleStatus && (
                              <span className="text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)", border: "1px solid var(--border)" }}>
                                {n.lifecycleStatus}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--medium-gray)" }}>{n.body}</p>
                          <p className="text-[11px] mt-1" style={{ color: "var(--medium-gray)" }}>
                            {(n.channels ?? []).map((c) => CHANNEL_LABEL[c]).join(", ") || "—"} · {relativeDate(n.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          {!cancelled && (
                            <button onClick={() => handleCancel(n.id)} disabled={actionId === n.id}
                              className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                              style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>
                              Cancel
                            </button>
                          )}
                          <button onClick={() => handleResend(n.id)} disabled={actionId === n.id}
                            className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                            Resend
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {pagination.hasMore && (
                <div className="flex justify-center pt-1">
                  <button onClick={() => loadHistory(pagination.offset + PAGE_SIZE, true)} disabled={loadingMore}
                    className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
    {children}
  </label>
);
